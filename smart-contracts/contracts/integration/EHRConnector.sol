// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title EHRConnector
 * @dev Manages connections with existing Electronic Health Record systems
 */
contract EHRConnector is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EHR_PROVIDER_ROLE = keccak256("EHR_PROVIDER_ROLE");

    IUHCIdentity public identityContract;

    enum EHRVendor {
        Epic,
        Cerner,
        Allscripts,
        Meditech,
        AthenaHealth,
        Custom
    }

    struct EHRSystem {
        string name;
        string endpoint;
        EHRVendor vendor;
        string apiVersion;
        bool active;
        address provider;
        mapping(address => bool) authorizedUsers;
    }

    struct DataAccess {
        bytes32 ehrId;
        uint256 grantedTime;
        uint256 expiryTime;
        bool active;
        string[] permissions;
    }

    mapping(bytes32 => EHRSystem) public ehrSystems;
    mapping(address => mapping(bytes32 => DataAccess)) public userAccess;
    mapping(bytes32 => mapping(bytes32 => bool)) public dataValidation;

    event EHRSystemRegistered(
        bytes32 indexed ehrId,
        string name,
        EHRVendor vendor
    );
    
    event AccessGranted(
        bytes32 indexed ehrId,
        address indexed user,
        uint256 expiryTime
    );
    
    event DataValidated(
        bytes32 indexed ehrId,
        bytes32 indexed dataHash,
        bool valid
    );
    
    event DataSynchronized(
        bytes32 indexed ehrId,
        bytes32 indexed dataHash,
        uint256 timestamp
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function registerEHRSystem(
        string memory _name,
        string memory _endpoint,
        EHRVendor _vendor,
        string memory _apiVersion
    ) external onlyRole(ADMIN_ROLE) whenNotPaused returns (bytes32) {
        require(
            identityContract.hasRole(msg.sender, IUHCIdentity.IdentityType.Provider),
            "Not a provider"
        );

        bytes32 ehrId = keccak256(abi.encodePacked(
            _name,
            _endpoint,
            _vendor,
            block.timestamp
        ));

        require(ehrSystems[ehrId].provider == address(0), "EHR exists");

        EHRSystem storage system = ehrSystems[ehrId];
        system.name = _name;
        system.endpoint = _endpoint;
        system.vendor = _vendor;
        system.apiVersion = _apiVersion;
        system.active = true;
        system.provider = msg.sender;

        _grantRole(EHR_PROVIDER_ROLE, msg.sender);
        emit EHRSystemRegistered(ehrId, _name, _vendor);
        return ehrId;
    }

    function grantAccess(
        bytes32 _ehrId,
        address _user,
        uint256 _duration,
        string[] memory _permissions
    ) external whenNotPaused {
        require(ehrSystems[_ehrId].active, "EHR not active");
        require(
            ehrSystems[_ehrId].provider == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(
            identityContract.isVerified(_user),
            "User not verified"
        );

        DataAccess storage access = userAccess[_user][_ehrId];
        access.ehrId = _ehrId;
        access.grantedTime = block.timestamp;
        access.expiryTime = block.timestamp + _duration;
        access.active = true;
        access.permissions = _permissions;

        emit AccessGranted(_ehrId, _user, access.expiryTime);
    }

    function validateData(
        bytes32 _ehrId,
        bytes32 _dataHash,
        bytes memory _data,
        bytes memory _signature
    ) external whenNotPaused returns (bool) {
        require(ehrSystems[_ehrId].active, "EHR not active");
        require(
            hasRole(EHR_PROVIDER_ROLE, msg.sender),
            "Not EHR provider"
        );

        bool isValid = _verifyDataSignature(_data, _signature, _ehrId);
        dataValidation[_ehrId][_dataHash] = isValid;

        emit DataValidated(_ehrId, _dataHash, isValid);
        return isValid;
    }

    function synchronizeData(
        bytes32 _ehrId,
        bytes32 _dataHash,
        bytes memory /* _data */,
        string memory _dataType
    ) external whenNotPaused {
        require(ehrSystems[_ehrId].active, "EHR not active");
        DataAccess storage access = userAccess[msg.sender][_ehrId];
        
        require(access.active, "No active access");
        require(block.timestamp <= access.expiryTime, "Access expired");
        require(
            _hasPermission(access.permissions, _dataType),
            "Permission denied"
        );

        emit DataSynchronized(_ehrId, _dataHash, block.timestamp);
    }

    function getEHRSystem(
        bytes32 _ehrId
    ) external view returns (
        string memory name,
        string memory endpoint,
        EHRVendor vendor,
        string memory apiVersion,
        bool active,
        address provider
    ) {
        EHRSystem storage system = ehrSystems[_ehrId];
        return (
            system.name,
            system.endpoint,
            system.vendor,
            system.apiVersion,
            system.active,
            system.provider
        );
    }

    function getUserAccess(
        address _user,
        bytes32 _ehrId
    ) external view returns (DataAccess memory) {
        return userAccess[_user][_ehrId];
    }

    function isDataValid(
        bytes32 _ehrId,
        bytes32 _dataHash
    ) external view returns (bool) {
        return dataValidation[_ehrId][_dataHash];
    }

    function _verifyDataSignature(
        bytes memory _data,
        bytes memory _signature,
        bytes32 _ehrId
    ) internal view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(_data, _ehrId));
        bytes32 messageHash = hash.toEthSignedMessageHash();
        address signer = messageHash.recover(_signature);
        
        return hasRole(EHR_PROVIDER_ROLE, signer);
    }

    function _hasPermission(
        string[] memory _permissions,
        string memory _dataType
    ) internal pure returns (bool) {
        for (uint i = 0; i < _permissions.length; i++) {
            if (keccak256(bytes(_permissions[i])) == keccak256(bytes(_dataType))) {
                return true;
            }
        }
        return false;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function deactivateEHR(
        bytes32 _ehrId
    ) external onlyRole(ADMIN_ROLE) {
        require(ehrSystems[_ehrId].active, "EHR not active");
        ehrSystems[_ehrId].active = false;
    }
}
