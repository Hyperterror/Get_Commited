// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GetCommitted.sol";
import "../src/ReputationBadge.sol";

contract GetCommittedTest is Test {

    GetCommitted public gc;
    ReputationBadge public badge;

    address public owner  = address(this);
    address public alice  = makeAddr("alice");
    address public bob    = makeAddr("bob");
    address public carol  = makeAddr("carol");
    address public dave   = makeAddr("dave");

    uint256 constant STAKE = 1 ether; // 1 MON on testnet
    uint256 constant ONE_HOUR = 3600;

    function setUp() public {
        badge = new ReputationBadge();
        gc    = new GetCommitted(address(badge));
        badge.setMinter(address(gc));

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob,   100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(dave,  100 ether);
    }

    // ─────────────────────────────────────────────────────────
    //  POOL CREATION
    // ─────────────────────────────────────────────────────────

    function test_createPool_basic() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("1-Hour Study Sprint", ONE_HOUR);

        assertEq(poolId, 1, "First pool should have ID 1");

        (
            uint256 id, address creator, string memory goal,
            uint256 stakeAmount, uint256 deadline, uint256 totalStaked,
            uint256 slashedTreasury, uint256 sharePerWinner, uint8 status,
            uint256 participantCount, uint256 successCount
        ) = gc.pools(poolId);

        assertEq(id,               1);
        assertEq(creator,          alice);
        assertEq(goal,             "1-Hour Study Sprint");
        assertEq(stakeAmount,      STAKE);
        assertEq(totalStaked,      STAKE);
        assertEq(slashedTreasury,  0);
        assertEq(status,           0); // Active
        assertEq(participantCount, 1);
    }

    function test_createPool_revert_zeroStake() public {
        vm.prank(alice);
        vm.expectRevert(GetCommitted.ZeroStake.selector);
        gc.createPool{value: 0}("Test", ONE_HOUR);
    }

    function test_createPool_revert_zeroDuration() public {
        vm.prank(alice);
        vm.expectRevert(GetCommitted.InvalidDuration.selector);
        gc.createPool{value: STAKE}("Test", 0);
    }

    function test_createPool_revert_emptyGoal() public {
        vm.prank(alice);
        vm.expectRevert(GetCommitted.EmptyGoal.selector);
        gc.createPool{value: STAKE}("", ONE_HOUR);
    }

    // ─────────────────────────────────────────────────────────
    //  JOIN POOL
    // ─────────────────────────────────────────────────────────

    function test_joinPool() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        vm.prank(bob);
        gc.joinPool{value: STAKE}(poolId);

        (, , , , , uint256 totalStaked, , , , uint256 participantCount, ) = gc.pools(poolId);
        assertEq(totalStaked,      2 * STAKE);
        assertEq(participantCount, 2);
    }

    function test_joinPool_revert_afterDeadline() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        // Warp past deadline
        vm.warp(block.timestamp + ONE_HOUR + 1);

        vm.prank(bob);
        vm.expectRevert(GetCommitted.DeadlinePassed.selector);
        gc.joinPool{value: STAKE}(poolId);
    }

    function test_joinPool_revert_wrongStake() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        vm.prank(bob);
        vm.expectRevert(GetCommitted.WrongStakeAmount.selector);
        gc.joinPool{value: STAKE / 2}(poolId);
    }

    function test_joinPool_revert_alreadyJoined() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        vm.prank(alice);
        vm.expectRevert(GetCommitted.AlreadyJoined.selector);
        gc.joinPool{value: STAKE}(poolId);
    }

    // ─────────────────────────────────────────────────────────
    //  STAKE ACCOUNTING
    // ─────────────────────────────────────────────────────────

    function test_stakeAccounting_fiveParticipants() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Team Sprint", ONE_HOUR);

        vm.prank(bob);   gc.joinPool{value: STAKE}(poolId);
        vm.prank(carol); gc.joinPool{value: STAKE}(poolId);
        vm.prank(dave);  gc.joinPool{value: STAKE}(poolId);

        (, , , , , uint256 totalStaked, , , , uint256 participantCount, ) = gc.pools(poolId);
        assertEq(totalStaked,      4 * STAKE, "Total staked = 4 MON");
        assertEq(participantCount, 4,         "4 participants");
        assertEq(address(gc).balance, 4 * STAKE, "Contract holds all stakes");
    }

    // ─────────────────────────────────────────────────────────
    //  SLASHING
    // ─────────────────────────────────────────────────────────

    function test_reportFailure_selfReport() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);
        vm.prank(bob); gc.joinPool{value: STAKE}(poolId);

        vm.prank(alice);
        gc.reportFailure(poolId, alice);

        (, , , , , uint256 totalStaked, uint256 slashedTreasury, , , , ) = gc.pools(poolId);
        assertEq(slashedTreasury, STAKE,     "Alice's stake slashed");
        assertEq(totalStaked,     STAKE,     "Bob's stake remains");
    }

    function test_reportFailure_ownerCanSlash() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        // Owner calls reportFailure for alice
        gc.reportFailure(poolId, alice);

        (, , , , , , uint256 slashedTreasury, , , , ) = gc.pools(poolId);
        assertEq(slashedTreasury, STAKE);
    }

    function test_reportFailure_revert_thirdParty() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);
        vm.prank(bob); gc.joinPool{value: STAKE}(poolId);

        // Bob tries to slash alice — should revert
        vm.prank(bob);
        vm.expectRevert(GetCommitted.NotAuthorized.selector);
        gc.reportFailure(poolId, alice);
    }

    function test_reportFailure_revert_afterDeadline() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        vm.warp(block.timestamp + ONE_HOUR + 1);

        vm.prank(alice);
        vm.expectRevert(GetCommitted.DeadlinePassed.selector);
        gc.reportFailure(poolId, alice);
    }

    function test_reportFailure_revert_alreadyFailed() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        vm.prank(alice); gc.reportFailure(poolId, alice);

        vm.prank(alice);
        vm.expectRevert(GetCommitted.AlreadyFailed.selector);
        gc.reportFailure(poolId, alice);
    }

    // ─────────────────────────────────────────────────────────
    //  SETTLEMENT — UNIFORM EQUAL SPLIT
    // ─────────────────────────────────────────────────────────

    /// @dev 4 participants, 1 failure: 3 winners each get stake + slashedTreasury/3
    function test_settle_uniformSplit() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Team Sprint", ONE_HOUR);
        vm.prank(bob);   gc.joinPool{value: STAKE}(poolId);
        vm.prank(carol); gc.joinPool{value: STAKE}(poolId);
        vm.prank(dave);  gc.joinPool{value: STAKE}(poolId);

        // Dave fails
        vm.prank(dave);
        gc.reportFailure(poolId, dave);

        // Warp to deadline and settle
        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        (, , , , , , uint256 slashedTreasury, uint256 sharePerWinner, uint8 status, , uint256 successCount) = gc.pools(poolId);

        assertEq(status,          1,          "Pool settled");
        assertEq(successCount,    3,          "3 winners");
        assertEq(slashedTreasury, STAKE,      "1 MON slashed");
        assertEq(sharePerWinner,  STAKE / 3,  "Equal share per winner");
    }

    function test_settle_allFail_cancelled() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Solo Sprint", ONE_HOUR);

        vm.prank(alice);
        gc.reportFailure(poolId, alice);

        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        (, , , , , , , , uint8 status, , uint256 successCount) = gc.pools(poolId);
        assertEq(status,       2, "Cancelled when all fail");
        assertEq(successCount, 0);
    }

    function test_settle_revert_deadlineNotReached() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Solo Sprint", ONE_HOUR);

        vm.prank(bob);
        vm.expectRevert(GetCommitted.DeadlineNotReached.selector);
        gc.settlePool(poolId);
    }

    // ─────────────────────────────────────────────────────────
    //  CLAIM PAYOUT
    // ─────────────────────────────────────────────────────────

    function test_claimPayout_winnersReceiveCorrectAmount() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Team Sprint", ONE_HOUR);
        vm.prank(bob);   gc.joinPool{value: STAKE}(poolId);
        vm.prank(carol); gc.joinPool{value: STAKE}(poolId);

        // Bob fails
        vm.prank(bob);
        gc.reportFailure(poolId, bob);

        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        // 2 winners: alice + carol. Slashed = 1 STAKE, share = 0.5 STAKE each
        uint256 aliceBefore = alice.balance;
        uint256 carolBefore = carol.balance;

        vm.prank(alice); gc.claimPayout(poolId);
        vm.prank(carol); gc.claimPayout(poolId);

        assertEq(alice.balance - aliceBefore, STAKE + STAKE / 2, "Alice: stake + half bonus");
        assertEq(carol.balance - carolBefore, STAKE + STAKE / 2, "Carol: stake + half bonus");
    }

    function test_claimPayout_revert_alreadyClaimed() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Solo Sprint", ONE_HOUR);

        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        vm.prank(alice); gc.claimPayout(poolId);

        vm.prank(alice);
        vm.expectRevert(GetCommitted.AlreadyClaimed.selector);
        gc.claimPayout(poolId);
    }

    function test_claimPayout_revert_failedParticipant() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);
        vm.prank(bob); gc.joinPool{value: STAKE}(poolId);

        vm.prank(alice);
        gc.reportFailure(poolId, alice);

        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        vm.prank(alice);
        vm.expectRevert(GetCommitted.YouFailed.selector);
        gc.claimPayout(poolId);
    }

    function test_claimPayout_revert_nonParticipant() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        vm.prank(dave);
        vm.expectRevert(GetCommitted.NotParticipant.selector);
        gc.claimPayout(poolId);
    }

    // ─────────────────────────────────────────────────────────
    //  XP & STREAKS
    // ─────────────────────────────────────────────────────────

    function test_xp_basePayout50() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Solo Sprint", ONE_HOUR);
        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        (uint256 xp, , , ) = gc.getUserProfile(alice);
        assertEq(xp, 50, "Base XP = 50");
    }

    function test_xp_streakMultiplier_3days() public {
        // Use absolute timestamps: day 1, day 2, day 3 (each settled before next start)
        uint256 dayStart = 1 days; // start at a clean day boundary
        for (uint256 day = 0; day < 3; day++) {
            uint256 t0 = dayStart + (day * 1 days);
            vm.warp(t0 + 1); // within this day
            vm.prank(alice);
            uint256 poolId = gc.createPool{value: STAKE}("Daily Sprint", ONE_HOUR);
            vm.warp(t0 + ONE_HOUR + 2); // still within same day
            gc.settlePool(poolId);
        }

        (uint256 xp, uint256 streak, , ) = gc.getUserProfile(alice);
        // Day1: streak=1, 50 XP. Day2: streak=2, 50 XP. Day3: streak=3, 75 XP (1.5x) = 175 total
        assertEq(streak, 3, "Streak = 3");
        assertGt(xp, 100, "XP > 100 (streak bonus applied)");
    }

    function test_xp_streakReset_onFailure() public {
        // Complete one pool to get some XP and streak
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Solo Sprint", ONE_HOUR);
        vm.warp(block.timestamp + ONE_HOUR + 1);
        gc.settlePool(poolId);

        (uint256 xpBefore, uint256 streakBefore, , ) = gc.getUserProfile(alice);
        assertEq(streakBefore, 1);

        // Now alice fails a pool → streak reset + XP dock
        vm.warp(1 days * 2 + 1); // next day
        vm.prank(alice);
        uint256 pool2 = gc.createPool{value: STAKE}("Sprint 2", ONE_HOUR);
        vm.prank(alice);
        gc.reportFailure(pool2, alice);

        (, uint256 streakAfter, , ) = gc.getUserProfile(alice);
        assertEq(streakAfter, 0, "Streak reset on failure");
    }

    function test_level_progression() public {
        // Manually grant XP by winning enough pools
        // Level 2 requires 201 XP (win 5 pools = 250 XP)
        for (uint256 i = 0; i < 5; i++) {
            vm.warp(block.timestamp + 1 days * i + 1);
            vm.prank(alice);
            uint256 poolId = gc.createPool{value: STAKE}("Sprint", ONE_HOUR);
            vm.warp(block.timestamp + ONE_HOUR + 1);
            gc.settlePool(poolId);
        }

        (uint256 xp, , uint256 level, ) = gc.getUserProfile(alice);
        assertGe(xp, 201, "XP >= 201");
        assertEq(level, 2, "Level 2: Focused Builder");
    }

    // ─────────────────────────────────────────────────────────
    //  PERK MARKETPLACE
    // ─────────────────────────────────────────────────────────

    function _grantXP(address user, uint256 targetXP) internal {
        // Win enough pools to reach targetXP
        uint256 poolsNeeded = (targetXP / 50) + 1;
        for (uint256 i = 0; i < poolsNeeded; i++) {
            vm.warp(block.timestamp + 1 days * i + 100);
            vm.prank(user);
            uint256 pid = gc.createPool{value: STAKE}("Grind", ONE_HOUR);
            vm.warp(block.timestamp + ONE_HOUR + 1);
            gc.settlePool(pid);
        }
    }

    function test_redeemStreakShield() public {
        _grantXP(alice, 150);
        (uint256 xpBefore, , , ) = gc.getUserProfile(alice);

        vm.prank(alice);
        gc.redeemStreakShield();

        (uint256 xpAfter, , , bool hasShield) = gc.getUserProfile(alice);
        assertTrue(hasShield, "Shield active");
        assertEq(xpBefore - xpAfter, 150, "150 XP deducted");
    }

    function test_redeemStreakShield_revert_insufficientXP() public {
        vm.prank(alice);
        vm.expectRevert(GetCommitted.InsufficientXP.selector);
        gc.redeemStreakShield();
    }

    function test_redeemStreakShield_protectsStreak() public {
        // Give alice a shield and a streak, then fail
        _grantXP(alice, 200);
        vm.prank(alice); gc.redeemStreakShield();

        (,uint256 streakBefore,,) = gc.getUserProfile(alice);

        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Protected Sprint", ONE_HOUR);

        vm.prank(alice);
        gc.reportFailure(poolId, alice);

        (,uint256 streakAfter,,bool hasShield) = gc.getUserProfile(alice);
        assertFalse(hasShield, "Shield consumed");
        assertEq(streakAfter, streakBefore, "Streak protected");
    }

    function test_redeemYieldBooster() public {
        _grantXP(alice, 600); // enough for two redeem attempts (300 each)
        vm.prank(alice);
        gc.redeemYieldBooster();

        // Second call should revert with AlreadyHasPerk (not InsufficientXP)
        vm.prank(alice);
        vm.expectRevert(GetCommitted.AlreadyHasPerk.selector);
        gc.redeemYieldBooster();
    }

    function test_mintReputationBadge() public {
        _grantXP(alice, 500);

        vm.prank(alice);
        gc.mintReputationBadge();

        // Badge type = level at time of mint. With 500 XP from _grantXP, level >= 1.
        // Check any badge balance > 0 for badge types 1-4
        uint256 totalBadges = badge.balanceOf(alice, 1) + badge.balanceOf(alice, 2)
            + badge.balanceOf(alice, 3) + badge.balanceOf(alice, 4);
        assertGe(totalBadges, 1, "At least one badge minted");
    }

    // ─────────────────────────────────────────────────────────
    //  SOULBOUND
    // ─────────────────────────────────────────────────────────

    function test_badge_soulbound_transferReverts() public {
        _grantXP(alice, 500);
        vm.prank(alice);
        gc.mintReputationBadge();

        (,,uint256 level,) = _getUserProfileRaw(alice);
        uint256 badgeType = level;

        vm.prank(alice);
        vm.expectRevert(ReputationBadge.SoulboundNonTransferable.selector);
        badge.safeTransferFrom(alice, bob, badgeType, 1, "");
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────────────────────

    function test_pause_blocksJoin() public {
        vm.prank(alice);
        uint256 poolId = gc.createPool{value: STAKE}("Study Sprint", ONE_HOUR);

        gc.pause();

        vm.prank(bob);
        vm.expectRevert();
        gc.joinPool{value: STAKE}(poolId);

        gc.unpause();

        vm.prank(bob);
        gc.joinPool{value: STAKE}(poolId); // should succeed after unpause
    }

    // ─────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────

    struct UserProfile_view {
        uint256 xp;
        uint256 streak;
        uint8 level;
        bool hasShield;
        bool hasYieldBooster;
    }

    function _getProfile(address user) internal view returns (UserProfile_view memory p) {
        (uint256 xp, uint256 streak, uint256 level, bool hasShield) = gc.getUserProfile(user);
        p.xp = xp; p.streak = streak; p.level = uint8(level); p.hasShield = hasShield;
    }

    function _getUserProfileRaw(address user) internal view returns (uint256 xp, uint256 streak, uint256 level, bool hasShield) {
        (xp, streak, level, hasShield) = gc.getUserProfile(user);
    }
}
