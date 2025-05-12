// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title UHCGovernance
 * @dev Main governance contract for the Universal Health Chain platform
 */
contract UHCGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    enum ProposalType {
        General,
        Technical,
        Clinical,
        Financial,
        Emergency
    }

    struct ProposalDetails {
        ProposalType proposalType;
        string title;
        string description;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
    }

    mapping(uint256 => ProposalDetails) public proposalDetails;
    mapping(ProposalType => uint256) public proposalTypeQuorum;
    mapping(ProposalType => uint256) public proposalTypeThreshold;

    event ProposalTypeConfigUpdated(
        ProposalType indexed proposalType,
        uint256 quorum,
        uint256 threshold
    );

    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        Governor("Universal Health Chain Governance")
        GovernorSettings(
            _votingDelay,    // 1 day in blocks
            _votingPeriod,   // 1 week in blocks
            _proposalThreshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {
        // Initialize default settings for proposal types
        proposalTypeQuorum[ProposalType.General] = 10; // 10%
        proposalTypeQuorum[ProposalType.Technical] = 15; // 15%
        proposalTypeQuorum[ProposalType.Clinical] = 20; // 20%
        proposalTypeQuorum[ProposalType.Financial] = 25; // 25%
        proposalTypeQuorum[ProposalType.Emergency] = 30; // 30%

        proposalTypeThreshold[ProposalType.General] = 100000 * 10**18; // 100,000 tokens
        proposalTypeThreshold[ProposalType.Technical] = 200000 * 10**18;
        proposalTypeThreshold[ProposalType.Clinical] = 300000 * 10**18;
        proposalTypeThreshold[ProposalType.Financial] = 400000 * 10**18;
        proposalTypeThreshold[ProposalType.Emergency] = 500000 * 10**18;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory title,
        string memory description,
        ProposalType proposalType
    ) public virtual returns (uint256) {
        require(
            getVotes(msg.sender, block.number - 1) >= proposalTypeThreshold[proposalType],
            "Governor: proposer votes below threshold"
        );

        uint256 proposalId = super.propose(targets, values, calldatas, description);

        proposalDetails[proposalId] = ProposalDetails({
            proposalType: proposalType,
            title: title,
            description: description,
            proposer: msg.sender,
            startBlock: proposalSnapshot(proposalId),
            endBlock: proposalDeadline(proposalId),
            executed: false
        });

        return proposalId;
    }

    function updateProposalTypeConfig(
        ProposalType _type,
        uint256 _quorum,
        uint256 _threshold
    ) external onlyGovernance {
        require(_quorum <= 100, "Quorum percentage too high");
        require(_threshold > 0, "Invalid threshold");

        proposalTypeQuorum[_type] = _quorum;
        proposalTypeThreshold[_type] = _threshold;

        emit ProposalTypeConfigUpdated(_type, _quorum, _threshold);
    }

    function getProposalDetails(
        uint256 proposalId
    ) external view returns (ProposalDetails memory) {
        return proposalDetails[proposalId];
    }

    // Override required functions
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
        proposalDetails[proposalId].executed = true;
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
