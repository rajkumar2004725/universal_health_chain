// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TimeLockedAccess
 * @dev Contract for managing time-based access control in the Universal Health Chain
 */
contract TimeLockedAccess is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GRANTOR_ROLE = keccak256("GRANTOR_ROLE");

    struct AccessGrant {
        address grantee;          // Address being granted access
        uint256 startTime;        // When access begins
        uint256 endTime;          // When access expires
        bytes32 resourceId;       // Resource identifier
        AccessType accessType;    // Type of access granted
        bool isActive;           // Whether the grant is active
    }

    enum AccessType {
        Read,           // Read-only access
        Write,          // Write access
        Full,           // Full access
        Emergency       // Emergency access (bypasses normal restrictions)
    }

    // Mapping from grant ID to AccessGrant
    mapping(bytes32 => AccessGrant) public accessGrants;
    
    // Mapping from address to their grant IDs
    mapping(address => bytes32[]) public userGrants;
    
    // Mapping from resource to authorized grantees
    mapping(bytes32 => mapping(address => bool)) public resourceAccess;

    event AccessGranted(
        bytes32 indexed grantId,
        address indexed grantee,
        bytes32 indexed resourceId,
        AccessType accessType,
        uint256 startTime,
        uint256 endTime
    );
    event AccessRevoked(bytes32 indexed grantId, address indexed grantee);
    event EmergencyAccessUsed(
        address indexed user,
        bytes32 indexed resourceId,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GRANTOR_ROLE, msg.sender);
    }

    /**
     * @dev Grant time-locked access to a resource
     * @param _grantee Address to grant access to
     * @param _resourceId Identifier of the resource
     * @param _accessType Type of access to grant
     * @param _startTime When access begins
     * @param _duration Duration of access in seconds
     */
    function grantAccess(
        address _grantee,
        bytes32 _resourceId,
        AccessType _accessType,
        uint256 _startTime,
        uint256 _duration
    ) external onlyRole(GRANTOR_ROLE) whenNotPaused returns (bytes32) {
        require(_grantee != address(0), "Invalid grantee address");
        require(_startTime >= block.timestamp, "Start time must be in future");
        require(_duration > 0, "Duration must be positive");

        bytes32 grantId = keccak256(abi.encodePacked(
            _grantee,
            _resourceId,
            _startTime,
            block.timestamp
        ));

        uint256 endTime = _startTime + _duration;
        
        AccessGrant memory newGrant = AccessGrant({
            grantee: _grantee,
            startTime: _startTime,
            endTime: endTime,
            resourceId: _resourceId,
            accessType: _accessType,
            isActive: true
        });

        accessGrants[grantId] = newGrant;
        userGrants[_grantee].push(grantId);
        resourceAccess[_resourceId][_grantee] = true;

        emit AccessGranted(
            grantId,
            _grantee,
            _resourceId,
            _accessType,
            _startTime,
            endTime
        );

        return grantId;
    }

    /**
     * @dev Revoke access grant
     * @param _grantId ID of the grant to revoke
     */
    function revokeAccess(bytes32 _grantId) external onlyRole(GRANTOR_ROLE) {
        AccessGrant storage grant = accessGrants[_grantId];
        require(grant.isActive, "Grant not active");

        grant.isActive = false;
        resourceAccess[grant.resourceId][grant.grantee] = false;

        emit AccessRevoked(_grantId, grant.grantee);
    }

    /**
     * @dev Check if an address has active access to a resource
     * @param _user Address to check
     * @param _resourceId Resource to check access for
     * @param _requiredAccess Minimum required access type
     */
    function hasAccess(
        address _user,
        bytes32 _resourceId,
        AccessType _requiredAccess
    ) external view returns (bool) {
        if (!resourceAccess[_resourceId][_user]) {
            return false;
        }

        bytes32[] storage userGrantIds = userGrants[_user];
        for (uint256 i = 0; i < userGrantIds.length; i++) {
            AccessGrant storage grant = accessGrants[userGrantIds[i]];
            
            if (grant.isActive &&
                grant.resourceId == _resourceId &&
                block.timestamp >= grant.startTime &&
                block.timestamp <= grant.endTime &&
                (grant.accessType == AccessType.Emergency || // Emergency access bypasses type check
                 uint256(grant.accessType) >= uint256(_requiredAccess))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @dev Record emergency access use
     * @param _user Address using emergency access
     * @param _resourceId Resource being accessed
     */
    function recordEmergencyAccess(
        address _user,
        bytes32 _resourceId
    ) external onlyRole(GRANTOR_ROLE) {
        emit EmergencyAccessUsed(_user, _resourceId, block.timestamp);
    }

    /**
     * @dev Get all active grants for a user
     * @param _user Address to check
     */
    function getUserGrants(
        address _user
    ) external view returns (AccessGrant[] memory) {
        bytes32[] storage grantIds = userGrants[_user];
        uint256 activeCount = 0;

        // First count active grants
        for (uint256 i = 0; i < grantIds.length; i++) {
            if (accessGrants[grantIds[i]].isActive) {
                activeCount++;
            }
        }

        // Then create array of active grants
        AccessGrant[] memory activeGrants = new AccessGrant[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < grantIds.length; i++) {
            AccessGrant storage grant = accessGrants[grantIds[i]];
            if (grant.isActive) {
                activeGrants[index] = grant;
                index++;
            }
        }

        return activeGrants;
    }

    /**
     * @dev Extend access grant duration
     * @param _grantId ID of the grant to extend
     * @param _additionalDuration Additional time in seconds
     */
    function extendAccess(
        bytes32 _grantId,
        uint256 _additionalDuration
    ) external onlyRole(GRANTOR_ROLE) whenNotPaused {
        require(_additionalDuration > 0, "Duration must be positive");
        
        AccessGrant storage grant = accessGrants[_grantId];
        require(grant.isActive, "Grant not active");
        require(grant.endTime > block.timestamp, "Grant expired");

        grant.endTime += _additionalDuration;

        emit AccessGranted(
            _grantId,
            grant.grantee,
            grant.resourceId,
            grant.accessType,
            grant.startTime,
            grant.endTime
        );
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
