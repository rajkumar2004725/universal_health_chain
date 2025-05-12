// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title HealthDataStorage
 * @dev Manages storage and access control for health data with privacy features
 */
contract HealthDataStorage is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DATA_PROVIDER_ROLE = keccak256("DATA_PROVIDER_ROLE");

    IUHCIdentity public identityContract;

    struct HealthData {
        bytes32 dataHash;
        string ipfsHash;
        address owner;
        uint256 timestamp;
        bool active;
        bytes32 encryptionKey;
        string dataType;
        bytes32 metadataHash;
    }

    struct AccessGrant {
        address grantee;
        uint256 expiryTime;
        bytes32 encryptedKey;
        bool active;
        string[] permissions;
    }

    mapping(bytes32 => HealthData) public healthData;
    mapping(bytes32 => mapping(address => AccessGrant)) public dataAccess;
    mapping(address => bytes32[]) public userData;
    mapping(string => bytes32[]) public dataByType;

    event DataStored(
        bytes32 indexed dataId,
        address indexed owner,
        string dataType
    );
    
    event AccessGranted(
        bytes32 indexed dataId,
        address indexed grantee,
        uint256 expiryTime
    );
    
    event DataUpdated(
        bytes32 indexed dataId,
        bytes32 newDataHash
    );
    
    event DataDeactivated(
        bytes32 indexed dataId
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DATA_PROVIDER_ROLE, msg.sender);
    }

    function storeData(
        bytes32 _dataHash,
        string memory _ipfsHash,
        bytes32 _encryptionKey,
        string memory _dataType,
        bytes32 _metadataHash,
        bytes memory _signature
    ) external whenNotPaused returns (bytes32) {
        require(
            identityContract.isVerified(msg.sender),
            "User not verified"
        );

        bytes32 messageHash = keccak256(abi.encodePacked(
            _dataHash,
            _ipfsHash,
            _dataType,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        bytes32 dataId = keccak256(abi.encodePacked(
            msg.sender,
            _dataHash,
            block.timestamp
        ));

        healthData[dataId] = HealthData({
            dataHash: _dataHash,
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            active: true,
            encryptionKey: _encryptionKey,
            dataType: _dataType,
            metadataHash: _metadataHash
        });

        userData[msg.sender].push(dataId);
        dataByType[_dataType].push(dataId);
        emit DataStored(dataId, msg.sender, _dataType);
        
        return dataId;
    }

    function grantAccess(
        bytes32 _dataId,
        address _grantee,
        uint256 _expiryTime,
        bytes32 _encryptedKey,
        string[] memory _permissions
    ) external whenNotPaused {
        require(
            healthData[_dataId].owner == msg.sender,
            "Not data owner"
        );
        require(
            healthData[_dataId].active,
            "Data not active"
        );
        require(_expiryTime > block.timestamp, "Invalid expiry time");
        require(
            identityContract.isVerified(_grantee),
            "Grantee not verified"
        );

        dataAccess[_dataId][_grantee] = AccessGrant({
            grantee: _grantee,
            expiryTime: _expiryTime,
            encryptedKey: _encryptedKey,
            active: true,
            permissions: _permissions
        });

        emit AccessGranted(_dataId, _grantee, _expiryTime);
    }

    function updateData(
        bytes32 _dataId,
        bytes32 _newDataHash,
        string memory _newIpfsHash,
        bytes32 _newEncryptionKey,
        bytes32 _newMetadataHash,
        bytes memory _signature
    ) external whenNotPaused {
        require(
            healthData[_dataId].owner == msg.sender,
            "Not data owner"
        );
        require(
            healthData[_dataId].active,
            "Data not active"
        );

        bytes32 messageHash = keccak256(abi.encodePacked(
            _dataId,
            _newDataHash,
            _newIpfsHash,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        healthData[_dataId].dataHash = _newDataHash;
        healthData[_dataId].ipfsHash = _newIpfsHash;
        healthData[_dataId].timestamp = block.timestamp;
        healthData[_dataId].encryptionKey = _newEncryptionKey;
        healthData[_dataId].metadataHash = _newMetadataHash;

        emit DataUpdated(_dataId, _newDataHash);
    }

    function deactivateData(
        bytes32 _dataId
    ) external whenNotPaused {
        require(
            healthData[_dataId].owner == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(healthData[_dataId].active, "Already deactivated");

        healthData[_dataId].active = false;
        emit DataDeactivated(_dataId);
    }

    function getData(
        bytes32 _dataId
    ) external view returns (HealthData memory) {
        require(
            healthData[_dataId].owner == msg.sender ||
            (dataAccess[_dataId][msg.sender].active &&
             dataAccess[_dataId][msg.sender].expiryTime > block.timestamp),
            "Not authorized"
        );
        return healthData[_dataId];
    }

    function getAccess(
        bytes32 _dataId,
        address _grantee
    ) external view returns (AccessGrant memory) {
        require(
            healthData[_dataId].owner == msg.sender ||
            _grantee == msg.sender,
            "Not authorized"
        );
        return dataAccess[_dataId][_grantee];
    }

    function getUserData(
        address _user
    ) external view returns (bytes32[] memory) {
        require(
            _user == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return userData[_user];
    }

    function getDataByType(
        string memory _dataType
    ) external view returns (bytes32[] memory) {
        require(
            hasRole(DATA_PROVIDER_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return dataByType[_dataType];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
