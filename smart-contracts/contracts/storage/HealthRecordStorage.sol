// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title HealthRecordStorage
 * @dev Manages storage and access control for health records using IPFS
 */
contract HealthRecordStorage is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");

    IUHCIdentity public identityContract;

    struct HealthRecord {
        bytes32 recordHash;
        string ipfsHash;
        address owner;
        uint256 timestamp;
        bool active;
        bytes32 encryptionKey;
    }

    struct AccessGrant {
        address grantee;
        uint256 expiryTime;
        bytes32 encryptedKey;
        bool active;
    }

    mapping(bytes32 => HealthRecord) public healthRecords;
    mapping(bytes32 => mapping(address => AccessGrant)) public recordAccess;
    mapping(address => bytes32[]) public userRecords;

    event RecordStored(
        bytes32 indexed recordId,
        address indexed owner,
        bytes32 recordHash
    );
    
    event AccessGranted(
        bytes32 indexed recordId,
        address indexed grantee,
        uint256 expiryTime
    );
    
    event RecordUpdated(
        bytes32 indexed recordId,
        bytes32 newRecordHash
    );
    
    event RecordDeactivated(
        bytes32 indexed recordId
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function storeRecord(
        bytes32 _recordHash,
        string memory _ipfsHash,
        bytes32 _encryptionKey,
        bytes memory _signature
    ) external whenNotPaused returns (bytes32) {
        require(
            identityContract.isVerified(msg.sender),
            "User not verified"
        );

        bytes32 messageHash = keccak256(abi.encodePacked(
            _recordHash,
            _ipfsHash,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        bytes32 recordId = keccak256(abi.encodePacked(
            msg.sender,
            _recordHash,
            block.timestamp
        ));

        healthRecords[recordId] = HealthRecord({
            recordHash: _recordHash,
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            active: true,
            encryptionKey: _encryptionKey
        });

        userRecords[msg.sender].push(recordId);
        emit RecordStored(recordId, msg.sender, _recordHash);
        
        return recordId;
    }

    function grantAccess(
        bytes32 _recordId,
        address _grantee,
        uint256 _expiryTime,
        bytes32 _encryptedKey
    ) external whenNotPaused {
        require(
            healthRecords[_recordId].owner == msg.sender,
            "Not record owner"
        );
        require(
            healthRecords[_recordId].active,
            "Record not active"
        );
        require(_expiryTime > block.timestamp, "Invalid expiry time");
        require(
            identityContract.isVerified(_grantee),
            "Grantee not verified"
        );

        recordAccess[_recordId][_grantee] = AccessGrant({
            grantee: _grantee,
            expiryTime: _expiryTime,
            encryptedKey: _encryptedKey,
            active: true
        });

        emit AccessGranted(_recordId, _grantee, _expiryTime);
    }

    function updateRecord(
        bytes32 _recordId,
        bytes32 _newRecordHash,
        string memory _newIpfsHash,
        bytes32 _newEncryptionKey,
        bytes memory _signature
    ) external whenNotPaused {
        require(
            healthRecords[_recordId].owner == msg.sender,
            "Not record owner"
        );
        require(
            healthRecords[_recordId].active,
            "Record not active"
        );

        bytes32 messageHash = keccak256(abi.encodePacked(
            _recordId,
            _newRecordHash,
            _newIpfsHash,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        healthRecords[_recordId].recordHash = _newRecordHash;
        healthRecords[_recordId].ipfsHash = _newIpfsHash;
        healthRecords[_recordId].timestamp = block.timestamp;
        healthRecords[_recordId].encryptionKey = _newEncryptionKey;

        emit RecordUpdated(_recordId, _newRecordHash);
    }

    function deactivateRecord(
        bytes32 _recordId
    ) external whenNotPaused {
        require(
            healthRecords[_recordId].owner == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(healthRecords[_recordId].active, "Already deactivated");

        healthRecords[_recordId].active = false;
        emit RecordDeactivated(_recordId);
    }

    function getRecord(
        bytes32 _recordId
    ) external view returns (HealthRecord memory) {
        require(
            healthRecords[_recordId].owner == msg.sender ||
            (recordAccess[_recordId][msg.sender].active &&
             recordAccess[_recordId][msg.sender].expiryTime > block.timestamp),
            "Not authorized"
        );
        return healthRecords[_recordId];
    }

    function getAccess(
        bytes32 _recordId,
        address _grantee
    ) external view returns (AccessGrant memory) {
        require(
            healthRecords[_recordId].owner == msg.sender ||
            _grantee == msg.sender,
            "Not authorized"
        );
        return recordAccess[_recordId][_grantee];
    }

    function getUserRecords(
        address _user
    ) external view returns (bytes32[] memory) {
        require(
            _user == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return userRecords[_user];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
