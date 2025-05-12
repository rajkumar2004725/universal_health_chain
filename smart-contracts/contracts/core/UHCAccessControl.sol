// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IUHCAccessControl.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title UHCAccessControl
 * @dev Implementation of the access control system for Universal Health Chain
 */
contract UHCAccessControl is IUHCAccessControl, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    IUHCIdentity public identityContract;

    mapping(address => mapping(address => Permission)) private permissions;
    mapping(address => mapping(address => uint256)) private emergencyAccessExpiry;

    event EmergencyAccessRequested(
        address indexed resource,
        address indexed requester,
        string reason
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyVerified() {
        require(
            identityContract.isVerified(msg.sender),
            "UHCAccessControl: Caller not verified"
        );
        _;
    }

    function grantAccess(
        address _resource,
        address _grantee,
        AccessLevel _level,
        uint256 _expiryTime
    ) external override onlyVerified whenNotPaused {
        require(_expiryTime > block.timestamp, "Invalid expiry time");
        require(
            identityContract.isVerified(_grantee),
            "Grantee not verified"
        );

        permissions[_resource][_grantee] = Permission({
            grantee: _grantee,
            level: _level,
            expiryTime: _expiryTime,
            emergencyAccess: false
        });

        emit AccessGranted(_resource, _grantee, _level, _expiryTime);
    }

    function revokeAccess(
        address _resource,
        address _grantee
    ) external override onlyVerified whenNotPaused {
        require(
            msg.sender == _resource || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to revoke access"
        );

        delete permissions[_resource][_grantee];
        emit AccessRevoked(_resource, _grantee);
    }

    function grantEmergencyAccess(
        address _resource,
        address _grantee,
        uint256 _duration
    ) external override onlyRole(EMERGENCY_ROLE) whenNotPaused {
        require(
            identityContract.isVerified(_grantee),
            "Grantee not verified"
        );
        require(_duration <= 24 hours, "Duration too long");

        uint256 expiryTime = block.timestamp + _duration;
        permissions[_resource][_grantee].emergencyAccess = true;
        emergencyAccessExpiry[_resource][_grantee] = expiryTime;

        emit EmergencyAccessGranted(_resource, _grantee, _duration);
    }

    function revokeEmergencyAccess(
        address _resource,
        address _grantee
    ) external override onlyRole(EMERGENCY_ROLE) whenNotPaused {
        permissions[_resource][_grantee].emergencyAccess = false;
        emergencyAccessExpiry[_resource][_grantee] = 0;

        emit EmergencyAccessRevoked(_resource, _grantee);
    }

    function requestEmergencyAccess(
        address _resource,
        string calldata _reason
    ) external onlyVerified whenNotPaused {
        emit EmergencyAccessRequested(_resource, msg.sender, _reason);
    }

    function getPermission(
        address _resource,
        address _grantee
    ) external view override returns (Permission memory) {
        return permissions[_resource][_grantee];
    }

    function hasAccess(
        address _resource,
        address _grantee,
        AccessLevel _requiredLevel
    ) external view override returns (bool) {
        Permission memory permission = permissions[_resource][_grantee];
        
        if (permission.emergencyAccess && 
            emergencyAccessExpiry[_resource][_grantee] > block.timestamp) {
            return true;
        }

        return permission.level >= _requiredLevel && 
               permission.expiryTime > block.timestamp;
    }

    function hasEmergencyAccess(
        address _resource,
        address _grantee
    ) external view override returns (bool) {
        return permissions[_resource][_grantee].emergencyAccess && 
               emergencyAccessExpiry[_resource][_grantee] > block.timestamp;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
