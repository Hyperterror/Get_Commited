'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Clock, Users, ArrowRight, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS, GET_COMMITTED_ABI } from '@/lib/contracts'
import { GAS_LIMITS } from '@/lib/gas'

const DURATION_PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '1 hr',   seconds: 60 * 60 },
  { label: '2 hr',   seconds: 2 * 60 * 60 },
  { label: '4 hr',   seconds: 4 * 60 * 60 },
  { label: '1 day',  seconds: 24 * 60 * 60 },
  { label: '7 day',  seconds: 7 * 24 * 60 * 60 },
]

const STAKE_PRESETS = ['0.1', '0.5', '1.0', '2.0', '5.0']

// ─── Selector Chip ─────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500,
        cursor: 'pointer', transition: 'all 0.15s',
        background: active ? 'var(--sage)' : 'var(--surface2)',
        border: `1px solid ${active ? 'var(--sage-dark)' : 'var(--border)'}`,
        color: active ? '#fff' : 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  )
}

// ─── Create Pool Modal ─────────────────────────────────
function CreatePoolModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [goal, setGoal]           = useState('')
  const [durationSec, setDuration] = useState(60 * 60)
  const [stakeEth, setStake]      = useState('1.0')
  const [step, setStep]           = useState<'form' | 'confirm' | 'pending' | 'done'>('form')
  const [txHash, setTxHash]       = useState<`0x${string}` | undefined>()

  const { writeContractAsync } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash })

  async function handleConfirm() {
    if (!goal.trim()) { toast.error('Enter a goal'); return }
    try {
      setStep('pending')
      const hash = await writeContractAsync({
        address: CONTRACTS.GET_COMMITTED,
        abi: GET_COMMITTED_ABI,
        functionName: 'createPool',
        args: [goal, BigInt(durationSec)],
        value: parseEther(stakeEth),
        gas: GAS_LIMITS.CREATE_POOL,
      })
      setTxHash(hash)
      setStep('done')
      toast.success('Pool created! Participants can now join.')
      onCreated()
    } catch (err: any) {
      toast.error(err?.shortMessage ?? 'Transaction failed')
      setStep('form')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="card"
        style={{ position: 'relative', width: '100%', maxWidth: 460, zIndex: 10, padding: 28 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Create Accountability Pool</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {(step === 'form' || step === 'confirm') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Goal input */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Your Goal</label>
              <input
                id="pool-goal-input"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. 1-Hour Deep Study Sprint"
                className="input"
                disabled={step === 'confirm'}
              />
            </div>

            {/* Duration */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Duration</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DURATION_PRESETS.map(({ label, seconds }) => (
                  <Chip key={label} active={durationSec === seconds} onClick={() => setDuration(seconds)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Stake */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Stake Amount (MON)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {STAKE_PRESETS.map(s => (
                  <Chip key={s} active={stakeEth === s} onClick={() => setStake(s)}>{s} MON</Chip>
                ))}
              </div>
              <input
                id="stake-amount-input"
                type="number"
                value={stakeEth}
                onChange={e => setStake(e.target.value)}
                min="0.001"
                step="0.1"
                className="input"
                disabled={step === 'confirm'}
              />
            </div>

            {/* Summary (confirm step) */}
            {step === 'confirm' && (
              <div style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                {[
                  ['Goal', goal],
                  ['Duration', DURATION_PRESETS.find(d => d.seconds === durationSec)?.label],
                  ['Your Stake', `${stakeEth} MON`],
                  ['Gas limit', '135,000 units'],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warning */}
            <div style={{
              display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 9,
              background: 'var(--amber-bg)', border: '1px solid #FDE68A',
              fontSize: '0.8rem', color: 'var(--amber)',
            }}>
              <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
              Testnet MON only. Stake locked until pool deadline.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => step === 'confirm' ? setStep('form') : onClose()}
              >
                {step === 'confirm' ? 'Back' : 'Cancel'}
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => step === 'form' ? (goal.trim() ? setStep('confirm') : toast.error('Enter a goal')) : handleConfirm()}
              >
                {step === 'form' ? 'Review →' : 'Confirm & Deploy'}
              </button>
            </div>
          </div>
        )}

        {step === 'pending' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '2px solid var(--sage)', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Deploying to Monad testnet…</p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', fontSize: '1.6rem',
              background: 'var(--green-bg)', border: '1px solid #BBE0BB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>✅</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Pool Created!</p>
            <button className="btn-primary" onClick={onClose}>View Pools</button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Pool Card ─────────────────────────────────────────
function PoolCard({ poolId }: { poolId: bigint }) {
  const { data: pool } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'pools',
    args: [poolId],
  })

  // Live countdown timer
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!pool) return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ height: 14, background: 'var(--surface3)', borderRadius: 6, width: '70%', marginBottom: 10 }} />
      <div style={{ height: 12, background: 'var(--surface3)', borderRadius: 6, width: '45%' }} />
    </div>
  )

  const [, , goal, stakeAmount, deadline, , slashedTreasury, , status, participantCount] = pool
  const remaining = Math.max(0, Number(deadline) - now)
  const isActive  = status === 0 && remaining > 0

  const formatRemaining = (secs: number) => {
    if (secs <= 0) return 'Ended'
    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (d > 0)  return `${d}d ${h}h left`
    if (h > 0)  return `${h}h ${m}m left`
    if (m > 0)  return `${m}m ${s}s left`
    return `${s}s left`
  }

  return (
    <motion.div
      className="card card-hover"
      style={{ padding: 20, opacity: isActive ? 1 : 0.65, display: 'flex', flexDirection: 'column', gap: 16 }}
      whileHover={{ y: -2 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>{goal}</h3>
        <span className={`chip ${isActive ? 'badge-active' : status === 1 ? 'badge-settled' : 'badge-failed'}`} style={{ flexShrink: 0 }}>
          {isActive ? 'Active' : status === 1 ? 'Settled' : 'Ended'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
        {[
          { value: `${formatEther(stakeAmount)} MON`, label: 'per player', color: 'var(--sage-dark)' },
          { value: participantCount.toString(),        label: 'players',    color: 'var(--text-primary)' },
          { value: `${formatEther(slashedTreasury)} MON`, label: 'slashed', color: Number(slashedTreasury) > 0 ? 'var(--red)' : 'var(--text-muted)' },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 6px' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem',
          color: isActive && remaining < 300 ? 'var(--red)' : 'var(--text-muted)',
          fontWeight: isActive && remaining < 300 ? 600 : 400,
        }}>
          <Clock style={{ width: 13, height: 13 }} />
          {formatRemaining(remaining)}
        </div>
        <Link
          href={`/pools/${poolId}`}
          id={`pool-card-${poolId}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.8rem', color: 'var(--sage-dark)', fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Details <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────
export default function PoolsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { isConnected } = useAccount()

  const { data: poolCount, refetch } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'poolCount',
  })

  const count  = Number(poolCount ?? 0)
  const poolIds = Array.from({ length: count }, (_, i) => BigInt(count - i))

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Accountability Pools</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{count} pool{count !== 1 ? 's' : ''} on Monad testnet</p>
        </div>
        {isConnected && (
          <button id="open-create-pool" onClick={() => setCreateOpen(true)} className="btn-primary" style={{ gap: 8 }}>
            <Plus style={{ width: 15, height: 15 }} />
            Create Pool
          </button>
        )}
      </div>

      {/* Grid */}
      {count === 0 ? (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🏊</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No pools yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
            Be the first to create an accountability pool on Monad testnet.
          </p>
          {isConnected
            ? <button onClick={() => setCreateOpen(true)} className="btn-primary">Create First Pool</button>
            : <p style={{ color: 'var(--sage)', fontSize: '0.875rem' }}>Connect your wallet to create a pool</p>
          }
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {poolIds.map(id => <PoolCard key={id.toString()} poolId={id} />)}
        </div>
      )}

      <AnimatePresence>
        {createOpen && (
          <CreatePoolModal
            onClose={() => setCreateOpen(false)}
            onCreated={() => { refetch(); setCreateOpen(false) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
