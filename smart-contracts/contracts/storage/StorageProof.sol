// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title StorageProof
 * @dev Manages proofs of storage for health records in IPFS
 */
contract StorageProof is AccessControl, Pausable {
    struct HashCount {
        bytes32 hash;
        uint256 count;
    }
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROVER_ROLE = keccak256("PROVER_ROLE");

    struct Proof {
        bytes32 contentHash;
        uint256 timestamp;
        address prover;
        bytes signature;
        bool isValid;
    }

    struct Challenge {
        bytes32 contentId;
        uint256 timestamp;
        uint256 expiryTime;
        bool completed;
    }

    mapping(bytes32 => Proof[]) public proofs;
    mapping(bytes32 => Challenge) public challenges;
    mapping(address => uint256) public proverReputations;

    uint256 public constant CHALLENGE_DURATION = 24 hours;
    uint256 public constant MIN_PROOFS_REQUIRED = 3;
    uint256 public constant MAX_PROOF_AGE = 30 days;

    event ProofSubmitted(
        bytes32 indexed contentId,
        address indexed prover,
        bytes32 contentHash
    );
    
    event ChallengeIssued(
        bytes32 indexed contentId,
        uint256 timestamp,
        uint256 expiryTime
    );
    
    event ChallengeCompleted(
        bytes32 indexed contentId,
        bool success
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function submitProof(
        bytes32 _contentId,
        bytes32 _contentHash,
        bytes calldata _signature
    ) external onlyRole(PROVER_ROLE) whenNotPaused {
        require(
            challenges[_contentId].contentId == _contentId,
            "No active challenge"
        );
        require(
            !challenges[_contentId].completed,
            "Challenge already completed"
        );
        require(
            block.timestamp <= challenges[_contentId].expiryTime,
            "Challenge expired"
        );

        bytes32 messageHash = keccak256(abi.encodePacked(
            _contentId,
            _contentHash,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        Proof memory newProof = Proof({
            contentHash: _contentHash,
            timestamp: block.timestamp,
            prover: msg.sender,
            signature: _signature,
            isValid: true
        });

        proofs[_contentId].push(newProof);
        proverReputations[msg.sender]++;

        emit ProofSubmitted(_contentId, msg.sender, _contentHash);

        if (proofs[_contentId].length >= MIN_PROOFS_REQUIRED) {
            _completeChallenge(_contentId);
        }
    }

    function issueChallenge(
        bytes32 _contentId
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(
            challenges[_contentId].contentId == bytes32(0) ||
            challenges[_contentId].completed ||
            block.timestamp > challenges[_contentId].expiryTime,
            "Active challenge exists"
        );

        uint256 expiryTime = block.timestamp + CHALLENGE_DURATION;
        challenges[_contentId] = Challenge({
            contentId: _contentId,
            timestamp: block.timestamp,
            expiryTime: expiryTime,
            completed: false
        });

        emit ChallengeIssued(_contentId, block.timestamp, expiryTime);
    }

    function _completeChallenge(bytes32 _contentId) internal {
        require(
            proofs[_contentId].length >= MIN_PROOFS_REQUIRED,
            "Insufficient proofs"
        );

        bytes32 majorityHash = _findMajorityHash(_contentId);
        bool success = majorityHash != bytes32(0);

        challenges[_contentId].completed = true;
        
        if (success) {
            _updateProofValidities(_contentId, majorityHash);
        }

        emit ChallengeCompleted(_contentId, success);
    }

    function _findMajorityHash(
        bytes32 _contentId
    ) internal view returns (bytes32) {
        Proof[] memory contentProofs = proofs[_contentId];
        HashCount[] memory hashCounts = new HashCount[](contentProofs.length);
        uint256 uniqueHashes = 0;

        // Count occurrences of each hash
        for (uint256 i = 0; i < contentProofs.length; i++) {
            bytes32 hash = contentProofs[i].contentHash;
            bool found = false;

            for (uint256 j = 0; j < uniqueHashes; j++) {
                if (hashCounts[j].hash == hash) {
                    hashCounts[j].count++;
                    found = true;
                    break;
                }
            }

            if (!found && uniqueHashes < hashCounts.length) {
                hashCounts[uniqueHashes] = HashCount({
                    hash: hash,
                    count: 1
                });
                uniqueHashes++;
            }
        }

        // Find the hash with maximum count
        uint256 maxCount = 0;
        bytes32 majorityHash;

        for (uint256 i = 0; i < uniqueHashes; i++) {
            if (hashCounts[i].count > maxCount) {
                maxCount = hashCounts[i].count;
                majorityHash = hashCounts[i].hash;
            }
        }

        return maxCount >= MIN_PROOFS_REQUIRED ? majorityHash : bytes32(0);
    }

    function _updateProofValidities(
        bytes32 _contentId,
        bytes32 _majorityHash
    ) internal {
        Proof[] storage contentProofs = proofs[_contentId];
        
        for (uint i = 0; i < contentProofs.length; i++) {
            if (contentProofs[i].contentHash != _majorityHash) {
                contentProofs[i].isValid = false;
                proverReputations[contentProofs[i].prover]--;
            }
        }
    }

    function getProofs(
        bytes32 _contentId
    ) external view returns (Proof[] memory) {
        return proofs[_contentId];
    }

    function getChallenge(
        bytes32 _contentId
    ) external view returns (Challenge memory) {
        return challenges[_contentId];
    }

    function getProverReputation(
        address _prover
    ) external view returns (uint256) {
        return proverReputations[_prover];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
