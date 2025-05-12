// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAccessControl
 * @dev Interface for managing access control and permissions in the Universal Health Chain
 */
interface IUHCAccessControl {
    enum AccessLevel {
        None,
        Read,
        Write,
        Admin
    }

    struct Permission {
        address grantee;
        AccessLevel level;
        uint256 expiryTime;
        bool emergencyAccess;
    }

    event AccessGranted(
        address indexed resource,
        address indexed grantee,
        AccessLevel level,
        uint256 expiryTime
    );
    event AccessRevoked(address indexed resource, address indexed grantee);
    event EmergencyAccessGranted(
        address indexed resource,
        address indexed grantee,
        uint256 duration
    );
    event EmergencyAccessRevoked(address indexed resource, address indexed grantee);

    function grantAccess(
        address _resource,
        address _grantee,
        AccessLevel _level,
        uint256 _expiryTime
    ) external;

    function revokeAccess(address _resource, address _grantee) external;

    function grantEmergencyAccess(
        address _resource,
        address _grantee,
        uint256 _duration
    ) external;

    function revokeEmergencyAccess(address _resource, address _grantee) external;

    function getPermission(address _resource, address _grantee)
        external
        view
        returns (Permission memory);

    function hasAccess(
        address _resource,
        address _grantee,
        AccessLevel _requiredLevel
    ) external view returns (bool);

    function hasEmergencyAccess(address _resource, address _grantee)
        external
        view
        returns (bool);
}
