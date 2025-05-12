// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IUHCIdentity.sol";

/**
 * @title StakingContract
 * @dev Manages staking of UHC tokens for validators and service providers
 */
contract StakingContract is AccessControl, Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    IERC20 public uhcToken;
    IUHCIdentity public identityContract;

    struct StakingTier {
        uint256 minimumStake;
        uint256 rewardRate; // Annual reward rate in basis points (1% = 100)
        uint256 lockPeriod;
        bool active;
    }

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lastRewardTime;
        uint256 accumulatedRewards;
        bytes32 tierId;
        bool active;
    }

    mapping(bytes32 => StakingTier) public stakingTiers;
    mapping(address => Stake) public stakes;
    mapping(address => uint256) public slashHistory;

    uint256 public totalStaked;
    uint256 public constant REWARD_PRECISION = 10000; // For basis points
    uint256 public constant MIN_STAKE_DURATION = 7 days;
    uint256 public constant SLASH_PENALTY_RATE = 1000; // 10% in basis points

    event Staked(
        address indexed staker,
        uint256 amount,
        bytes32 tierId
    );
    
    event Unstaked(
        address indexed staker,
        uint256 amount
    );
    
    event RewardsClaimed(
        address indexed staker,
        uint256 amount
    );
    
    event Slashed(
        address indexed staker,
        uint256 amount,
        string reason
    );

    constructor(address _uhcToken, address _identityContract) {
        uhcToken = IERC20(_uhcToken);
        identityContract = IUHCIdentity(_identityContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createStakingTier(
        bytes32 _tierId,
        uint256 _minimumStake,
        uint256 _rewardRate,
        uint256 _lockPeriod
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(_minimumStake > 0, "Invalid minimum stake");
        require(_rewardRate <= 5000, "Reward rate too high"); // Max 50%
        require(_lockPeriod >= MIN_STAKE_DURATION, "Lock period too short");

        stakingTiers[_tierId] = StakingTier({
            minimumStake: _minimumStake,
            rewardRate: _rewardRate,
            lockPeriod: _lockPeriod,
            active: true
        });
    }

    function stake(
        uint256 _amount,
        bytes32 _tierId
    ) external nonReentrant whenNotPaused {
        require(
            identityContract.isVerified(msg.sender),
            "User not verified"
        );
        require(stakingTiers[_tierId].active, "Invalid staking tier");
        require(
            _amount >= stakingTiers[_tierId].minimumStake,
            "Amount below minimum"
        );
        require(!stakes[msg.sender].active, "Already staking");

        require(
            uhcToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        stakes[msg.sender] = Stake({
            amount: _amount,
            startTime: block.timestamp,
            lastRewardTime: block.timestamp,
            accumulatedRewards: 0,
            tierId: _tierId,
            active: true
        });

        totalStaked = totalStaked.add(_amount);
        emit Staked(msg.sender, _amount, _tierId);

        if (stakingTiers[_tierId].minimumStake >= getValidatorThreshold()) {
            _grantRole(VALIDATOR_ROLE, msg.sender);
        }
    }

    function unstake() external nonReentrant whenNotPaused {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");
        require(
            block.timestamp >= userStake.startTime.add(stakingTiers[userStake.tierId].lockPeriod),
            "Lock period not elapsed"
        );

        uint256 rewards = calculateRewards(msg.sender);
        uint256 totalAmount = userStake.amount.add(rewards);

        userStake.active = false;
        totalStaked = totalStaked.sub(userStake.amount);

        if (hasRole(VALIDATOR_ROLE, msg.sender)) {
            _revokeRole(VALIDATOR_ROLE, msg.sender);
        }

        require(
            uhcToken.transfer(msg.sender, totalAmount),
            "Transfer failed"
        );

        emit Unstaked(msg.sender, userStake.amount);
        if (rewards > 0) {
            emit RewardsClaimed(msg.sender, rewards);
        }
    }

    function claimRewards() external nonReentrant whenNotPaused {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");

        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");

        userStake.lastRewardTime = block.timestamp;
        userStake.accumulatedRewards = 0;

        require(
            uhcToken.transfer(msg.sender, rewards),
            "Transfer failed"
        );

        emit RewardsClaimed(msg.sender, rewards);
    }

    function slash(
        address _staker,
        uint256 _percentage,
        string calldata _reason
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(_percentage <= SLASH_PENALTY_RATE, "Penalty too high");
        
        Stake storage userStake = stakes[_staker];
        require(userStake.active, "No active stake");

        uint256 slashAmount = userStake.amount.mul(_percentage).div(REWARD_PRECISION);
        userStake.amount = userStake.amount.sub(slashAmount);
        totalStaked = totalStaked.sub(slashAmount);

        slashHistory[_staker] = slashHistory[_staker].add(slashAmount);

        if (userStake.amount < stakingTiers[userStake.tierId].minimumStake) {
            if (hasRole(VALIDATOR_ROLE, _staker)) {
                _revokeRole(VALIDATOR_ROLE, _staker);
            }
        }

        emit Slashed(_staker, slashAmount, _reason);
    }

    function calculateRewards(
        address _staker
    ) public view returns (uint256) {
        Stake storage userStake = stakes[_staker];
        if (!userStake.active) return 0;

        StakingTier storage tier = stakingTiers[userStake.tierId];
        
        uint256 timeElapsed = block.timestamp.sub(userStake.lastRewardTime);
        uint256 annualReward = userStake.amount.mul(tier.rewardRate).div(REWARD_PRECISION);
        uint256 reward = annualReward.mul(timeElapsed).div(365 days);

        return reward.add(userStake.accumulatedRewards);
    }

    function getValidatorThreshold() public pure returns (uint256) {
        return 100000 * 10**18; // 100,000 tokens
    }

    function getStakingTier(
        bytes32 _tierId
    ) external view returns (StakingTier memory) {
        return stakingTiers[_tierId];
    }

    function getStakeInfo(
        address _staker
    ) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 rewards,
        bytes32 tierId,
        bool active
    ) {
        Stake storage userStake = stakes[_staker];
        return (
            userStake.amount,
            userStake.startTime,
            calculateRewards(_staker),
            userStake.tierId,
            userStake.active
        );
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw(
        address _token,
        uint256 _amount
    ) external onlyRole(ADMIN_ROLE) {
        require(
            IERC20(_token).transfer(msg.sender, _amount),
            "Transfer failed"
        );
    }
}
