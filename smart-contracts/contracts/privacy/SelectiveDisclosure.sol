// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SelectiveDisclosure
 * @dev Manages selective disclosure of health data using attribute-based encryption
 */
contract SelectiveDisclosure is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ATTRIBUTE_AUTHORITY_ROLE = keccak256("ATTRIBUTE_AUTHORITY_ROLE");

    struct Attribute {
        bytes32 attributeHash;
        bytes32 encryptedValue;
        address owner;
        uint256 timestamp;
        bool revoked;
    }

    struct DisclosurePolicy {
        bytes32 policyHash;
        address creator;
        uint256 timestamp;
        bool active;
    }

    struct AttributeGrant {
        bytes32 attributeId;
        address grantee;
        uint256 expiryTime;
        bytes32 encryptedKey;
    }

    mapping(bytes32 => Attribute) public attributes;
    mapping(bytes32 => DisclosurePolicy) public policies;
    mapping(bytes32 => mapping(address => AttributeGrant)) public attributeGrants;
    mapping(address => mapping(bytes32 => bool)) public userAttributes;

    event AttributeCreated(
        bytes32 indexed attributeId,
        address indexed owner,
        bytes32 attributeHash
    );
    
    event AttributeGranted(
        bytes32 indexed attributeId,
        address indexed grantee,
        uint256 expiryTime
    );
    
    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed creator
    );
    
    event AttributeRevoked(
        bytes32 indexed attributeId,
        address indexed owner
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ATTRIBUTE_AUTHORITY_ROLE, msg.sender);
    }

    function createAttribute(
        bytes32 _attributeHash,
        bytes32 _encryptedValue,
        bytes calldata _signature
    ) external whenNotPaused returns (bytes32) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            _attributeHash,
            _encryptedValue,
            block.timestamp
        ));
        
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        bytes32 attributeId = keccak256(abi.encodePacked(
            msg.sender,
            _attributeHash,
            block.timestamp
        ));

        attributes[attributeId] = Attribute({
            attributeHash: _attributeHash,
            encryptedValue: _encryptedValue,
            owner: msg.sender,
            timestamp: block.timestamp,
            revoked: false
        });

        userAttributes[msg.sender][attributeId] = true;
        emit AttributeCreated(attributeId, msg.sender, _attributeHash);
        
        return attributeId;
    }

    function grantAttributeAccess(
        bytes32 _attributeId,
        address _grantee,
        uint256 _expiryTime,
        bytes32 _encryptedKey
    ) external whenNotPaused {
        require(
            attributes[_attributeId].owner == msg.sender,
            "Not attribute owner"
        );
        require(
            !attributes[_attributeId].revoked,
            "Attribute revoked"
        );
        require(_expiryTime > block.timestamp, "Invalid expiry time");

        attributeGrants[_attributeId][_grantee] = AttributeGrant({
            attributeId: _attributeId,
            grantee: _grantee,
            expiryTime: _expiryTime,
            encryptedKey: _encryptedKey
        });

        emit AttributeGranted(_attributeId, _grantee, _expiryTime);
    }

    function createDisclosurePolicy(
        bytes32 _policyHash,
        bytes32[] calldata /* _requiredAttributes */
    ) external onlyRole(ATTRIBUTE_AUTHORITY_ROLE) whenNotPaused returns (bytes32) {
        bytes32 policyId = keccak256(abi.encodePacked(
            msg.sender,
            _policyHash,
            block.timestamp
        ));

        policies[policyId] = DisclosurePolicy({
            policyHash: _policyHash,
            creator: msg.sender,
            timestamp: block.timestamp,
            active: true
        });

        emit PolicyCreated(policyId, msg.sender);
        return policyId;
    }

    function revokeAttribute(
        bytes32 _attributeId
    ) external whenNotPaused {
        require(
            attributes[_attributeId].owner == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(!attributes[_attributeId].revoked, "Already revoked");

        attributes[_attributeId].revoked = true;
        emit AttributeRevoked(_attributeId, attributes[_attributeId].owner);
    }

    function verifyAttributeDisclosure(
        bytes32 _attributeId,
        address _discloser,
        bytes32 _policyId,
        bytes calldata _proof
    ) external view returns (bool) {
        require(policies[_policyId].active, "Policy not active");
        
        Attribute memory attr = attributes[_attributeId];
        require(!attr.revoked, "Attribute revoked");
        require(attr.owner == _discloser, "Invalid discloser");

        AttributeGrant memory grant = attributeGrants[_attributeId][msg.sender];
        require(
            grant.expiryTime > block.timestamp,
            "Access expired"
        );

        // Verify ZK proof of attribute satisfaction
        // This is a placeholder for actual ZK proof verification
        bytes32 proofHash = keccak256(abi.encodePacked(
            _attributeId,
            _discloser,
            _policyId,
            _proof
        ));

        return proofHash != bytes32(0);
    }

    function getAttribute(
        bytes32 _attributeId
    ) external view returns (Attribute memory) {
        require(
            attributes[_attributeId].owner == msg.sender ||
            (attributeGrants[_attributeId][msg.sender].expiryTime > block.timestamp),
            "Not authorized"
        );
        return attributes[_attributeId];
    }

    function getAttributeGrant(
        bytes32 _attributeId,
        address _grantee
    ) external view returns (AttributeGrant memory) {
        require(
            attributes[_attributeId].owner == msg.sender ||
            _grantee == msg.sender,
            "Not authorized"
        );
        return attributeGrants[_attributeId][_grantee];
    }

    function getPolicy(
        bytes32 _policyId
    ) external view returns (DisclosurePolicy memory) {
        return policies[_policyId];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
