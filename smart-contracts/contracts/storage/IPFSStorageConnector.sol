// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IStorageConnector.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title IPFSStorageConnector
 * @dev Manages interaction with IPFS for decentralized storage
 */
contract IPFSStorageConnector is IStorageConnector, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STORAGE_PROVIDER_ROLE = keccak256("STORAGE_PROVIDER_ROLE");

    IUHCIdentity public identityContract;

    mapping(bytes32 => StorageEntry) private storageEntries;
    mapping(bytes32 => mapping(address => bytes32)) private encryptedKeys;
    mapping(bytes32 => uint256) private contentVersions;

    event ContentVersionUpdated(
        bytes32 indexed contentId,
        uint256 version
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyVerified() {
        require(
            identityContract.isVerified(msg.sender),
            "IPFSStorageConnector: Caller not verified"
        );
        _;
    }

    function storeContent(
        bytes32 _contentHash,
        bool _isEncrypted,
        bytes32 _encryptionKeyHash,
        bytes32 _metadataHash
    ) external override onlyVerified whenNotPaused returns (bytes32) {
        bytes32 contentId = keccak256(abi.encodePacked(
            msg.sender,
            _contentHash,
            block.timestamp
        ));

        storageEntries[contentId] = StorageEntry({
            contentHash: _contentHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            isEncrypted: _isEncrypted,
            encryptionKeyHash: _encryptionKeyHash,
            metadataHash: _metadataHash
        });

        contentVersions[contentId] = 1;
        emit ContentStored(contentId, msg.sender, _contentHash);
        return contentId;
    }

    function updateContent(
        bytes32 _contentId,
        bytes32 _newContentHash,
        bytes32 _newMetadataHash
    ) external override onlyVerified whenNotPaused {
        require(
            storageEntries[_contentId].owner == msg.sender,
            "Not content owner"
        );

        StorageEntry storage entry = storageEntries[_contentId];
        entry.contentHash = _newContentHash;
        entry.metadataHash = _newMetadataHash;
        entry.timestamp = block.timestamp;

        contentVersions[_contentId]++;
        
        emit ContentUpdated(_contentId, _newContentHash);
        emit ContentVersionUpdated(_contentId, contentVersions[_contentId]);
    }

    function deleteContent(
        bytes32 _contentId
    ) external override onlyVerified whenNotPaused {
        require(
            storageEntries[_contentId].owner == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        delete storageEntries[_contentId];
        delete contentVersions[_contentId];
        emit ContentDeleted(_contentId);
    }

    function shareEncryptionKey(
        bytes32 _contentId,
        address _recipient,
        bytes32 _encryptedKey
    ) external override onlyVerified whenNotPaused {
        require(
            storageEntries[_contentId].owner == msg.sender,
            "Not content owner"
        );
        require(
            identityContract.isVerified(_recipient),
            "Recipient not verified"
        );

        encryptedKeys[_contentId][_recipient] = _encryptedKey;
        emit EncryptionKeyShared(_contentId, _recipient);
    }

    function getStorageEntry(
        bytes32 _contentId
    ) external view override returns (StorageEntry memory) {
        require(
            isAuthorized(_contentId, msg.sender),
            "Not authorized to view content"
        );
        return storageEntries[_contentId];
    }

    function getEncryptionKey(
        bytes32 _contentId
    ) external view returns (bytes32) {
        require(
            isAuthorized(_contentId, msg.sender),
            "Not authorized to access encryption key"
        );
        return encryptedKeys[_contentId][msg.sender];
    }

    function verifyContent(
        bytes32 _contentId,
        bytes32 _contentHash
    ) external view override returns (bool) {
        return storageEntries[_contentId].contentHash == _contentHash;
    }

    function isAuthorized(
        bytes32 _contentId,
        address _user
    ) public view override returns (bool) {
        StorageEntry memory entry = storageEntries[_contentId];
        return entry.owner == _user || encryptedKeys[_contentId][_user] != bytes32(0);
    }

    function getContentVersion(
        bytes32 _contentId
    ) external view returns (uint256) {
        return contentVersions[_contentId];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
