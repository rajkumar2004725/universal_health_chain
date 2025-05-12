// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title HashRegistry
 * @dev Manages content hashes and their verification using Merkle trees
 */
contract HashRegistry is AccessControl, Pausable {
    using MerkleProof for bytes32[];

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant HASHER_ROLE = keccak256("HASHER_ROLE");

    struct HashEntry {
        bytes32 contentHash;
        bytes32 metadataHash;
        uint256 timestamp;
        address registrar;
        bytes32 merkleRoot;
        bool isValid;
    }

    struct BatchEntry {
        bytes32 batchId;
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 size;
    }

    mapping(bytes32 => HashEntry) public hashEntries;
    mapping(bytes32 => BatchEntry) public batchEntries;
    mapping(bytes32 => mapping(bytes32 => bool)) public verifiedHashes;

    event HashRegistered(
        bytes32 indexed contentId,
        bytes32 contentHash,
        address registrar
    );
    
    event BatchRegistered(
        bytes32 indexed batchId,
        bytes32 merkleRoot,
        uint256 size
    );
    
    event HashVerified(
        bytes32 indexed contentId,
        bytes32 contentHash,
        bool verified
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(HASHER_ROLE, msg.sender);
    }

    function registerHash(
        bytes32 _contentId,
        bytes32 _contentHash,
        bytes32 _metadataHash
    ) external onlyRole(HASHER_ROLE) whenNotPaused {
        require(
            hashEntries[_contentId].contentHash == bytes32(0),
            "Hash already registered"
        );

        hashEntries[_contentId] = HashEntry({
            contentHash: _contentHash,
            metadataHash: _metadataHash,
            timestamp: block.timestamp,
            registrar: msg.sender,
            merkleRoot: bytes32(0),
            isValid: true
        });

        emit HashRegistered(_contentId, _contentHash, msg.sender);
    }

    function registerBatch(
        bytes32 _batchId,
        bytes32[] calldata _contentIds,
        bytes32[] calldata _contentHashes,
        bytes32[] calldata _metadataHashes
    ) external onlyRole(HASHER_ROLE) whenNotPaused {
        require(
            _contentIds.length == _contentHashes.length &&
            _contentHashes.length == _metadataHashes.length,
            "Array lengths mismatch"
        );
        require(_contentIds.length > 0, "Empty batch");

        bytes32[] memory leaves = new bytes32[](_contentIds.length);
        for (uint i = 0; i < _contentIds.length; i++) {
            require(
                hashEntries[_contentIds[i]].contentHash == bytes32(0),
                "Hash already registered"
            );

            leaves[i] = keccak256(abi.encodePacked(
                _contentIds[i],
                _contentHashes[i],
                _metadataHashes[i]
            ));

            hashEntries[_contentIds[i]] = HashEntry({
                contentHash: _contentHashes[i],
                metadataHash: _metadataHashes[i],
                timestamp: block.timestamp,
                registrar: msg.sender,
                merkleRoot: bytes32(0),
                isValid: true
            });
        }

        bytes32 merkleRoot = _generateMerkleRoot(leaves);
        
        batchEntries[_batchId] = BatchEntry({
            batchId: _batchId,
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            size: _contentIds.length
        });

        for (uint i = 0; i < _contentIds.length; i++) {
            hashEntries[_contentIds[i]].merkleRoot = merkleRoot;
        }

        emit BatchRegistered(_batchId, merkleRoot, _contentIds.length);
    }

    function verifyHash(
        bytes32 _contentId,
        bytes32 _contentHash,
        bytes32[] calldata _merkleProof
    ) external whenNotPaused returns (bool) {
        require(
            hashEntries[_contentId].isValid,
            "Hash entry not valid"
        );

        HashEntry memory entry = hashEntries[_contentId];
        require(entry.merkleRoot != bytes32(0), "No merkle root");

        bytes32 leaf = keccak256(abi.encodePacked(
            _contentId,
            _contentHash,
            entry.metadataHash
        ));

        bool isValid = MerkleProof.verify(
            _merkleProof,
            entry.merkleRoot,
            leaf
        );

        verifiedHashes[_contentId][_contentHash] = isValid;
        emit HashVerified(_contentId, _contentHash, isValid);

        return isValid;
    }

    function invalidateHash(
        bytes32 _contentId
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(
            hashEntries[_contentId].isValid,
            "Hash already invalid"
        );

        hashEntries[_contentId].isValid = false;
    }

    function _generateMerkleRoot(
        bytes32[] memory leaves
    ) internal pure returns (bytes32) {
        require(leaves.length > 0, "Empty leaves");

        if (leaves.length == 1) {
            return leaves[0];
        }

        uint256 length = leaves.length;
        uint256 offset = 0;
        uint256 numberOfLeaves = length;

        while (numberOfLeaves > 1) {
            for (uint256 i = 0; i < length - 1; i += 2) {
                leaves[offset + i/2] = keccak256(abi.encodePacked(
                    leaves[offset + i],
                    leaves[offset + i + 1]
                ));
            }
            offset += length/2;
            length = length/2 + (length % 2);
            numberOfLeaves = length;
        }

        return leaves[offset];
    }

    function getHashEntry(
        bytes32 _contentId
    ) external view returns (HashEntry memory) {
        return hashEntries[_contentId];
    }

    function getBatchEntry(
        bytes32 _batchId
    ) external view returns (BatchEntry memory) {
        return batchEntries[_batchId];
    }

    function isHashVerified(
        bytes32 _contentId,
        bytes32 _contentHash
    ) external view returns (bool) {
        return verifiedHashes[_contentId][_contentHash];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
