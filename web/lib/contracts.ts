// Contract addresses — fill in AFTER Remix deploy
// Deploy order: ReputationBadge first → GetCommitted(badgeAddress)

export const CONTRACTS = {
  GET_COMMITTED:    (process.env.NEXT_PUBLIC_GET_COMMITTED_ADDRESS    ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  REPUTATION_BADGE: (process.env.NEXT_PUBLIC_REPUTATION_BADGE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

export const CHAIN_ID = 10143; // Monad Testnet

// ─────────────────────────────────────────────────────────
//  GetCommitted ABI
// ─────────────────────────────────────────────────────────
export const GET_COMMITTED_ABI = [
  // Pool Management
  {
    "type": "function", "name": "createPool",
    "inputs": [{"name": "goal","type": "string"},{"name": "duration","type": "uint256"}],
    "outputs": [{"name": "poolId","type": "uint256"}],
    "stateMutability": "payable"
  },
  {
    "type": "function", "name": "joinPool",
    "inputs": [{"name": "poolId","type": "uint256"}],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function", "name": "reportFailure",
    "inputs": [{"name": "poolId","type": "uint256"},{"name": "user","type": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "settlePool",
    "inputs": [{"name": "poolId","type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "claimPayout",
    "inputs": [{"name": "poolId","type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  // Views
  {
    "type": "function", "name": "getUserProfile",
    "inputs": [{"name": "user","type": "address"}],
    "outputs": [
      {"name": "xp","type": "uint256"},
      {"name": "streak","type": "uint256"},
      {"name": "level","type": "uint256"},
      {"name": "hasShield","type": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "pools",
    "inputs": [{"name": "","type": "uint256"}],
    "outputs": [
      {"name": "id","type": "uint256"},
      {"name": "creator","type": "address"},
      {"name": "goal","type": "string"},
      {"name": "stakeAmount","type": "uint256"},
      {"name": "deadline","type": "uint256"},
      {"name": "totalStaked","type": "uint256"},
      {"name": "slashedTreasury","type": "uint256"},
      {"name": "sharePerWinner","type": "uint256"},
      {"name": "status","type": "uint8"},
      {"name": "participantCount","type": "uint256"},
      {"name": "successCount","type": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "poolCount",
    "inputs": [],
    "outputs": [{"name": "","type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "getPoolParticipants",
    "inputs": [{"name": "poolId","type": "uint256"}],
    "outputs": [{"name": "","type": "address[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "participantStates",
    "inputs": [{"name": "poolId","type": "uint256"},{"name": "user","type": "address"}],
    "outputs": [
      {"name": "joined","type": "bool"},
      {"name": "failed","type": "bool"},
      {"name": "claimed","type": "bool"},
      {"name": "hadYieldBoosterAtJoin","type": "bool"}
    ],
    "stateMutability": "view"
  },
  // Perk Marketplace
  {
    "type": "function", "name": "redeemStreakShield",
    "inputs": [], "outputs": [], "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "redeemYieldBooster",
    "inputs": [], "outputs": [], "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "mintReputationBadge",
    "inputs": [], "outputs": [], "stateMutability": "nonpayable"
  },
  // Events
  {
    "type": "event", "name": "PoolCreated",
    "inputs": [
      {"name": "poolId","type": "uint256","indexed": true},
      {"name": "creator","type": "address","indexed": true},
      {"name": "goal","type": "string","indexed": false},
      {"name": "stakeAmount","type": "uint256","indexed": false},
      {"name": "deadline","type": "uint256","indexed": false}
    ]
  },
  {
    "type": "event", "name": "PoolJoined",
    "inputs": [
      {"name": "poolId","type": "uint256","indexed": true},
      {"name": "participant","type": "address","indexed": true},
      {"name": "totalStaked","type": "uint256","indexed": false}
    ]
  },
  {
    "type": "event", "name": "ParticipantFailed",
    "inputs": [
      {"name": "poolId","type": "uint256","indexed": true},
      {"name": "participant","type": "address","indexed": true},
      {"name": "slashedAmount","type": "uint256","indexed": false}
    ]
  },
  {
    "type": "event", "name": "PoolSettled",
    "inputs": [
      {"name": "poolId","type": "uint256","indexed": true},
      {"name": "totalSlashed","type": "uint256","indexed": false},
      {"name": "successCount","type": "uint256","indexed": false},
      {"name": "sharePerWinner","type": "uint256","indexed": false}
    ]
  },
  {
    "type": "event", "name": "PayoutClaimed",
    "inputs": [
      {"name": "poolId","type": "uint256","indexed": true},
      {"name": "participant","type": "address","indexed": true},
      {"name": "amount","type": "uint256","indexed": false}
    ]
  },
  {
    "type": "event", "name": "XPAwarded",
    "inputs": [
      {"name": "user","type": "address","indexed": true},
      {"name": "xpAwarded","type": "uint256","indexed": false},
      {"name": "newTotal","type": "uint256","indexed": false},
      {"name": "level","type": "uint8","indexed": false}
    ]
  },
  {
    "type": "event", "name": "PerkRedeemed",
    "inputs": [
      {"name": "user","type": "address","indexed": true},
      {"name": "perkType","type": "string","indexed": false}
    ]
  },
  {
    "type": "event", "name": "BadgeMinted",
    "inputs": [
      {"name": "user","type": "address","indexed": true},
      {"name": "badgeType","type": "uint256","indexed": false}
    ]
  },
  // Errors
  { "type": "error", "name": "PoolNotActive", "inputs": [] },
  { "type": "error", "name": "DeadlinePassed", "inputs": [] },
  { "type": "error", "name": "DeadlineNotReached", "inputs": [] },
  { "type": "error", "name": "WrongStakeAmount", "inputs": [] },
  { "type": "error", "name": "AlreadyJoined", "inputs": [] },
  { "type": "error", "name": "NotParticipant", "inputs": [] },
  { "type": "error", "name": "AlreadyFailed", "inputs": [] },
  { "type": "error", "name": "AlreadyClaimed", "inputs": [] },
  { "type": "error", "name": "NotAuthorized", "inputs": [] },
  { "type": "error", "name": "PoolNotSettled", "inputs": [] },
  { "type": "error", "name": "YouFailed", "inputs": [] },
  { "type": "error", "name": "InsufficientXP", "inputs": [] },
  { "type": "error", "name": "AlreadyHasPerk", "inputs": [] },
  { "type": "error", "name": "TransferFailed", "inputs": [] },
  { "type": "error", "name": "ZeroStake", "inputs": [] },
  { "type": "error", "name": "NothingToSettle", "inputs": [] },
  { "type": "error", "name": "InvalidDuration", "inputs": [] },
  { "type": "error", "name": "EmptyGoal", "inputs": [] },
] as const;

export const REPUTATION_BADGE_ABI = [
  {
    "type": "function", "name": "balanceOf",
    "inputs": [{"name": "account","type": "address"},{"name": "id","type": "uint256"}],
    "outputs": [{"name": "","type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "uri",
    "inputs": [{"name": "badgeType","type": "uint256"}],
    "outputs": [{"name": "","type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "event", "name": "BadgeMinted",
    "inputs": [
      {"name": "to","type": "address","indexed": true},
      {"name": "badgeType","type": "uint256","indexed": true},
      {"name": "tokenId","type": "uint256","indexed": false}
    ]
  },
] as const;

// Pool status enum
export const POOL_STATUS = {
  ACTIVE:    0,
  SETTLED:   1,
  CANCELLED: 2,
} as const;

// Level metadata
export const LEVELS = [
  { level: 1, name: "Novice Committer",  minXP: 0,    maxXP: 200,  color: "#64748b", emoji: "🌱" },
  { level: 2, name: "Focused Builder",   minXP: 201,  maxXP: 600,  color: "#7c3aed", emoji: "⚡" },
  { level: 3, name: "Deep Work Master",  minXP: 601,  maxXP: 1500, color: "#06b6d4", emoji: "🔥" },
  { level: 4, name: "Monad Monk",        minXP: 1500, maxXP: Infinity, color: "#f59e0b", emoji: "🧘" },
] as const;

export function getLevelInfo(xp: number) {
  return LEVELS.find(l => xp >= l.minXP && xp <= l.maxXP) ?? LEVELS[0];
}

export function getXPProgress(xp: number): number {
  const level = getLevelInfo(xp);
  if (level.maxXP === Infinity) return 100;
  const range = level.maxXP - level.minXP;
  const progress = xp - level.minXP;
  return Math.min(100, Math.round((progress / range) * 100));
}
