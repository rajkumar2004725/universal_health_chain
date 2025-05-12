// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NameRegistry
 * @dev Contract for managing human-readable names for addresses in the Universal Health Chain
 */
contract NameRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // Mapping from name hash to address
    mapping(bytes32 => address) private nameToAddress;
    
    // Mapping from address to name hash
    mapping(address => bytes32) private addressToName;
    
    // Mapping to track name expiry timestamps
    mapping(bytes32 => uint256) private nameExpiry;

    // Minimum registration period (1 year)
    uint256 public constant MIN_REGISTRATION_PERIOD = 365 days;
    
    event NameRegistered(string name, address indexed owner, uint256 expiryTime);
    event NameRenewed(string name, address indexed owner, uint256 newExpiryTime);
    event NameReleased(string name, address indexed previousOwner);
    event NameTransferred(string name, address indexed previousOwner, address indexed newOwner);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    /**
     * @dev Register a new name
     * @param _name Name to register
     * @param _owner Address to own the name
     * @param _duration Duration in seconds for the registration
     */
    function registerName(
        string calldata _name,
        address _owner,
        uint256 _duration
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_duration >= MIN_REGISTRATION_PERIOD, "Registration period too short");
        require(_owner != address(0), "Invalid owner address");
        
        bytes32 nameHash = keccak256(bytes(_name));
        require(nameToAddress[nameHash] == address(0), "Name already registered");
        require(addressToName[_owner] == bytes32(0), "Address already has a name");

        uint256 expiryTime = block.timestamp + _duration;
        
        nameToAddress[nameHash] = _owner;
        addressToName[_owner] = nameHash;
        nameExpiry[nameHash] = expiryTime;

        emit NameRegistered(_name, _owner, expiryTime);
    }

    /**
     * @dev Renew a name registration
     * @param _name Name to renew
     * @param _duration Additional duration in seconds
     */
    function renewName(
        string calldata _name,
        uint256 _duration
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_duration >= MIN_REGISTRATION_PERIOD, "Renewal period too short");
        
        bytes32 nameHash = keccak256(bytes(_name));
        require(nameToAddress[nameHash] != address(0), "Name not registered");
        require(nameExpiry[nameHash] > block.timestamp, "Name expired");

        uint256 newExpiryTime = nameExpiry[nameHash] + _duration;
        nameExpiry[nameHash] = newExpiryTime;

        emit NameRenewed(_name, nameToAddress[nameHash], newExpiryTime);
    }

    /**
     * @dev Release a name
     * @param _name Name to release
     */
    function releaseName(string calldata _name) external whenNotPaused {
        bytes32 nameHash = keccak256(bytes(_name));
        address owner = nameToAddress[nameHash];
        
        require(owner == msg.sender, "Not the name owner");

        delete nameToAddress[nameHash];
        delete addressToName[owner];
        delete nameExpiry[nameHash];

        emit NameReleased(_name, owner);
    }

    /**
     * @dev Transfer a name to a new owner
     * @param _name Name to transfer
     * @param _newOwner New owner address
     */
    function transferName(
        string calldata _name,
        address _newOwner
    ) external whenNotPaused {
        require(_newOwner != address(0), "Invalid new owner");
        
        bytes32 nameHash = keccak256(bytes(_name));
        address currentOwner = nameToAddress[nameHash];
        
        require(currentOwner == msg.sender, "Not the name owner");
        require(addressToName[_newOwner] == bytes32(0), "New owner already has a name");
        require(nameExpiry[nameHash] > block.timestamp, "Name expired");

        nameToAddress[nameHash] = _newOwner;
        delete addressToName[currentOwner];
        addressToName[_newOwner] = nameHash;

        emit NameTransferred(_name, currentOwner, _newOwner);
    }

    /**
     * @dev Get the address for a name
     * @param _name Name to look up
     */
    function getAddress(string calldata _name) external view returns (address) {
        bytes32 nameHash = keccak256(bytes(_name));
        require(nameExpiry[nameHash] > block.timestamp, "Name expired or not registered");
        return nameToAddress[nameHash];
    }

    /**
     * @dev Get the name for an address
     * @param _address Address to look up
     */
    function getName(address _address) external view returns (string memory) {
        bytes32 nameHash = addressToName[_address];
        require(nameExpiry[nameHash] > block.timestamp, "No valid name for address");
        // Note: In a real implementation, you'd need to store and return the actual string
        // This is a simplified version that only works with the hash
        return bytes32ToString(nameHash);
    }

    /**
     * @dev Get the expiry time for a name
     * @param _name Name to check
     */
    function getNameExpiry(string calldata _name) external view returns (uint256) {
        bytes32 nameHash = keccak256(bytes(_name));
        return nameExpiry[nameHash];
    }

    /**
     * @dev Convert bytes32 to string (helper function)
     * @param _bytes32 Bytes to convert
     */
    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        // This is a simplified conversion - in production you'd want to store the original string
        bytes memory bytesArray = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            bytes1 char = bytes1(bytes32(uint256(_bytes32) * 2 ** (8 * i)));
            bytesArray[i*2] = char;
            bytesArray[i*2+1] = char;
        }
        return string(bytesArray);
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
