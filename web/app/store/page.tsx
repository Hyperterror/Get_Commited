'use client'

import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { Shield, Zap, Star, Award, CheckCircle, Lock } from 'lucide-react'
import { CONTRACTS, GET_COMMITTED_ABI } from '@/lib/contracts'
import { GAS_LIMITS } from '@/lib/gas'
import { useState } from 'react'

const PERKS = [
  {
    id: 'shield',
    name: 'Streak Shield',
    desc: 'Protects your streak from resetting on your next failure. Stake is still forfeited, but your streak survives.',
    cost: 150,
    icon: Shield,
    accent: 'var(--blue)',
    fn: 'redeemStreakShield' as const,
    gas: GAS_LIMITS.REDEEM_STREAK_SHIELD,
  },
  {
    id: 'booster',
    name: 'Yield Booster',
    desc: '1.2× multiplier on your slashed-fund bonus share in the next pool. Applied to the bonus, not your returned stake.',
    cost: 300,
    icon: Zap,
    accent: 'var(--sage)',
    fn: 'redeemYieldBooster' as const,
    gas: GAS_LIMITS.REDEEM_YIELD_BOOSTER,
  },
  {
    id: 'badge',
    name: 'Reputation Badge',
    desc: 'Mint a soulbound ERC1155 badge to your wallet. Non-transferable proof of discipline — show it on your resume.',
    cost: 500,
    icon: Award,
    accent: 'var(--amber)',
    fn: 'mintReputationBadge' as const,
    gas: GAS_LIMITS.MINT_REPUTATION_BADGE,
  },
]

// ─── Perk Card ─────────────────────────────────────────
function PerkCard({ perk, userXP, onRedeem }: {
  perk: typeof PERKS[0]; userXP: number; onRedeem: (p: typeof PERKS[0]) => void
}) {
  const canAfford = userXP >= perk.cost
  const Icon = perk.icon

  return (
    <motion.div
      className="card"
      style={{
        padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
        opacity: canAfford ? 1 : 0.6,
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
      }}
      whileHover={canAfford ? { y: -3 } : {}}
    >
      {/* Icon */}
      <div
        className={canAfford ? 'float' : ''}
        style={{
          width: 52, height: 52, borderRadius: 14,
          background: perk.accent + '15',
          border: `1.5px solid ${perk.accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon style={{ width: 24, height: 24, color: perk.accent }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{perk.name}</h3>
          <span style={{
            fontSize: '0.8rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: canAfford ? perk.accent + '15' : 'var(--surface2)',
            color: canAfford ? perk.accent : 'var(--text-muted)',
            border: `1px solid ${canAfford ? perk.accent + '30' : 'var(--border)'}`,
          }}>
            {perk.cost} XP
          </span>
        </div>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{perk.desc}</p>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gas limit: {perk.gas.toLocaleString()}</p>

      {/* CTA */}
      <button
        id={`redeem-${perk.id}`}
        onClick={() => onRedeem(perk)}
        disabled={!canAfford}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 9,
          fontWeight: 600, fontSize: '0.875rem', cursor: canAfford ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'all 0.15s',
          ...(canAfford ? {
            background: perk.accent,
            border: `1px solid ${perk.accent}`,
            color: '#fff',
          } : {
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }),
        }}
      >
        {canAfford
          ? <><CheckCircle style={{ width: 15, height: 15 }} /> Redeem for {perk.cost} XP</>
          : <><Lock style={{ width: 15, height: 15 }} /> Need {perk.cost - userXP} more XP</>
        }
      </button>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────
export default function StorePage() {
  const { address, isConnected } = useAccount()
  const [confirming, setConfirming] = useState<string | null>(null)

  const { data: profile, refetch } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'getUserProfile',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  })

  const { writeContractAsync } = useWriteContract()
  const [xp] = profile ?? [0n]
  const xpNum = Number(xp)

  async function handleRedeem(perk: typeof PERKS[0]) {
    if (!isConnected) { toast.error('Connect your wallet'); return }
    setConfirming(perk.id)
    try {
      await writeContractAsync({
        address: CONTRACTS.GET_COMMITTED,
        abi: GET_COMMITTED_ABI,
        functionName: perk.fn,
        gas: perk.gas,
      })
      toast.success(`${perk.name} redeemed! −${perk.cost} XP`)
      if (perk.id === 'badge') {
        confetti({ particleCount: 120, spread: 65, origin: { y: 0.6 }, colors: ['#5A7A5A', '#3D6B3D', '#B45309'] })
      }
      refetch()
    } catch (err: any) {
      toast.error(err?.shortMessage ?? 'Transaction failed')
    } finally {
      setConfirming(null)
    }
  }

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Connect to Shop</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connect your wallet to redeem perks with XP.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Perk Store</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Burn XP for on-chain powers</p>
        </div>
        <div className="card" style={{ padding: '12px 20px', textAlign: 'right' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Your Balance</p>
          <p style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--sage-dark)' }}>{xpNum.toLocaleString()} XP</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PERKS.map(p => (
          <PerkCard key={p.id} perk={p} userXP={xpNum} onRedeem={handleRedeem} />
        ))}
      </div>

      {/* XP guide */}
      <div className="card" style={{ padding: 24, marginTop: 28 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>How to Earn XP</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Complete any pool',  xp: '+50 XP base' },
            { label: '3-day streak',       xp: '1.5× multiplier = +75 XP' },
            { label: '7-day streak',       xp: '2.0× multiplier = +100 XP' },
          ].map(({ label, xp }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)',
            }}>
              <Star style={{ width: 16, height: 16, color: 'var(--amber)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{xp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
