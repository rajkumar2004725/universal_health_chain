// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title UHCTimelock
 * @dev Timelock controller for Universal Health Chain governance
 */
contract UHCTimelock is TimelockController {
    /**
     * @dev Constructor
     * @param minDelay minimum delay for operations
     * @param proposers account addresses that can propose
     * @param executors account addresses that can execute
     * @param admin optional account to be granted admin role
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}

    /**
     * @dev Function to check if an operation is pending
     * @param id operation identifier
     */
    function isOperationPending(bytes32 id) public view virtual override returns (bool) {
        return super.isOperationPending(id);
    }

    /**
     * @dev Function to check if an operation is ready
     * @param id operation identifier
     */
    function isOperationReady(bytes32 id) public view virtual override returns (bool) {
        return super.isOperationReady(id);
    }

    /**
     * @dev Function to check if an operation is done
     * @param id operation identifier
     */
    function isOperationDone(bytes32 id) public view virtual override returns (bool) {
        return super.isOperationDone(id);
    }

    /**
     * @dev Get timestamp at which an operation becomes valid
     * @param id operation identifier
     */
    function getTimestamp(bytes32 id) public view virtual override returns (uint256) {
        return super.getTimestamp(id);
    }
}
