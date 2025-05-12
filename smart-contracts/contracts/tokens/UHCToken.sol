// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title UHCToken
 * @dev Main token contract for the Universal Health Chain platform
 */
contract UHCToken is ERC20, ERC20Burnable, ERC20Snapshot, AccessControl, 
    Pausable, ERC20Permit, ERC20Votes {
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 2_000_000_000 * 10**18; // 2 billion tokens

    mapping(address => bool) public isBlacklisted;

    event AddressBlacklisted(address indexed account);
    event AddressUnblacklisted(address indexed account);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor()
        ERC20("Universal Health Chain Token", "UHC")
        ERC20Permit("Universal Health Chain Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SNAPSHOT_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function snapshot() public onlyRole(SNAPSHOT_ROLE) {
        _snapshot();
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "Would exceed max supply"
        );
        require(!isBlacklisted[to], "Recipient is blacklisted");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(uint256 amount) public override {
        require(!isBlacklisted[msg.sender], "Account is blacklisted");
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    function blacklistAddress(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isBlacklisted[account], "Address already blacklisted");
        isBlacklisted[account] = true;
        emit AddressBlacklisted(account);
    }

    function unblacklistAddress(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isBlacklisted[account], "Address not blacklisted");
        isBlacklisted[account] = false;
        emit AddressUnblacklisted(account);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused {
        require(!isBlacklisted[from] && !isBlacklisted[to], "Transfer blocked");
        super._beforeTokenTransfer(from, to, amount);
    }

    // The following functions are overrides required by Solidity
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
