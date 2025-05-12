// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title UHCIdentity
 * @dev Implementation of the Universal Health Chain identity management system
 */
contract UHCIdentity is IUHCIdentity, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    mapping(address => Identity) private identities;
    mapping(bytes32 => bool) private usedIdentityHashes;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyVerifiedOrAdmin(address _wallet) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || 
            (identities[msg.sender].status == VerificationStatus.Verified),
            "UHCIdentity: Caller must be verified or admin"
        );
        _;
    }

    function registerIdentity(
        bytes32 _identityHash,
        IdentityType _role,
        bytes32 _metadataHash
    ) external override whenNotPaused {
        require(!usedIdentityHashes[_identityHash], "Identity hash already used");
        require(
            identities[msg.sender].status == VerificationStatus.Unverified,
            "Identity already registered"
        );

        identities[msg.sender] = Identity({
            wallet: msg.sender,
            identityHash: _identityHash,
            role: _role,
            status: VerificationStatus.Pending,
            verificationTimestamp: 0,
            metadataHash: _metadataHash
        });

        usedIdentityHashes[_identityHash] = true;
        emit IdentityRegistered(msg.sender, _role);
    }

    function verifyIdentity(address _wallet) 
        external 
        override 
        onlyRole(VERIFIER_ROLE) 
        whenNotPaused 
    {
        require(
            identities[_wallet].status == VerificationStatus.Pending,
            "Identity not pending verification"
        );

        identities[_wallet].status = VerificationStatus.Verified;
        identities[_wallet].verificationTimestamp = block.timestamp;

        emit IdentityVerified(_wallet, block.timestamp);
    }

    function revokeIdentity(address _wallet) 
        external 
        override 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        require(
            identities[_wallet].status == VerificationStatus.Verified,
            "Identity not verified"
        );

        identities[_wallet].status = VerificationStatus.Revoked;
        emit IdentityRevoked(_wallet, block.timestamp);
    }

    function updateMetadata(bytes32 _metadataHash) 
        external 
        override 
        onlyVerifiedOrAdmin(msg.sender) 
        whenNotPaused 
    {
        require(
            identities[msg.sender].wallet != address(0),
            "Identity does not exist"
        );

        identities[msg.sender].metadataHash = _metadataHash;
        emit MetadataUpdated(msg.sender, _metadataHash);
    }

    function getIdentity(address _wallet) 
        external 
        view 
        override 
        returns (Identity memory) 
    {
        return identities[_wallet];
    }

    function isVerified(address _wallet) 
        external 
        view 
        override 
        returns (bool) 
    {
        return identities[_wallet].status == VerificationStatus.Verified;
    }

    function hasRole(address _wallet, IdentityType _role) 
        external 
        view 
        override 
        returns (bool) 
    {
        return identities[_wallet].role == _role &&
               identities[_wallet].status == VerificationStatus.Verified;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
