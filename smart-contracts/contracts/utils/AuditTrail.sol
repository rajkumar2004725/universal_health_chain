// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title AuditTrail
 * @dev Manages comprehensive audit trails for all system activities
 */
contract AuditTrail is AccessControl, Pausable {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant SYSTEM_ROLE = keccak256("SYSTEM_ROLE");

    IUHCIdentity public identityContract;

    enum ActionType {
        DataAccess,      // Health record access
        DataModification,// Record updates
        Authentication,  // Login/logout events
        Authorization,   // Permission changes
        SystemConfig,    // System configuration
        Compliance,      // Compliance checks
        Integration,     // External system integration
        Emergency,       // Emergency access
        Financial,       // Financial transactions
        Administrative  // Admin actions
    }

    enum Severity {
        Info,
        Low,
        Medium,
        High,
        Critical
    }

    struct AuditEvent {
        uint256 timestamp;
        address actor;
        ActionType actionType;
        Severity severity;
        string description;
        bytes32 dataHash;
        bool success;
        string metadata;
    }

    struct AuditFilter {
        uint256 startTime;
        uint256 endTime;
        address actor;
        ActionType actionType;
        Severity severity;
        bool onlySuccessful;
    }

    Counters.Counter private eventCounter;
    mapping(uint256 => AuditEvent) public auditEvents;
    mapping(address => uint256[]) public userEvents;
    mapping(ActionType => uint256[]) public actionTypeEvents;
    mapping(Severity => uint256[]) public severityEvents;

    // Retention policy in seconds
    uint256 public retentionPeriod = 7 * 365 days; // 7 years

    event AuditEventLogged(
        uint256 indexed eventId,
        address indexed actor,
        ActionType indexed actionType,
        Severity severity
    );
    
    event RetentionPolicyUpdated(uint256 newPeriod);
    
    event EventsPurged(uint256 count, uint256 timestamp);

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }

    function logAuditEvent(
        address _actor,
        ActionType _actionType,
        Severity _severity,
        string memory _description,
        bytes32 _dataHash,
        bool _success,
        string memory _metadata
    ) external onlyRole(SYSTEM_ROLE) whenNotPaused returns (uint256) {
        uint256 eventId = eventCounter.current();
        eventCounter.increment();

        AuditEvent storage event_ = auditEvents[eventId];
        event_.timestamp = block.timestamp;
        event_.actor = _actor;
        event_.actionType = _actionType;
        event_.severity = _severity;
        event_.description = _description;
        event_.dataHash = _dataHash;
        event_.success = _success;
        event_.metadata = _metadata;

        userEvents[_actor].push(eventId);
        actionTypeEvents[_actionType].push(eventId);
        severityEvents[_severity].push(eventId);

        emit AuditEventLogged(eventId, _actor, _actionType, _severity);
        return eventId;
    }

    function getAuditEvent(
        uint256 _eventId
    ) external view returns (AuditEvent memory) {
        require(_eventId < eventCounter.current(), "Event not found");
        return auditEvents[_eventId];
    }

    function getUserEvents(
        address _user,
        uint256 _offset,
        uint256 _limit
    ) external view returns (AuditEvent[] memory) {
        uint256[] storage userEventIds = userEvents[_user];
        return _getEventRange(userEventIds, _offset, _limit);
    }

    function getActionTypeEvents(
        ActionType _actionType,
        uint256 _offset,
        uint256 _limit
    ) external view returns (AuditEvent[] memory) {
        uint256[] storage actionEventIds = actionTypeEvents[_actionType];
        return _getEventRange(actionEventIds, _offset, _limit);
    }

    function getSeverityEvents(
        Severity _severity,
        uint256 _offset,
        uint256 _limit
    ) external view returns (AuditEvent[] memory) {
        uint256[] storage severityEventIds = severityEvents[_severity];
        return _getEventRange(severityEventIds, _offset, _limit);
    }

    function filterEvents(
        AuditFilter memory _filter,
        uint256 _offset,
        uint256 _limit
    ) external view returns (AuditEvent[] memory) {
        uint256[] memory filteredIds = new uint256[](eventCounter.current());
        uint256 count = 0;

        for (uint256 i = 0; i < eventCounter.current(); i++) {
            if (_matchesFilter(auditEvents[i], _filter)) {
                filteredIds[count] = i;
                count++;
            }
        }

        return _getEventRange(filteredIds, _offset, _limit);
    }

    function updateRetentionPolicy(
        uint256 _newPeriod
    ) external onlyRole(ADMIN_ROLE) {
        require(_newPeriod > 0, "Invalid retention period");
        retentionPeriod = _newPeriod;
        emit RetentionPolicyUpdated(_newPeriod);
    }

    function purgeOldEvents() external onlyRole(ADMIN_ROLE) whenNotPaused {
        uint256 cutoffTime = block.timestamp - retentionPeriod;
        uint256 purgeCount = 0;

        for (uint256 i = 0; i < eventCounter.current(); i++) {
            if (auditEvents[i].timestamp < cutoffTime) {
                delete auditEvents[i];
                purgeCount++;
            }
        }

        emit EventsPurged(purgeCount, block.timestamp);
    }

    function _getEventRange(
        uint256[] memory _eventIds,
        uint256 _offset,
        uint256 _limit
    ) internal view returns (AuditEvent[] memory) {
        uint256 end = _offset + _limit;
        if (end > _eventIds.length) {
            end = _eventIds.length;
        }
        require(_offset < end, "Invalid range");

        AuditEvent[] memory events = new AuditEvent[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            events[i - _offset] = auditEvents[_eventIds[i]];
        }

        return events;
    }

    function _matchesFilter(
        AuditEvent memory _event,
        AuditFilter memory _filter
    ) internal pure returns (bool) {
        if (_filter.startTime > 0 && _event.timestamp < _filter.startTime) return false;
        if (_filter.endTime > 0 && _event.timestamp > _filter.endTime) return false;
        if (_filter.actor != address(0) && _event.actor != _filter.actor) return false;
        if (_event.actionType != _filter.actionType) return false;
        if (_event.severity != _filter.severity) return false;
        if (_filter.onlySuccessful && !_event.success) return false;
        return true;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
