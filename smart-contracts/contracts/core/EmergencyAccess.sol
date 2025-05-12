// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title EmergencyAccess
 * @dev Manages emergency access to health records in critical situations
 */
contract EmergencyAccess is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMERGENCY_PROVIDER_ROLE = keccak256("EMERGENCY_PROVIDER_ROLE");

    IUHCIdentity public identityContract;

    struct EmergencyRequest {
        address provider;
        uint256 timestamp;
        string reason;
        bool isActive;
        bool isApproved;
        uint256 expiryTime;
    }

    mapping(address => EmergencyRequest[]) public emergencyRequests;
    mapping(address => mapping(address => bool)) public activeEmergencyAccess;
    
    uint256 public constant MAX_EMERGENCY_DURATION = 24 hours;

    event EmergencyAccessRequested(
        address indexed patient,
        address indexed provider,
        uint256 timestamp,
        string reason
    );
    
    event EmergencyAccessGranted(
        address indexed patient,
        address indexed provider,
        uint256 expiryTime
    );
    
    event EmergencyAccessRevoked(
        address indexed patient,
        address indexed provider
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyEmergencyProvider() {
        require(
            hasRole(EMERGENCY_PROVIDER_ROLE, msg.sender),
            "EmergencyAccess: Caller is not emergency provider"
        );
        _;
    }

    function requestEmergencyAccess(
        address _patient,
        string calldata _reason
    ) external onlyEmergencyProvider whenNotPaused {
        require(
            !activeEmergencyAccess[_patient][msg.sender],
            "Emergency access already active"
        );

        EmergencyRequest memory request = EmergencyRequest({
            provider: msg.sender,
            timestamp: block.timestamp,
            reason: _reason,
            isActive: true,
            isApproved: false,
            expiryTime: 0
        });

        emergencyRequests[_patient].push(request);

        emit EmergencyAccessRequested(
            _patient,
            msg.sender,
            block.timestamp,
            _reason
        );
    }

    function grantEmergencyAccess(
        address _provider,
        uint256 _duration
    ) external whenNotPaused {
        require(_duration <= MAX_EMERGENCY_DURATION, "Duration exceeds maximum");
        require(
            !activeEmergencyAccess[msg.sender][_provider],
            "Emergency access already granted"
        );

        uint256 expiryTime = block.timestamp + _duration;
        activeEmergencyAccess[msg.sender][_provider] = true;

        // Update the latest request
        EmergencyRequest[] storage requests = emergencyRequests[msg.sender];
        for (uint i = requests.length; i > 0; i--) {
            if (requests[i-1].provider == _provider && requests[i-1].isActive) {
                requests[i-1].isApproved = true;
                requests[i-1].expiryTime = expiryTime;
                break;
            }
        }

        emit EmergencyAccessGranted(msg.sender, _provider, expiryTime);
    }

    function revokeEmergencyAccess(
        address _provider
    ) external whenNotPaused {
        require(
            activeEmergencyAccess[msg.sender][_provider],
            "No active emergency access"
        );

        activeEmergencyAccess[msg.sender][_provider] = false;

        // Update the latest request
        EmergencyRequest[] storage requests = emergencyRequests[msg.sender];
        for (uint i = requests.length; i > 0; i--) {
            if (requests[i-1].provider == _provider && requests[i-1].isActive) {
                requests[i-1].isActive = false;
                break;
            }
        }

        emit EmergencyAccessRevoked(msg.sender, _provider);
    }

    function hasEmergencyAccess(
        address _patient,
        address _provider
    ) external view returns (bool) {
        if (!activeEmergencyAccess[_patient][_provider]) {
            return false;
        }

        // Check the latest request's expiry time
        EmergencyRequest[] storage requests = emergencyRequests[_patient];
        for (uint i = requests.length; i > 0; i--) {
            if (requests[i-1].provider == _provider && requests[i-1].isActive) {
                return block.timestamp <= requests[i-1].expiryTime;
            }
        }

        return false;
    }

    function getEmergencyRequests(
        address _patient
    ) external view returns (EmergencyRequest[] memory) {
        return emergencyRequests[_patient];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
