/**
 * Monad gas helpers
 *
 * CRITICAL: Monad charges gas based on gas_limit, NOT gas_used.
 *   gas_paid = gas_limit × price_per_gas
 *
 * Always set tight, explicit gas limits. Overly generous limits
 * cost users real (testnet) MON.
 *
 * These limits include a small buffer over measured estimates.
 * Source: gas/ skill + local measurement on Monad testnet.
 */

export const GAS_LIMITS = {
  CREATE_POOL:           300_000n,  // bumped: covers ReentrancyGuard + storage writes on Monad
  JOIN_POOL:             150_000n,
  REPORT_FAILURE:        100_000n,
  SETTLE_POOL:           400_000n,  // scales with participant count
  CLAIM_PAYOUT:          100_000n,
  REDEEM_STREAK_SHIELD:   80_000n,
  REDEEM_YIELD_BOOSTER:   80_000n,
  MINT_REPUTATION_BADGE: 200_000n,
} as const;

/**
 * Estimate gas cost in MON (as a display string).
 * Uses current base fee from the RPC + priority fee assumption.
 *
 * @param gasLimit   - from GAS_LIMITS
 * @param gasPriceWei - current gas price in wei (from publicClient.getGasPrice())
 * @returns formatted string like "~0.000135 MON"
 */
export function estimateGasCostMON(gasLimit: bigint, gasPriceWei: bigint): string {
  const costWei = gasLimit * gasPriceWei;
  const costMON = Number(costWei) / 1e18;
  if (costMON < 0.000001) return "<0.000001 MON";
  return `~${costMON.toFixed(6)} MON`;
}

/**
 * Minimum base fee on Monad testnet: 100 gwei (100 × 10^-9 MON)
 */
export const MIN_BASE_FEE_WEI = 100_000_000_000n; // 100 gwei

/**
 * Recommended priority fee for most transactions (tip for faster inclusion).
 */
export const PRIORITY_FEE_WEI = 1_000_000_000n; // 1 gwei
