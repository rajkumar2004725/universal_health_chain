// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IStorageConnector
 * @dev Interface for connecting with decentralized storage systems (IPFS)
 */
interface IStorageConnector {
    struct StorageEntry {
        bytes32 contentHash;
        address owner;
        uint256 timestamp;
        bool isEncrypted;
        bytes32 encryptionKeyHash;
        bytes32 metadataHash;
    }

    event ContentStored(
        bytes32 indexed contentId,
        address indexed owner,
        bytes32 contentHash
    );
    event ContentUpdated(
        bytes32 indexed contentId,
        bytes32 newContentHash
    );
    event ContentDeleted(bytes32 indexed contentId);
    event EncryptionKeyShared(
        bytes32 indexed contentId,
        address indexed recipient
    );

    function storeContent(
        bytes32 _contentHash,
        bool _isEncrypted,
        bytes32 _encryptionKeyHash,
        bytes32 _metadataHash
    ) external returns (bytes32);

    function updateContent(
        bytes32 _contentId,
        bytes32 _newContentHash,
        bytes32 _newMetadataHash
    ) external;

    function deleteContent(bytes32 _contentId) external;

    function shareEncryptionKey(
        bytes32 _contentId,
        address _recipient,
        bytes32 _encryptedKey
    ) external;

    function getStorageEntry(bytes32 _contentId)
        external
        view
        returns (StorageEntry memory);

    function verifyContent(bytes32 _contentId, bytes32 _contentHash)
        external
        view
        returns (bool);

    function isAuthorized(bytes32 _contentId, address _user)
        external
        view
        returns (bool);
}
