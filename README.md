# Get_Committed

> **The On-Chain Discipline Economy on Monad Testnet**
>
> Stake MON behind your goals. Complete them and earn from those who quit. Switch tabs? Slashed.

---

## What It Is

`Get_Committed` is a community accountability protocol on **Monad Testnet** (chain 10143). Participants stake equal amounts of MON into time-boxed pools. When the deadline hits:

- **Winners** (stayed focused) get their full stake back **+ an equal share of all slashed stakes**
- **Losers** (distracted) forfeit their stake entirely

Detection is via the browser-native **Page Visibility API** (tab switch = slash) and **Device Motion API** (phone pickup = slash). Both call `reportFailure()` on-chain — restricted to self-report only, no third-party griefing possible.

---

## Live Contracts (Monad Testnet)

| Contract | Address |
|---|---|
| GetCommitted | `0xc6CFe08278ce2F1b45fC75a29332E6a86643062F` |
| ReputationBadge | `0x9C8533366195ffA836F05E2ec0505141Cc6233A6` |

Explorer: [testnet.monadscan.com](https://testnet.monadscan.com)

---

## Monorepo Structure

```
Get_Committed/
├── contracts/               ← Foundry (Solidity 0.8.28)
│   ├── src/
│   │   ├── GetCommitted.sol      ← Core staking, XP, marketplace
│   │   └── ReputationBadge.sol   ← Soulbound ERC1155 badges
│   ├── test/
│   │   └── GetCommitted.t.sol    ← 32 tests (all passing)
│   └── foundry.toml
└── web/                     ← Next.js 16 + Tailwind + wagmi v2 + RainbowKit
    ├── app/
    │   ├── page.tsx              ← Landing
    │   ├── pools/page.tsx        ← Pool browser + create
    │   ├── pools/[id]/page.tsx   ← Pool detail + join/settle/claim
    │   ├── dashboard/page.tsx    ← XP, streak, level stats
    │   ├── sprint/page.tsx       ← Focus mode timer + anti-cheat
    │   ├── store/page.tsx        ← Perk marketplace
    │   └── profile/page.tsx      ← On-chain reputation
    ├── lib/
    │   ├── contracts.ts          ← ABIs + level helpers
    │   ├── gas.ts                ← Monad gas limits (charged on limit!)
    │   └── mobile-apis.ts        ← Page Visibility / Device Motion hooks
    └── components/
        └── ui/Navbar.tsx
```

---

## Key Monad Features Used

### 1. Gas charged on `gas_limit`, not `gas_used`
Unique to Monad. Every transaction passes a hardcoded tight gas limit (`lib/gas.ts`). On any other EVM chain you could pass an inflated limit — on Monad that directly costs the user more MON. This shaped the entire transaction layer of the frontend.

### 2. Sub-second finality (600ms)
The slash UX only works because the `reportFailure` transaction confirms before the user can react. On Ethereum (12s blocks) the product is not viable. Monad makes it feel instant and punishing.

### 3. Full EVM Compatibility
Solidity 0.8.28 contracts deploy with zero changes. wagmi, viem, RainbowKit, MetaMask — all work natively.

---

## Quick Start

### 1. Run contracts tests
```bash
cd contracts
forge test -vv
```

### 2. Frontend setup
```bash
cd web
cp .env.example .env.local
# Fill in contract addresses + WalletConnect project ID

npm install
npm run dev
```

### 3. Environment variables
```env
NEXT_PUBLIC_GET_COMMITTED_ADDRESS=0xc6CFe08278ce2F1b45fC75a29332E6a86643062F
NEXT_PUBLIC_REPUTATION_BADGE_ADDRESS=0x9C8533366195ffA836F05E2ec0505141Cc6233A6
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
```

---

## Reward Math

```
Winner payout = stake_back + (slashed_treasury ÷ success_count)
```

| 5 players, 1 MON each, 2 fail | 3 winners each get: 1 + 0.667 = **1.667 MON** |
|---|---|
| Yield Booster active | Bonus ×1.2 → returns **1 + 0.800 = 1.800 MON** |

---

## XP & Levels

| Level | Name | XP Range |
|---|---|---|
| 1 | Novice Committer | 0–200 |
| 2 | Focused Builder | 201–600 |
| 3 | Deep Work Master | 601–1500 |
| 4 | Monad Monk | 1500+ |

**Streak Multipliers:** 3-day = 1.5× · 7-day = 2.0× · Failure = streak reset −25 XP

---

## Perk Store

| Perk | Cost | Effect |
|---|---|---|
| Streak Shield | 150 XP | Protects streak on next failure (stake still lost) |
| Yield Booster | 300 XP | 1.2× multiplier on bonus share for next pool |
| Reputation Badge | 500 XP | Mints soulbound ERC1155 NFT to your wallet |

---

## Security

- `reportFailure` restricted to **self-report or owner only** — no third-party griefing
- `claimPayout` uses `ReentrancyGuard`
- `Pausable` for emergency circuit-breaker
- `emergencyCancel` refunds non-failed participants if needed
- Soulbound badges override OZ v5 `_update` — all transfers revert

---

## Monad Testnet

| | |
|---|---|
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadscan.com` |
| Faucet | `https://faucet.monad.xyz` |
| Currency | MON (testnet, no real value) |

---

## Tech Stack

- **Contracts:** Solidity 0.8.28, OpenZeppelin v5, Foundry
- **Frontend:** Next.js 16, Tailwind CSS v4, TypeScript
- **Web3:** wagmi v2, viem v2, RainbowKit
- **Chain:** Monad Testnet (chain 10143)
