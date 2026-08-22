// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IReputationBadge {
    function mint(address to, uint256 badgeType) external;
}

/// @title GetCommitted
/// @notice On-chain discipline staking pools with XP reputation and perk marketplace
/// @dev Deployed on Monad Testnet (chain 10143)
///      Gas note: Monad charges on gas_limit not gas_used — all limits are hardcoded tight.
contract GetCommitted is ReentrancyGuard, Ownable, Pausable {

    // ─────────────────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────────────────

    struct Pool {
        uint256 id;
        address creator;
        string  goal;
        uint256 stakeAmount;       // exact stake every participant must send
        uint256 deadline;          // unix timestamp
        uint256 totalStaked;       // sum of all active stakes (decremented on failure)
        uint256 slashedTreasury;   // sum of all forfeited stakes
        uint256 sharePerWinner;    // uniform equal share = slashedTreasury / successCount
        uint8   status;            // 0=Active 1=Settled 2=Cancelled
        uint256 participantCount;
        uint256 successCount;
    }

    struct ParticipantState {
        bool joined;
        bool failed;
        bool claimed;
        bool hadYieldBoosterAtJoin; // snapshot at join time
    }

    struct UserProfile {
        uint256 xp;
        uint256 streak;
        uint256 lastCompletedDay;  // unix day number (block.timestamp / 1 days)
        uint8   level;             // 1–4
        bool    hasShield;
        bool    hasYieldBooster;
    }

    // ─────────────────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────────────────

    uint256 public poolCount;
    IReputationBadge public badgeContract;

    mapping(uint256 => Pool)                                    public pools;
    mapping(uint256 => address[])                               public poolParticipants;
    mapping(uint256 => mapping(address => ParticipantState))    public participantStates;
    mapping(address => UserProfile)                             public userProfiles;

    // XP thresholds
    uint256 private constant XP_LEVEL_2 = 201;
    uint256 private constant XP_LEVEL_3 = 601;
    uint256 private constant XP_LEVEL_4 = 1500;

    // Perk XP costs
    uint256 private constant COST_SHIELD   = 150;
    uint256 private constant COST_BOOSTER  = 300;
    uint256 private constant COST_BADGE    = 500;
    uint256 private constant COST_FEE_WAIVER = 100;

    // Yield booster multiplier numerator (denominator = 10)
    uint256 private constant BOOSTER_MULT_NUM = 12; // 1.2x

    // ─────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────

    event PoolCreated(uint256 indexed poolId, address indexed creator, string goal, uint256 stakeAmount, uint256 deadline);
    event PoolJoined(uint256 indexed poolId, address indexed participant, uint256 totalStaked);
    event ParticipantFailed(uint256 indexed poolId, address indexed participant, uint256 slashedAmount);
    event PoolSettled(uint256 indexed poolId, uint256 totalSlashed, uint256 successCount, uint256 sharePerWinner);
    event PayoutClaimed(uint256 indexed poolId, address indexed participant, uint256 amount);
    event XPAwarded(address indexed user, uint256 xpAwarded, uint256 newTotal, uint8 level);
    event PerkRedeemed(address indexed user, string perkType);
    event BadgeMinted(address indexed user, uint256 badgeType);
    event PoolCancelled(uint256 indexed poolId);

    // ─────────────────────────────────────────────────────────
    //  ERRORS
    // ─────────────────────────────────────────────────────────

    error PoolNotActive();
    error DeadlinePassed();
    error DeadlineNotReached();
    error WrongStakeAmount();
    error AlreadyJoined();
    error NotParticipant();
    error AlreadyFailed();
    error AlreadyClaimed();
    error NotAuthorized();
    error PoolNotSettled();
    error YouFailed();
    error InsufficientXP();
    error AlreadyHasPerk();
    error TransferFailed();
    error NothingToSettle();
    error InvalidDuration();
    error EmptyGoal();
    error ZeroStake();

    // ─────────────────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────────────────

    constructor(address _badgeContract) Ownable(msg.sender) {
        badgeContract = IReputationBadge(_badgeContract);
    }

    // ─────────────────────────────────────────────────────────
    //  POOL MANAGEMENT
    // ─────────────────────────────────────────────────────────

    /// @notice Create a new accountability pool. Creator is automatically the first participant.
    /// @param goal  Human-readable goal description (stored onchain for transparency)
    /// @param duration  Pool duration in seconds from now
    /// @return poolId  The newly created pool ID
    /// Gas limit: 135,000
    function createPool(string calldata goal, uint256 duration)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 poolId)
    {
        if (msg.value == 0)            revert ZeroStake();
        if (duration == 0)             revert InvalidDuration();
        if (bytes(goal).length == 0)   revert EmptyGoal();

        poolId = ++poolCount;
        Pool storage pool = pools[poolId];
        pool.id            = poolId;
        pool.creator       = msg.sender;
        pool.goal          = goal;
        pool.stakeAmount   = msg.value;
        pool.deadline      = block.timestamp + duration;
        pool.totalStaked   = msg.value;
        pool.status        = 0;
        pool.participantCount = 1;

        poolParticipants[poolId].push(msg.sender);
        participantStates[poolId][msg.sender] = ParticipantState({
            joined:                 true,
            failed:                 false,
            claimed:                false,
            hadYieldBoosterAtJoin:  userProfiles[msg.sender].hasYieldBooster
        });

        emit PoolCreated(poolId, msg.sender, goal, msg.value, pool.deadline);
        emit PoolJoined(poolId, msg.sender, pool.totalStaked);
    }

    /// @notice Join an existing active pool. Must send exactly pool.stakeAmount.
    /// Gas limit: 90,000
    function joinPool(uint256 poolId) external payable nonReentrant whenNotPaused {
        Pool storage pool = pools[poolId];
        if (pool.status != 0)                         revert PoolNotActive();
        if (block.timestamp >= pool.deadline)          revert DeadlinePassed();
        if (msg.value != pool.stakeAmount)             revert WrongStakeAmount();
        if (participantStates[poolId][msg.sender].joined) revert AlreadyJoined();

        participantStates[poolId][msg.sender] = ParticipantState({
            joined:                 true,
            failed:                 false,
            claimed:                false,
            hadYieldBoosterAtJoin:  userProfiles[msg.sender].hasYieldBooster
        });

        poolParticipants[poolId].push(msg.sender);
        pool.totalStaked     += msg.value;
        pool.participantCount++;

        emit PoolJoined(poolId, msg.sender, pool.totalStaked);
    }

    /// @notice Report failure for a participant (self-report or owner/admin).
    ///         Triggered by the frontend when Page Visibility API detects distraction.
    ///         Only the user themselves or the contract owner may call this — no third-party griefing.
    /// Gas limit: 70,000
    function reportFailure(uint256 poolId, address user) external nonReentrant whenNotPaused {
        if (msg.sender != user && msg.sender != owner()) revert NotAuthorized();

        Pool storage pool = pools[poolId];
        if (pool.status != 0)                          revert PoolNotActive();
        if (block.timestamp >= pool.deadline)          revert DeadlinePassed();

        ParticipantState storage state = participantStates[poolId][user];
        if (!state.joined)  revert NotParticipant();
        if (state.failed)   revert AlreadyFailed();

        state.failed = true;
        pool.slashedTreasury += pool.stakeAmount;
        pool.totalStaked     -= pool.stakeAmount;

        // Streak shield absorbs the failure penalty
        UserProfile storage profile = userProfiles[user];
        if (profile.hasShield) {
            profile.hasShield = false;
            emit PerkRedeemed(user, "SHIELD_CONSUMED");
            // Stake is still forfeited, but streak is protected
        } else {
            // Dock 25 XP (floor 0) and reset streak
            profile.xp    = profile.xp >= 25 ? profile.xp - 25 : 0;
            profile.streak = 0;
            _updateLevel(user);
        }

        emit ParticipantFailed(poolId, user, pool.stakeAmount);
    }

    /// @notice Settle a pool after its deadline. Anyone can call once deadline passes.
    ///         Computes share per winner and awards XP to all successful participants.
    /// Gas limit: 200,000 (scales with participant count — keep pools ≤ 20 participants for safety)
    function settlePool(uint256 poolId) external nonReentrant whenNotPaused {
        Pool storage pool = pools[poolId];
        if (pool.status != 0) revert PoolNotActive();
        if (block.timestamp < pool.deadline && msg.sender != owner()) revert DeadlineNotReached();

        address[] storage participants = poolParticipants[poolId];
        uint256 successCount = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            if (!participantStates[poolId][participants[i]].failed) {
                successCount++;
            }
        }

        pool.successCount = successCount;

        // Edge case: everyone failed — cancel pool (funds stay in contract, admin can return)
        if (successCount == 0) {
            pool.status = 2; // Cancelled
            emit PoolCancelled(poolId);
            emit PoolSettled(poolId, pool.slashedTreasury, 0, 0);
            return;
        }

        // Uniform equal share: slashedTreasury / successCount
        uint256 sharePerWinner = pool.slashedTreasury / successCount;
        pool.sharePerWinner = sharePerWinner;
        pool.status = 1; // Settled

        // Award XP to successful participants
        for (uint256 i = 0; i < participants.length; i++) {
            if (!participantStates[poolId][participants[i]].failed) {
                _awardXP(participants[i]);
            }
        }

        emit PoolSettled(poolId, pool.slashedTreasury, successCount, sharePerWinner);
    }

    /// @notice Claim payout after pool settles. Returns full stake + equal share of slashed treasury.
    ///         If user held a Yield Booster at join time, their bonus share is 1.2x.
    /// Gas limit: 65,000
    function claimPayout(uint256 poolId) external nonReentrant whenNotPaused {
        Pool storage pool = pools[poolId];
        if (pool.status != 1)  revert PoolNotSettled();

        ParticipantState storage state = participantStates[poolId][msg.sender];
        if (!state.joined)    revert NotParticipant();
        if (state.failed)     revert YouFailed();
        if (state.claimed)    revert AlreadyClaimed();

        state.claimed = true;

        // Base payout = stake back + equal bonus share
        uint256 bonus = pool.sharePerWinner;

        // Yield Booster: 1.2x on bonus portion (snapshotted at join)
        if (state.hadYieldBoosterAtJoin) {
            bonus = (bonus * BOOSTER_MULT_NUM) / 10;
            // Consume the booster from user profile
            userProfiles[msg.sender].hasYieldBooster = false;
        }

        uint256 payout = pool.stakeAmount + bonus;

        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        if (!ok) revert TransferFailed();

        emit PayoutClaimed(poolId, msg.sender, payout);
    }

    // ─────────────────────────────────────────────────────────
    //  PROFILE VIEW
    // ─────────────────────────────────────────────────────────

    /// @notice Get a user's on-chain profile summary
    function getUserProfile(address user)
        external
        view
        returns (uint256 xp, uint256 streak, uint256 level, bool hasShield)
    {
        UserProfile storage p = userProfiles[user];
        return (p.xp, p.streak, p.level, p.hasShield);
    }

    /// @notice Get all participants in a pool
    function getPoolParticipants(uint256 poolId) external view returns (address[] memory) {
        return poolParticipants[poolId];
    }

    /// @notice Get the total number of pools
    function getPoolCount() external view returns (uint256) {
        return poolCount;
    }

    // ─────────────────────────────────────────────────────────
    //  PERK MARKETPLACE
    // ─────────────────────────────────────────────────────────

    /// @notice Redeem Streak Shield — protects streak on next failure (stake still forfeited).
    ///         Cost: 150 XP
    /// Gas limit: 55,000
    function redeemStreakShield() external whenNotPaused {
        UserProfile storage p = userProfiles[msg.sender];
        if (p.xp < COST_SHIELD)   revert InsufficientXP();
        if (p.hasShield)          revert AlreadyHasPerk();
        p.xp -= COST_SHIELD;
        p.hasShield = true;
        _updateLevel(msg.sender);
        emit PerkRedeemed(msg.sender, "STREAK_SHIELD");
    }

    /// @notice Redeem Yield Booster — 1.2x on slashed-fund bonus for next pool claim.
    ///         Cost: 300 XP
    /// Gas limit: 55,000
    function redeemYieldBooster() external whenNotPaused {
        UserProfile storage p = userProfiles[msg.sender];
        if (p.xp < COST_BOOSTER)       revert InsufficientXP();
        if (p.hasYieldBooster)         revert AlreadyHasPerk();
        p.xp -= COST_BOOSTER;
        p.hasYieldBooster = true;
        _updateLevel(msg.sender);
        emit PerkRedeemed(msg.sender, "YIELD_BOOSTER");
    }

    /// @notice Mint a soulbound Reputation Badge NFT.
    ///         Cost: 500 XP. Badge type = current level.
    /// Gas limit: 105,000
    function mintReputationBadge() external whenNotPaused {
        UserProfile storage p = userProfiles[msg.sender];
        if (p.xp < COST_BADGE) revert InsufficientXP();
        p.xp -= COST_BADGE;
        uint256 badgeType = p.level;
        _updateLevel(msg.sender);
        badgeContract.mint(msg.sender, badgeType);
        emit BadgeMinted(msg.sender, badgeType);
        emit PerkRedeemed(msg.sender, "REPUTATION_BADGE");
    }

    // ─────────────────────────────────────────────────────────
    //  INTERNAL: XP & LEVELS
    // ─────────────────────────────────────────────────────────

    function _awardXP(address user) internal {
        UserProfile storage p = userProfiles[user];

        // Streak tracking (unix day granularity)
        uint256 today = block.timestamp / 1 days;
        if (p.lastCompletedDay == 0) {
            p.streak = 1;
        } else if (today == p.lastCompletedDay + 1) {
            p.streak++;        // consecutive day
        } else if (today > p.lastCompletedDay + 1) {
            p.streak = 1;      // gap — reset
        }
        // same day: no change to streak
        p.lastCompletedDay = today;

        // Multiplier in basis points (10000 = 1x)
        uint256 multiplierBps = 10_000;
        if (p.streak >= 7) multiplierBps = 20_000;       // 2.0x
        else if (p.streak >= 3) multiplierBps = 15_000;  // 1.5x

        uint256 xpAwarded = (50 * multiplierBps) / 10_000;
        p.xp += xpAwarded;

        _updateLevel(user);

        emit XPAwarded(user, xpAwarded, p.xp, p.level);
    }

    function _updateLevel(address user) internal {
        UserProfile storage p = userProfiles[user];
        uint8 newLevel;
        if (p.xp >= XP_LEVEL_4)      newLevel = 4;
        else if (p.xp >= XP_LEVEL_3) newLevel = 3;
        else if (p.xp >= XP_LEVEL_2) newLevel = 2;
        else                          newLevel = 1;
        p.level = newLevel;
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Emergency cancel — refunds non-failed participants
    function emergencyCancel(uint256 poolId) external onlyOwner nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.status == 0 || pool.status == 2, "Already settled");
        pool.status = 2;

        address[] storage participants = poolParticipants[poolId];
        for (uint256 i = 0; i < participants.length; i++) {
            ParticipantState storage state = participantStates[poolId][participants[i]];
            if (state.joined && !state.failed && !state.claimed) {
                state.claimed = true;
                (bool ok, ) = payable(participants[i]).call{value: pool.stakeAmount}("");
                if (!ok) revert TransferFailed();
            }
        }
        emit PoolCancelled(poolId);
    }

    function setBadgeContract(address _badge) external onlyOwner {
        badgeContract = IReputationBadge(_badge);
    }

    receive() external payable {}
}
