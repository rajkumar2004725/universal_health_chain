// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title PrivacyGuard
 * @dev Manages privacy settings and enforces privacy policies for health data
 */
contract PrivacyGuard is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PRIVACY_OFFICER_ROLE = keccak256("PRIVACY_OFFICER_ROLE");

    struct PrivacyPolicy {
        bytes32 policyHash;
        address creator;
        uint256 timestamp;
        bool active;
        uint256 version;
        bytes32 metadataHash;
    }

    struct PrivacyPreference {
        address user;
        bytes32 preferencesHash;
        uint256 timestamp;
        bytes32 encryptedPreferences;
        bool active;
    }

    struct ConsentRecord {
        address user;
        bytes32 policyId;
        uint256 timestamp;
        bool consented;
        bytes32 proofHash;
    }

    mapping(bytes32 => PrivacyPolicy) public policies;
    mapping(address => PrivacyPreference) public preferences;
    mapping(address => mapping(bytes32 => ConsentRecord)) public consents;
    mapping(address => mapping(address => bool)) public dataAccessApprovals;

    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed creator,
        uint256 version
    );
    
    event PreferencesUpdated(
        address indexed user,
        bytes32 preferencesHash
    );
    
    event ConsentRecorded(
        address indexed user,
        bytes32 indexed policyId,
        bool consented
    );
    
    event DataAccessApproved(
        address indexed owner,
        address indexed accessor
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PRIVACY_OFFICER_ROLE, msg.sender);
    }

    function createPrivacyPolicy(
        bytes32 _policyHash,
        bytes32 _metadataHash
    ) external onlyRole(PRIVACY_OFFICER_ROLE) whenNotPaused returns (bytes32) {
        bytes32 policyId = keccak256(abi.encodePacked(
            msg.sender,
            _policyHash,
            block.timestamp
        ));

        uint256 version = 1;
        if (policies[policyId].policyHash != bytes32(0)) {
            version = policies[policyId].version + 1;
        }

        policies[policyId] = PrivacyPolicy({
            policyHash: _policyHash,
            creator: msg.sender,
            timestamp: block.timestamp,
            active: true,
            version: version,
            metadataHash: _metadataHash
        });

        emit PolicyCreated(policyId, msg.sender, version);
        return policyId;
    }

    function updatePrivacyPreferences(
        bytes32 _preferencesHash,
        bytes32 _encryptedPreferences,
        bytes calldata _signature
    ) external whenNotPaused {
        bytes32 messageHash = keccak256(abi.encodePacked(
            _preferencesHash,
            _encryptedPreferences,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        preferences[msg.sender] = PrivacyPreference({
            user: msg.sender,
            preferencesHash: _preferencesHash,
            timestamp: block.timestamp,
            encryptedPreferences: _encryptedPreferences,
            active: true
        });

        emit PreferencesUpdated(msg.sender, _preferencesHash);
    }

    function recordConsent(
        bytes32 _policyId,
        bool _consent,
        bytes32 _proofHash,
        bytes calldata _signature
    ) external whenNotPaused {
        require(policies[_policyId].active, "Policy not active");

        bytes32 messageHash = keccak256(abi.encodePacked(
            _policyId,
            _consent,
            _proofHash,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        consents[msg.sender][_policyId] = ConsentRecord({
            user: msg.sender,
            policyId: _policyId,
            timestamp: block.timestamp,
            consented: _consent,
            proofHash: _proofHash
        });

        emit ConsentRecorded(msg.sender, _policyId, _consent);
    }

    function approveDataAccess(
        address _accessor
    ) external whenNotPaused {
        require(_accessor != address(0), "Invalid accessor");
        require(_accessor != msg.sender, "Cannot approve self");

        dataAccessApprovals[msg.sender][_accessor] = true;
        emit DataAccessApproved(msg.sender, _accessor);
    }

    function revokeDataAccess(
        address _accessor
    ) external whenNotPaused {
        require(dataAccessApprovals[msg.sender][_accessor], "No approval exists");
        dataAccessApprovals[msg.sender][_accessor] = false;
    }

    function checkPrivacyCompliance(
        address _dataOwner,
        address _dataAccessor,
        bytes32 _policyId
    ) external view returns (bool) {
        require(policies[_policyId].active, "Policy not active");

        // Check if data owner has given consent to the policy
        ConsentRecord memory consentRecord = consents[_dataOwner][_policyId];
        if (!consentRecord.consented) {
            return false;
        }

        // Check if data owner has approved accessor
        if (!dataAccessApprovals[_dataOwner][_dataAccessor]) {
            return false;
        }

        // Check if data owner has active privacy preferences
        PrivacyPreference memory prefs = preferences[_dataOwner];
        return prefs.active;
    }

    function getPrivacyPolicy(
        bytes32 _policyId
    ) external view returns (PrivacyPolicy memory) {
        return policies[_policyId];
    }

    function getPrivacyPreferences(
        address _user
    ) external view returns (PrivacyPreference memory) {
        require(
            _user == msg.sender || hasRole(PRIVACY_OFFICER_ROLE, msg.sender),
            "Not authorized"
        );
        return preferences[_user];
    }

    function getConsentRecord(
        address _user,
        bytes32 _policyId
    ) external view returns (ConsentRecord memory) {
        require(
            _user == msg.sender || hasRole(PRIVACY_OFFICER_ROLE, msg.sender),
            "Not authorized"
        );
        return consents[_user][_policyId];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
