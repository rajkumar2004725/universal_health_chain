// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title StandardsCompliance
 * @dev Manages compliance with healthcare standards and regulations
 */
contract StandardsCompliance is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_MANAGER_ROLE = keccak256("COMPLIANCE_MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    IUHCIdentity public identityContract;

    enum ComplianceType {
        HIPAA,      // Health Insurance Portability and Accountability Act
        GDPR,       // General Data Protection Regulation
        HITECH,     // Health Information Technology for Economic and Clinical Health Act
        HL7_FHIR,   // HL7 Fast Healthcare Interoperability Resources
        ISO_13485,  // Medical Devices Quality Management
        ISO_27001   // Information Security Management
    }

    struct ComplianceRequirement {
        string description;
        string version;
        bool active;
        uint256 lastUpdated;
        mapping(address => bool) verifiedProviders;
    }

    struct Certification {
        ComplianceType complianceType;
        uint256 issueDate;
        uint256 expiryDate;
        address auditor;
        bool active;
        string metadataURI;
    }

    struct AuditLog {
        address provider;
        ComplianceType complianceType;
        uint256 timestamp;
        string findings;
        bool passed;
    }

    mapping(ComplianceType => ComplianceRequirement) public requirements;
    mapping(address => mapping(ComplianceType => Certification)) public certifications;
    mapping(bytes32 => AuditLog) public auditLogs;

    event RequirementUpdated(
        ComplianceType indexed complianceType,
        string version
    );
    
    event CertificationIssued(
        address indexed provider,
        ComplianceType indexed complianceType,
        uint256 expiryDate
    );
    
    event AuditCompleted(
        address indexed provider,
        ComplianceType indexed complianceType,
        bool passed
    );
    
    event ComplianceVerified(
        address indexed provider,
        ComplianceType indexed complianceType
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_MANAGER_ROLE, msg.sender);
    }

    function updateRequirement(
        ComplianceType _type,
        string memory _description,
        string memory _version
    ) external onlyRole(COMPLIANCE_MANAGER_ROLE) whenNotPaused {
        ComplianceRequirement storage requirement = requirements[_type];
        requirement.description = _description;
        requirement.version = _version;
        requirement.active = true;
        requirement.lastUpdated = block.timestamp;

        emit RequirementUpdated(_type, _version);
    }

    function issueCertification(
        address _provider,
        ComplianceType _type,
        uint256 _validityPeriod,
        string memory _metadataURI
    ) external onlyRole(AUDITOR_ROLE) whenNotPaused {
        require(
            identityContract.hasRole(_provider, IUHCIdentity.IdentityType.Provider),
            "Not a provider"
        );
        require(requirements[_type].active, "Requirement not active");

        Certification storage cert = certifications[_provider][_type];
        cert.complianceType = _type;
        cert.issueDate = block.timestamp;
        cert.expiryDate = block.timestamp + _validityPeriod;
        cert.auditor = msg.sender;
        cert.active = true;
        cert.metadataURI = _metadataURI;

        requirements[_type].verifiedProviders[_provider] = true;

        emit CertificationIssued(_provider, _type, cert.expiryDate);
    }

    function conductAudit(
        address _provider,
        ComplianceType _type,
        string memory _findings,
        bool _passed
    ) external onlyRole(AUDITOR_ROLE) whenNotPaused {
        require(
            identityContract.hasRole(_provider, IUHCIdentity.IdentityType.Provider),
            "Not a provider"
        );

        bytes32 auditId = keccak256(abi.encodePacked(
            _provider,
            _type,
            block.timestamp
        ));

        auditLogs[auditId] = AuditLog({
            provider: _provider,
            complianceType: _type,
            timestamp: block.timestamp,
            findings: _findings,
            passed: _passed
        });

        if (_passed) {
            requirements[_type].verifiedProviders[_provider] = true;
            emit ComplianceVerified(_provider, _type);
        }

        emit AuditCompleted(_provider, _type, _passed);
    }

    function verifyCertification(
        address _provider,
        ComplianceType _type
    ) external view returns (bool) {
        Certification storage cert = certifications[_provider][_type];
        return (
            cert.active &&
            block.timestamp <= cert.expiryDate &&
            requirements[_type].verifiedProviders[_provider]
        );
    }

    function getRequirement(
        ComplianceType _type
    ) external view returns (
        string memory description,
        string memory version,
        bool active,
        uint256 lastUpdated
    ) {
        ComplianceRequirement storage req = requirements[_type];
        return (
            req.description,
            req.version,
            req.active,
            req.lastUpdated
        );
    }

    function getCertification(
        address _provider,
        ComplianceType _type
    ) external view returns (Certification memory) {
        return certifications[_provider][_type];
    }

    function getAuditLog(
        bytes32 _auditId
    ) external view returns (AuditLog memory) {
        return auditLogs[_auditId];
    }

    function isProviderCompliant(
        address _provider,
        ComplianceType _type
    ) external view returns (bool) {
        return requirements[_type].verifiedProviders[_provider];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function grantAuditorRole(
        address _auditor
    ) external onlyRole(ADMIN_ROLE) {
        _grantRole(AUDITOR_ROLE, _auditor);
    }

    function revokeAuditorRole(
        address _auditor
    ) external onlyRole(ADMIN_ROLE) {
        _revokeRole(AUDITOR_ROLE, _auditor);
    }
}
