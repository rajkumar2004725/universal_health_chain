// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title StakeholderVoting
 * @dev Manages weighted voting for different stakeholder groups
 */
contract StakeholderVoting is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VOTING_MANAGER_ROLE = keccak256("VOTING_MANAGER_ROLE");

    IUHCIdentity public identityContract;

    struct Vote {
        bool hasVoted;
        bool support;
        uint256 weight;
        string justification;
    }

    struct Ballot {
        bytes32 proposalId;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        mapping(address => Vote) votes;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(IUHCIdentity.IdentityType => uint256) stakeholderWeights;
    }

    mapping(bytes32 => Ballot) public ballots;
    mapping(IUHCIdentity.IdentityType => uint256) public defaultStakeholderWeights;

    event BallotCreated(
        bytes32 indexed proposalId,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        bytes32 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    
    event BallotExecuted(bytes32 indexed proposalId);
    event BallotCanceled(bytes32 indexed proposalId);
    
    event StakeholderWeightUpdated(
        IUHCIdentity.IdentityType indexed stakeholderType,
        uint256 weight
    );

    constructor(address _identityContract) {
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VOTING_MANAGER_ROLE, msg.sender);

        // Initialize default weights
        defaultStakeholderWeights[IUHCIdentity.IdentityType.Patient] = 1;
        defaultStakeholderWeights[IUHCIdentity.IdentityType.Provider] = 2;
        defaultStakeholderWeights[IUHCIdentity.IdentityType.Researcher] = 2;
        defaultStakeholderWeights[IUHCIdentity.IdentityType.Admin] = 3;
    }

    struct WeightConfig {
        IUHCIdentity.IdentityType stakeholderType;
        uint256 weight;
    }

    function createBallot(
        string memory _title,
        string memory _description,
        uint256 _duration,
        WeightConfig[] memory _customWeights
    ) external onlyRole(VOTING_MANAGER_ROLE) whenNotPaused returns (bytes32) {
        require(_duration >= 1 days, "Duration too short");
        require(_duration <= 30 days, "Duration too long");

        bytes32 proposalId = keccak256(abi.encodePacked(
            _title,
            block.timestamp
        ));

        Ballot storage ballot = ballots[proposalId];
        ballot.proposalId = proposalId;
        ballot.title = _title;
        ballot.description = _description;
        ballot.startTime = block.timestamp;
        ballot.endTime = block.timestamp + _duration;

        // Set stakeholder weights
        for (uint i = 0; i < 4; i++) {
            IUHCIdentity.IdentityType stakeholderType = IUHCIdentity.IdentityType(i);
            uint256 weight = defaultStakeholderWeights[stakeholderType];
            ballot.stakeholderWeights[stakeholderType] = weight;
        }

        // Apply custom weights
        for (uint i = 0; i < _customWeights.length; i++) {
            require(
                uint256(_customWeights[i].stakeholderType) < 4,
                "Invalid stakeholder type"
            );
            require(_customWeights[i].weight > 0, "Invalid weight");
            ballot.stakeholderWeights[_customWeights[i].stakeholderType] = _customWeights[i].weight;
        }

        emit BallotCreated(proposalId, _title, ballot.startTime, ballot.endTime);
        return proposalId;
    }

    function castVote(
        bytes32 _proposalId,
        bool _support,
        string memory _justification
    ) external whenNotPaused {
        require(
            identityContract.isVerified(msg.sender),
            "Voter not verified"
        );

        Ballot storage ballot = ballots[_proposalId];
        require(ballot.proposalId == _proposalId, "Ballot does not exist");
        require(!ballot.executed && !ballot.canceled, "Ballot not active");
        require(
            block.timestamp >= ballot.startTime &&
            block.timestamp <= ballot.endTime,
            "Voting period invalid"
        );
        require(!ballot.votes[msg.sender].hasVoted, "Already voted");

        IUHCIdentity.IdentityType voterType = identityContract.getIdentity(msg.sender).role;
        uint256 weight = ballot.stakeholderWeights[voterType];

        ballot.votes[msg.sender] = Vote({
            hasVoted: true,
            support: _support,
            weight: weight,
            justification: _justification
        });

        if (_support) {
            ballot.forVotes += weight;
        } else {
            ballot.againstVotes += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    function executeBallot(
        bytes32 _proposalId
    ) external onlyRole(VOTING_MANAGER_ROLE) whenNotPaused {
        Ballot storage ballot = ballots[_proposalId];
        require(ballot.proposalId == _proposalId, "Ballot does not exist");
        require(!ballot.executed && !ballot.canceled, "Ballot not active");
        require(block.timestamp > ballot.endTime, "Voting period not ended");

        ballot.executed = true;
        emit BallotExecuted(_proposalId);
    }

    function cancelBallot(
        bytes32 _proposalId
    ) external onlyRole(VOTING_MANAGER_ROLE) whenNotPaused {
        Ballot storage ballot = ballots[_proposalId];
        require(ballot.proposalId == _proposalId, "Ballot does not exist");
        require(!ballot.executed && !ballot.canceled, "Ballot not active");

        ballot.canceled = true;
        emit BallotCanceled(_proposalId);
    }

    function updateStakeholderWeight(
        IUHCIdentity.IdentityType _stakeholderType,
        uint256 _weight
    ) external onlyRole(ADMIN_ROLE) {
        require(_weight > 0, "Invalid weight");
        defaultStakeholderWeights[_stakeholderType] = _weight;
        emit StakeholderWeightUpdated(_stakeholderType, _weight);
    }

    function getBallotResults(
        bytes32 _proposalId
    ) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        bool executed,
        bool canceled
    ) {
        Ballot storage ballot = ballots[_proposalId];
        return (
            ballot.forVotes,
            ballot.againstVotes,
            ballot.executed,
            ballot.canceled
        );
    }

    function getVoteInfo(
        bytes32 _proposalId,
        address _voter
    ) external view returns (Vote memory) {
        return ballots[_proposalId].votes[_voter];
    }

    function getBallotStatus(
        bytes32 _proposalId
    ) external view returns (
        bool active,
        bool canVote,
        bool canExecute
    ) {
        Ballot storage ballot = ballots[_proposalId];
        
        active = !ballot.executed && !ballot.canceled;
        canVote = active &&
                  block.timestamp >= ballot.startTime &&
                  block.timestamp <= ballot.endTime;
        canExecute = active &&
                    block.timestamp > ballot.endTime &&
                    hasRole(VOTING_MANAGER_ROLE, msg.sender);
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
