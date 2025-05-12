// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IHealthRecordRegistry.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title HealthRecordRegistry
 * @dev Implementation of the health record management system
 */
contract HealthRecordRegistry is IHealthRecordRegistry, AccessControl, Pausable {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");

    IUHCIdentity public identityContract;
    Counters.Counter private recordIdCounter;

    mapping(bytes32 => HealthRecord) private records;
    mapping(bytes32 => mapping(address => uint256)) private accessPermissions;

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyVerified() {
        require(
            identityContract.isVerified(msg.sender),
            "HealthRecordRegistry: Caller not verified"
        );
        _;
    }

    modifier onlyOwnerOrGranted(bytes32 _recordId) {
        require(
            records[_recordId].owner == msg.sender || 
            hasAccess(_recordId, msg.sender),
            "HealthRecordRegistry: Not authorized"
        );
        _;
    }

    function createRecord(
        RecordType _type,
        bytes32 _dataHash,
        bytes32 _metadataHash,
        bool _isEncrypted
    ) external override onlyVerified whenNotPaused returns (bytes32) {
        recordIdCounter.increment();
        bytes32 recordId = keccak256(abi.encodePacked(
            msg.sender,
            recordIdCounter.current(),
            block.timestamp
        ));

        records[recordId] = HealthRecord({
            recordId: recordId,
            owner: msg.sender,
            recordType: _type,
            dataHash: _dataHash,
            metadataHash: _metadataHash,
            timestamp: block.timestamp,
            isEncrypted: _isEncrypted
        });

        emit RecordCreated(recordId, msg.sender, _type);
        return recordId;
    }

    function updateRecord(
        bytes32 _recordId,
        bytes32 _newDataHash,
        bytes32 _newMetadataHash
    ) external override onlyOwnerOrGranted(_recordId) whenNotPaused {
        require(records[_recordId].recordId == _recordId, "Record does not exist");

        records[_recordId].dataHash = _newDataHash;
        records[_recordId].metadataHash = _newMetadataHash;
        records[_recordId].timestamp = block.timestamp;

        emit RecordUpdated(_recordId, _newDataHash);
    }

    function grantAccess(
        bytes32 _recordId,
        address _grantee,
        uint256 _expiryTime
    ) external override onlyOwnerOrGranted(_recordId) whenNotPaused {
        require(
            identityContract.isVerified(_grantee),
            "Grantee not verified"
        );
        require(
            _expiryTime > block.timestamp,
            "Invalid expiry time"
        );

        accessPermissions[_recordId][_grantee] = _expiryTime;
        emit RecordAccessGranted(_recordId, _grantee, _expiryTime);
    }

    function revokeAccess(
        bytes32 _recordId,
        address _grantee
    ) external override onlyOwnerOrGranted(_recordId) whenNotPaused {
        accessPermissions[_recordId][_grantee] = 0;
        emit RecordAccessRevoked(_recordId, _grantee);
    }

    function getRecord(bytes32 _recordId) 
        external 
        view 
        override 
        onlyOwnerOrGranted(_recordId) 
        returns (HealthRecord memory) 
    {
        require(records[_recordId].recordId == _recordId, "Record does not exist");
        return records[_recordId];
    }

    function hasAccess(bytes32 _recordId, address _user)
        public
        view
        override
        returns (bool)
    {
        if (records[_recordId].owner == _user) {
            return true;
        }

        uint256 expiryTime = accessPermissions[_recordId][_user];
        return expiryTime > block.timestamp;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
