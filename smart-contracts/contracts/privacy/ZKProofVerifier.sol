// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ZKProofVerifier
 * @dev Verifies zero-knowledge proofs for private health data
 */
contract ZKProofVerifier is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct Proof {
        bytes32 proofHash;
        bytes32 publicInputHash;
        address prover;
        uint256 timestamp;
        bool verified;
    }

    struct VerifierKey {
        bytes32 keyHash;
        bool isActive;
        uint256 validUntil;
    }

    mapping(bytes32 => Proof) public proofs;
    mapping(address => VerifierKey) public verifierKeys;
    mapping(bytes32 => mapping(address => bool)) public proofAccess;

    event ProofSubmitted(
        bytes32 indexed proofId,
        address indexed prover,
        bytes32 publicInputHash
    );
    
    event ProofVerified(
        bytes32 indexed proofId,
        address indexed verifier
    );
    
    event VerifierKeyUpdated(
        address indexed verifier,
        bytes32 keyHash
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    function submitProof(
        bytes32 _proofHash,
        bytes32 _publicInputHash,
        bytes calldata _signature
    ) external whenNotPaused returns (bytes32) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            _proofHash,
            _publicInputHash,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        bytes32 proofId = keccak256(abi.encodePacked(
            msg.sender,
            _proofHash,
            block.timestamp
        ));

        proofs[proofId] = Proof({
            proofHash: _proofHash,
            publicInputHash: _publicInputHash,
            prover: msg.sender,
            timestamp: block.timestamp,
            verified: false
        });

        proofAccess[proofId][msg.sender] = true;
        emit ProofSubmitted(proofId, msg.sender, _publicInputHash);
        
        return proofId;
    }

    function verifyProof(
        bytes32 _proofId,
        bytes32 _verifierInput,
        bytes calldata _verifierSignature
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(
            verifierKeys[msg.sender].isActive &&
            verifierKeys[msg.sender].validUntil > block.timestamp,
            "Invalid verifier key"
        );

        Proof storage proof = proofs[_proofId];
        require(!proof.verified, "Proof already verified");

        bytes32 messageHash = keccak256(abi.encodePacked(
            proof.proofHash,
            _verifierInput,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_verifierSignature);
        require(signer == msg.sender, "Invalid verifier signature");

        proof.verified = true;
        emit ProofVerified(_proofId, msg.sender);
    }

    function grantProofAccess(
        bytes32 _proofId,
        address _grantee
    ) external whenNotPaused {
        require(
            proofs[_proofId].prover == msg.sender,
            "Not proof owner"
        );
        require(
            hasRole(VERIFIER_ROLE, _grantee) || 
            proofs[_proofId].prover == _grantee,
            "Invalid grantee"
        );

        proofAccess[_proofId][_grantee] = true;
    }

    function revokeProofAccess(
        bytes32 _proofId,
        address _grantee
    ) external whenNotPaused {
        require(
            proofs[_proofId].prover == msg.sender,
            "Not proof owner"
        );
        require(_grantee != proofs[_proofId].prover, "Cannot revoke owner access");

        proofAccess[_proofId][_grantee] = false;
    }

    function updateVerifierKey(
        address _verifier,
        bytes32 _keyHash,
        uint256 _validUntil
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(_validUntil > block.timestamp, "Invalid validity period");
        require(hasRole(VERIFIER_ROLE, _verifier), "Not a verifier");

        verifierKeys[_verifier] = VerifierKey({
            keyHash: _keyHash,
            isActive: true,
            validUntil: _validUntil
        });

        emit VerifierKeyUpdated(_verifier, _keyHash);
    }

    function deactivateVerifierKey(
        address _verifier
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(verifierKeys[_verifier].isActive, "Key already inactive");
        verifierKeys[_verifier].isActive = false;
    }

    function getProof(
        bytes32 _proofId
    ) external view returns (Proof memory) {
        require(
            proofAccess[_proofId][msg.sender],
            "Not authorized to view proof"
        );
        return proofs[_proofId];
    }

    function hasProofAccess(
        bytes32 _proofId,
        address _user
    ) external view returns (bool) {
        return proofAccess[_proofId][_user];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
