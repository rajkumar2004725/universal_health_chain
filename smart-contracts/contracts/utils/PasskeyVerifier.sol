// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PasskeyVerifier
 * @dev Contract to verify WebAuthn/FIDO2 passkey credentials for user authentication
 */
contract PasskeyVerifier is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct PasskeyCredential {
        bytes32 credentialId;      // WebAuthn credential ID
        bytes32 publicKeyHash;     // Hash of the public key
        uint256 signCount;         // Counter to prevent replay attacks
        bool isActive;             // Whether the credential is active
    }

    // Mapping from user address to their passkey credentials
    mapping(address => PasskeyCredential[]) public userCredentials;
    
    // Mapping to track credential IDs to prevent duplicates
    mapping(bytes32 => bool) public registeredCredentialIds;

    event PasskeyRegistered(
        address indexed user,
        bytes32 indexed credentialId,
        bytes32 publicKeyHash
    );
    event PasskeyDeactivated(address indexed user, bytes32 indexed credentialId);
    event PasskeyAuthenticated(address indexed user, bytes32 indexed credentialId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new passkey credential for a user
     * @param _user Address of the user
     * @param _credentialId WebAuthn credential ID
     * @param _publicKey Public key of the credential
     */
    function registerPasskey(
        address _user,
        bytes32 _credentialId,
        bytes calldata _publicKey
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(!registeredCredentialIds[_credentialId], "Credential ID already registered");
        
        bytes32 publicKeyHash = keccak256(_publicKey);
        PasskeyCredential memory newCredential = PasskeyCredential({
            credentialId: _credentialId,
            publicKeyHash: publicKeyHash,
            signCount: 0,
            isActive: true
        });

        userCredentials[_user].push(newCredential);
        registeredCredentialIds[_credentialId] = true;

        emit PasskeyRegistered(_user, _credentialId, publicKeyHash);
    }

    /**
     * @dev Verify a passkey authentication assertion
     * @param _user Address of the user
     * @param _credentialId WebAuthn credential ID
     * @param _signature Authentication signature
     * @param _authenticatorData Raw authenticator data
     * @param _clientDataJSON Client data JSON
     * @param _newSignCount New sign count from the authenticator
     */
    function verifyAuthentication(
        address _user,
        bytes32 _credentialId,
        bytes calldata _signature,
        bytes calldata _authenticatorData,
        bytes calldata _clientDataJSON,
        uint256 _newSignCount
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused returns (bool) {
        PasskeyCredential[] storage credentials = userCredentials[_user];
        
        for (uint256 i = 0; i < credentials.length; i++) {
            if (credentials[i].credentialId == _credentialId) {
                require(credentials[i].isActive, "Credential is not active");
                require(_newSignCount > credentials[i].signCount, "Invalid sign count");

                // Verify the signature and authenticator data
                // Note: In a real implementation, this would involve complex WebAuthn verification
                // including checking the signature against the stored public key
                // Generate message hash from authenticator data and client data
                bytes32 messageHash = keccak256(abi.encodePacked(
                    _authenticatorData,
                    keccak256(_clientDataJSON)
                ));
                
                // Verify signature (simplified for demonstration)
                // In production, implement full WebAuthn signature verification
                require(
                    credentials[i].publicKeyHash == keccak256(_signature) &&
                    keccak256(abi.encodePacked(messageHash)) == keccak256(_signature),
                    "Invalid signature"
                );
                
                // Update sign count after successful verification
                credentials[i].signCount = _newSignCount;
                
                emit PasskeyAuthenticated(_user, _credentialId);
                return true;
            }
        }
        
        revert("Credential not found");
    }

    /**
     * @dev Deactivate a passkey credential
     * @param _user Address of the user
     * @param _credentialId WebAuthn credential ID
     */
    function deactivatePasskey(
        address _user,
        bytes32 _credentialId
    ) external onlyRole(ADMIN_ROLE) {
        PasskeyCredential[] storage credentials = userCredentials[_user];
        
        for (uint256 i = 0; i < credentials.length; i++) {
            if (credentials[i].credentialId == _credentialId && credentials[i].isActive) {
                credentials[i].isActive = false;
                emit PasskeyDeactivated(_user, _credentialId);
                return;
            }
        }
        
        revert("Active credential not found");
    }

    /**
     * @dev Get all active passkey credentials for a user
     * @param _user Address of the user
     */
    function getUserCredentials(
        address _user
    ) external view returns (PasskeyCredential[] memory) {
        return userCredentials[_user];
    }

    /**
     * @dev Check if a credential ID is registered
     * @param _credentialId WebAuthn credential ID
     */
    function isCredentialRegistered(
        bytes32 _credentialId
    ) external view returns (bool) {
        return registeredCredentialIds[_credentialId];
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
