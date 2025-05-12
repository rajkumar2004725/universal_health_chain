// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title CrossChainBridge
 * @dev Manages cross-chain interoperability for healthcare data
 */
contract CrossChainBridge is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BRIDGE_OPERATOR_ROLE = keccak256("BRIDGE_OPERATOR_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    IUHCIdentity public identityContract;

    enum ChainType {
        Ethereum,
        Polygon,
        BSC,
        Avalanche,
        Solana,
        Custom
    }

    struct Bridge {
        ChainType sourceChain;
        ChainType targetChain;
        address bridgeContract;
        uint256 requiredValidations;
        bool active;
        mapping(address => bool) validators;
    }

    struct Transaction {
        bytes32 bridgeId;
        bytes32 dataHash;
        address initiator;
        uint256 timestamp;
        uint256 validations;
        bool executed;
        mapping(address => bool) hasValidated;
    }

    mapping(bytes32 => Bridge) public bridges;
    mapping(bytes32 => Transaction) public transactions;
    mapping(ChainType => uint256) public chainNonces;

    event BridgeRegistered(
        bytes32 indexed bridgeId,
        ChainType sourceChain,
        ChainType targetChain
    );
    
    event TransactionInitiated(
        bytes32 indexed transactionId,
        bytes32 indexed bridgeId,
        bytes32 dataHash
    );
    
    event TransactionValidated(
        bytes32 indexed transactionId,
        address indexed validator
    );
    
    event TransactionExecuted(
        bytes32 indexed transactionId,
        bytes32 indexed bridgeId
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_OPERATOR_ROLE, msg.sender);
    }

    function registerBridge(
        ChainType _sourceChain,
        ChainType _targetChain,
        address _bridgeContract,
        uint256 _requiredValidations
    ) external onlyRole(BRIDGE_OPERATOR_ROLE) whenNotPaused returns (bytes32) {
        require(_bridgeContract != address(0), "Invalid bridge contract");
        require(_requiredValidations > 0, "Invalid validation requirement");

        bytes32 bridgeId = keccak256(abi.encodePacked(
            _sourceChain,
            _targetChain,
            _bridgeContract,
            block.timestamp
        ));

        Bridge storage bridge = bridges[bridgeId];
        require(!bridge.active, "Bridge exists");

        bridge.sourceChain = _sourceChain;
        bridge.targetChain = _targetChain;
        bridge.bridgeContract = _bridgeContract;
        bridge.requiredValidations = _requiredValidations;
        bridge.active = true;

        emit BridgeRegistered(bridgeId, _sourceChain, _targetChain);
        return bridgeId;
    }

    function initiateTransaction(
        bytes32 _bridgeId,
        bytes32 _dataHash,
        bytes memory _data,
        bytes memory _signature
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(bridges[_bridgeId].active, "Bridge not active");
        require(
            identityContract.isVerified(msg.sender),
            "User not verified"
        );

        // Verify data signature
        require(_verifyDataSignature(_data, _signature), "Invalid signature");

        bytes32 transactionId = keccak256(abi.encodePacked(
            _bridgeId,
            _dataHash,
            msg.sender,
            block.timestamp
        ));

        Transaction storage txn = transactions[transactionId];
        require(!txn.executed, "Transaction exists");

        txn.bridgeId = _bridgeId;
        txn.dataHash = _dataHash;
        txn.initiator = msg.sender;
        txn.timestamp = block.timestamp;
        txn.validations = 0;
        txn.executed = false;

        emit TransactionInitiated(transactionId, _bridgeId, _dataHash);
        return transactionId;
    }

    function validateTransaction(
        bytes32 _transactionId
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        Transaction storage txn = transactions[_transactionId];
        require(txn.initiator != address(0), "Transaction not found");
        require(!txn.executed, "Transaction already executed");
        require(!txn.hasValidated[msg.sender], "Already validated");

        Bridge storage bridge = bridges[txn.bridgeId];
        require(bridge.validators[msg.sender], "Not a bridge validator");

        txn.hasValidated[msg.sender] = true;
        txn.validations++;

        emit TransactionValidated(_transactionId, msg.sender);

        if (txn.validations >= bridge.requiredValidations) {
            _executeTransaction(_transactionId);
        }
    }

    function getBridge(
        bytes32 _bridgeId
    ) external view returns (
        ChainType sourceChain,
        ChainType targetChain,
        address bridgeContract,
        uint256 requiredValidations,
        bool active
    ) {
        Bridge storage bridge = bridges[_bridgeId];
        return (
            bridge.sourceChain,
            bridge.targetChain,
            bridge.bridgeContract,
            bridge.requiredValidations,
            bridge.active
        );
    }

    function getTransaction(
        bytes32 _transactionId
    ) external view returns (
        bytes32 bridgeId,
        bytes32 dataHash,
        address initiator,
        uint256 timestamp,
        uint256 validations,
        bool executed
    ) {
        Transaction storage txn = transactions[_transactionId];
        return (
            txn.bridgeId,
            txn.dataHash,
            txn.initiator,
            txn.timestamp,
            txn.validations,
            txn.executed
        );
    }

    function isValidator(
        bytes32 _bridgeId,
        address _validator
    ) external view returns (bool) {
        return bridges[_bridgeId].validators[_validator];
    }

    function _executeTransaction(
        bytes32 _transactionId
    ) internal {
        Transaction storage txn = transactions[_transactionId];
        Bridge storage bridge = bridges[txn.bridgeId];

        // Update chain nonce
        chainNonces[bridge.targetChain]++;

        txn.executed = true;
        emit TransactionExecuted(_transactionId, txn.bridgeId);
    }

    function _verifyDataSignature(
        bytes memory _data,
        bytes memory _signature
    ) internal pure returns (bool) {
        // Implement signature verification logic
        return keccak256(_data).length > 0 && _signature.length > 0;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function addValidator(
        bytes32 _bridgeId,
        address _validator
    ) external onlyRole(BRIDGE_OPERATOR_ROLE) {
        require(bridges[_bridgeId].active, "Bridge not active");
        bridges[_bridgeId].validators[_validator] = true;
        _grantRole(VALIDATOR_ROLE, _validator);
    }

    function removeValidator(
        bytes32 _bridgeId,
        address _validator
    ) external onlyRole(BRIDGE_OPERATOR_ROLE) {
        require(bridges[_bridgeId].active, "Bridge not active");
        bridges[_bridgeId].validators[_validator] = false;
        _revokeRole(VALIDATOR_ROLE, _validator);
    }
}
