// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IUHCIdentity
 * @dev Interface for the Universal Health Chain identity management system
 */
interface IUHCIdentity {
    enum IdentityType { Patient, Provider, Researcher, Admin }
    enum VerificationStatus { Unverified, Pending, Verified, Revoked }

    struct Identity {
        address wallet;
        bytes32 identityHash;
        IdentityType role;
        VerificationStatus status;
        uint256 verificationTimestamp;
        bytes32 metadataHash;
    }

    event IdentityRegistered(address indexed wallet, IdentityType role);
    event IdentityVerified(address indexed wallet, uint256 timestamp);
    event IdentityRevoked(address indexed wallet, uint256 timestamp);
    event MetadataUpdated(address indexed wallet, bytes32 metadataHash);

    function registerIdentity(bytes32 _identityHash, IdentityType _role, bytes32 _metadataHash) external;
    function verifyIdentity(address _wallet) external;
    function revokeIdentity(address _wallet) external;
    function updateMetadata(bytes32 _metadataHash) external;
    function getIdentity(address _wallet) external view returns (Identity memory);
    function isVerified(address _wallet) external view returns (bool);
    function hasRole(address _wallet, IdentityType _role) external view returns (bool);
}
