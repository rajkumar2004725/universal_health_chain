// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IHealthRecordRegistry
 * @dev Interface for managing health records on the blockchain
 */
interface IHealthRecordRegistry {
    enum RecordType { 
        Clinical,
        Laboratory,
        Imaging,
        Prescription,
        Insurance,
        Consent
    }

    struct HealthRecord {
        bytes32 recordId;
        address owner;
        RecordType recordType;
        bytes32 dataHash;
        bytes32 metadataHash;
        uint256 timestamp;
        bool isEncrypted;
    }

    event RecordCreated(
        bytes32 indexed recordId,
        address indexed owner,
        RecordType recordType
    );
    event RecordUpdated(bytes32 indexed recordId, bytes32 newDataHash);
    event RecordAccessGranted(
        bytes32 indexed recordId,
        address indexed grantee,
        uint256 expiryTime
    );
    event RecordAccessRevoked(bytes32 indexed recordId, address indexed grantee);

    function createRecord(
        RecordType _type,
        bytes32 _dataHash,
        bytes32 _metadataHash,
        bool _isEncrypted
    ) external returns (bytes32);

    function updateRecord(
        bytes32 _recordId,
        bytes32 _newDataHash,
        bytes32 _newMetadataHash
    ) external;

    function grantAccess(
        bytes32 _recordId,
        address _grantee,
        uint256 _expiryTime
    ) external;

    function revokeAccess(bytes32 _recordId, address _grantee) external;
    
    function getRecord(bytes32 _recordId) 
        external 
        view 
        returns (HealthRecord memory);

    function hasAccess(bytes32 _recordId, address _user)
        external
        view
        returns (bool);
}
