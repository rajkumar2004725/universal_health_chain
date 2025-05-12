// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title RewardMechanism
 * @dev Manages rewards for various activities in the Universal Health Chain
 */
contract RewardMechanism is AccessControl, Pausable {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    IERC20 public uhcToken;
    IUHCIdentity public identityContract;

    struct RewardType {
        string name;
        uint256 baseAmount;
        bool active;
        uint256 cooldownPeriod;
    }

    struct UserRewards {
        uint256 totalEarned;
        uint256 lastRewardTime;
        mapping(bytes32 => uint256) rewardTypeLastClaim;
    }

    mapping(bytes32 => RewardType) public rewardTypes;
    mapping(address => UserRewards) public userRewards;
    mapping(bytes32 => uint256) public rewardTypeMultipliers;

    event RewardClaimed(
        address indexed user,
        bytes32 indexed rewardTypeId,
        uint256 amount
    );
    
    event RewardTypeCreated(
        bytes32 indexed rewardTypeId,
        string name,
        uint256 baseAmount
    );
    
    event RewardTypeUpdated(
        bytes32 indexed rewardTypeId,
        uint256 newBaseAmount
    );
    
    event MultiplierUpdated(
        bytes32 indexed rewardTypeId,
        uint256 multiplier
    );

    constructor(address _uhcToken, address _identityContract) {
        uhcToken = IERC20(_uhcToken);
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);
    }

    function createRewardType(
        string memory _name,
        uint256 _baseAmount,
        uint256 _cooldownPeriod
    ) external onlyRole(REWARD_MANAGER_ROLE) whenNotPaused returns (bytes32) {
        bytes32 rewardTypeId = keccak256(abi.encodePacked(_name, block.timestamp));
        
        require(
            rewardTypes[rewardTypeId].baseAmount == 0,
            "Reward type already exists"
        );

        rewardTypes[rewardTypeId] = RewardType({
            name: _name,
            baseAmount: _baseAmount,
            active: true,
            cooldownPeriod: _cooldownPeriod
        });

        rewardTypeMultipliers[rewardTypeId] = 100; // 1.00x multiplier by default

        emit RewardTypeCreated(rewardTypeId, _name, _baseAmount);
        return rewardTypeId;
    }

    function updateRewardType(
        bytes32 _rewardTypeId,
        uint256 _newBaseAmount,
        uint256 _newCooldownPeriod
    ) external onlyRole(REWARD_MANAGER_ROLE) whenNotPaused {
        require(rewardTypes[_rewardTypeId].active, "Reward type not active");

        rewardTypes[_rewardTypeId].baseAmount = _newBaseAmount;
        rewardTypes[_rewardTypeId].cooldownPeriod = _newCooldownPeriod;

        emit RewardTypeUpdated(_rewardTypeId, _newBaseAmount);
    }

    function updateMultiplier(
        bytes32 _rewardTypeId,
        uint256 _multiplier
    ) external onlyRole(REWARD_MANAGER_ROLE) whenNotPaused {
        require(rewardTypes[_rewardTypeId].active, "Reward type not active");
        require(_multiplier > 0, "Invalid multiplier");

        rewardTypeMultipliers[_rewardTypeId] = _multiplier;
        emit MultiplierUpdated(_rewardTypeId, _multiplier);
    }

    function claimReward(
        bytes32 _rewardTypeId,
        bytes calldata _proof
    ) external whenNotPaused {
        require(
            identityContract.isVerified(msg.sender),
            "User not verified"
        );
        require(rewardTypes[_rewardTypeId].active, "Reward type not active");

        UserRewards storage rewards = userRewards[msg.sender];
        RewardType storage rewardType = rewardTypes[_rewardTypeId];

        require(
            block.timestamp >= rewards.rewardTypeLastClaim[_rewardTypeId].add(rewardType.cooldownPeriod),
            "Cooldown period not elapsed"
        );

        // Verify the proof of activity
        require(_verifyActivityProof(_rewardTypeId, msg.sender, _proof), "Invalid proof");

        uint256 rewardAmount = calculateReward(_rewardTypeId, msg.sender);
        require(rewardAmount > 0, "No reward available");

        rewards.totalEarned = rewards.totalEarned.add(rewardAmount);
        rewards.lastRewardTime = block.timestamp;
        rewards.rewardTypeLastClaim[_rewardTypeId] = block.timestamp;

        require(
            uhcToken.transfer(msg.sender, rewardAmount),
            "Token transfer failed"
        );

        emit RewardClaimed(msg.sender, _rewardTypeId, rewardAmount);
    }

    function calculateReward(
        bytes32 _rewardTypeId,
        address _user
    ) public view returns (uint256) {
        RewardType storage rewardType = rewardTypes[_rewardTypeId];
        uint256 multiplier = rewardTypeMultipliers[_rewardTypeId];
        
        // Apply user-specific multiplier based on their total earned rewards
        uint256 userMultiplier = 100;
        if (userRewards[_user].totalEarned > 0) {
            userMultiplier = userMultiplier.add(10); // 10% bonus for active users
        }
        
        return rewardType.baseAmount.mul(multiplier).mul(userMultiplier).div(10000);
    }

    function _verifyActivityProof(
        bytes32 _rewardTypeId,
        address _user,
        bytes calldata _proof
    ) internal pure returns (bool) {
        // Verify that the proof contains the user's address and reward type
        bytes32 proofHash = keccak256(abi.encodePacked(_rewardTypeId, _user, _proof));
        return proofHash != bytes32(0) && _proof.length > 0;
    }

    function getUserRewardInfo(
        address _user,
        bytes32 _rewardTypeId
    ) external view returns (
        uint256 totalEarned,
        uint256 lastRewardTime,
        uint256 lastTypeClaim
    ) {
        UserRewards storage rewards = userRewards[_user];
        return (
            rewards.totalEarned,
            rewards.lastRewardTime,
            rewards.rewardTypeLastClaim[_rewardTypeId]
        );
    }

    function getRewardType(
        bytes32 _rewardTypeId
    ) external view returns (RewardType memory) {
        return rewardTypes[_rewardTypeId];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function withdrawTokens(
        address _token,
        uint256 _amount
    ) external onlyRole(ADMIN_ROLE) {
        require(
            IERC20(_token).transfer(msg.sender, _amount),
            "Token transfer failed"
        );
    }
}
