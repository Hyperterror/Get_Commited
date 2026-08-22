'use client'

import { useParams } from 'next/navigation'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { formatEther } from 'viem'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { Clock, Users, CheckCircle, XCircle, Trophy, Zap, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS, GET_COMMITTED_ABI } from '@/lib/contracts'
import { GAS_LIMITS } from '@/lib/gas'
import { useState } from 'react'

export default function PoolDetailPage() {
  const params = useParams()
  const poolId = BigInt(params.id as string)
  const { address, isConnected } = useAccount()
  const [txPending, setTxPending] = useState(false)

  const { data: pool, refetch: refetchPool } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'pools',
    args: [poolId],
    query: { refetchInterval: 5000 },
  })

  const { data: participants } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'getPoolParticipants',
    args: [poolId],
  })

  const { data: myState } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'participantStates',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 5000 },
  })

  const { writeContractAsync } = useWriteContract()

  if (!pool) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '2px solid var(--sage)', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: 'var(--text-muted)' }}>Loading pool…</p>
      </div>
    )
  }

  const [id, creator, goal, stakeAmount, deadline, , slashedTreasury, sharePerWinner, status, participantCount] = pool
  const [joined, failed, claimed] = myState ?? [false, false, false]

  const now       = Math.floor(Date.now() / 1000)
  const remaining = Number(deadline) - now
  const isActive  = status === 0 && remaining > 0
  const isSettled = status === 1

  const formatTime = (secs: number) => {
    if (secs <= 0) return 'Ended'
    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (d > 0) return `${d}d ${h}h left`
    if (h > 0) return `${h}h ${m}m left`
    return `${m}m left`
  }

  async function handleJoin() {
    setTxPending(true)
    try {
      await writeContractAsync({
        address: CONTRACTS.GET_COMMITTED,
        abi: GET_COMMITTED_ABI,
        functionName: 'joinPool',
        args: [poolId],
        value: stakeAmount,
        gas: GAS_LIMITS.JOIN_POOL,
      })
      toast.success('Joined! Head to Sprint to start your session.')
      refetchPool()
    } catch (err: any) {
      toast.error(err?.shortMessage ?? 'Join failed')
    } finally { setTxPending(false) }
  }

  async function handleSettle() {
    setTxPending(true)
    try {
      await writeContractAsync({
        address: CONTRACTS.GET_COMMITTED,
        abi: GET_COMMITTED_ABI,
        functionName: 'settlePool',
        args: [poolId],
        gas: GAS_LIMITS.SETTLE_POOL,
      })
      toast.success('Pool settled! Winners can now claim payouts.')
      refetchPool()
    } catch (err: any) {
      toast.error(err?.shortMessage ?? 'Settle failed')
    } finally { setTxPending(false) }
  }

  async function handleClaim() {
    setTxPending(true)
    try {
      await writeContractAsync({
        address: CONTRACTS.GET_COMMITTED,
        abi: GET_COMMITTED_ABI,
        functionName: 'claimPayout',
        args: [poolId],
        gas: GAS_LIMITS.CLAIM_PAYOUT,
      })
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 }, colors: ['#5A7A5A', '#3D6B3D', '#B45309'] })
      toast.success('Payout claimed! MON sent to your wallet.')
      refetchPool()
    } catch (err: any) {
      toast.error(err?.shortMessage ?? 'Claim failed')
    } finally { setTxPending(false) }
  }

  const Spinner = () => (
    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* ── Header card ──────────────────────────────────── */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>Pool #{id.toString()}</p>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{goal}</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              by {creator.slice(0, 8)}…{creator.slice(-4)}
            </p>
          </div>
          <span className={`chip ${isActive ? 'badge-active' : isSettled ? 'badge-settled' : 'badge-failed'}`}>
            {isActive ? 'Active' : isSettled ? 'Settled' : 'Ended'}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: `${formatEther(stakeAmount)} MON`, label: 'stake each',    color: 'var(--sage-dark)' },
            { value: participantCount.toString(),         label: 'participants', color: 'var(--text-primary)' },
            { value: `${formatEther(slashedTreasury)} MON`, label: 'slashed pot', color: Number(slashedTreasury) > 0 ? 'var(--red)' : 'var(--text-muted)' },
            { value: formatTime(remaining),               label: 'remaining',    color: remaining > 0 ? 'var(--sage-dark)' : 'var(--text-muted)' },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 10, padding: '10px 8px' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Winner estimate ──────────────────────────────── */}
      {isActive && Number(participantCount) > 0 && (
        <div style={{
          background: 'var(--green-bg)', border: '1px solid #BBE0BB',
          borderRadius: 12, padding: '12px 18px',
          fontSize: '0.875rem', color: 'var(--green)',
        }}>
          If you finish: <strong>{formatEther(stakeAmount)} MON back</strong>
          {Number(slashedTreasury) > 0 && (
            <> + <strong>~{(Number(formatEther(slashedTreasury)) / Math.max(1, Number(participantCount) - 1)).toFixed(4)} MON bonus</strong> <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>(est. per winner)</span></>
          )}
        </div>
      )}

      {/* ── My status ────────────────────────────────────── */}
      {isConnected && joined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 12,
          background: failed ? 'var(--red-bg)' : 'var(--green-bg)',
          border: `1px solid ${failed ? '#F3C5C0' : '#BBE0BB'}`,
          fontSize: '0.875rem', fontWeight: 600,
          color: failed ? 'var(--red)' : 'var(--green)',
        }}>
          {failed
            ? <><XCircle style={{ width: 17, height: 17 }} /> You were slashed from this pool</>
            : <><CheckCircle style={{ width: 17, height: 17 }} /> You're participating — stay focused!</>
          }
        </div>
      )}

      {/* ── Actions card ─────────────────────────────────── */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Actions</h2>

        {/* Join */}
        {isConnected && isActive && !joined && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
              Send exactly <strong style={{ color: 'var(--text-primary)' }}>{formatEther(stakeAmount)} MON</strong> to join this pool
            </p>
            <button id="join-pool-btn" onClick={handleJoin} disabled={txPending} className="btn-primary" style={{ width: '100%', gap: 8 }}>
              {txPending ? <Spinner /> : <Zap style={{ width: 15, height: 15 }} />}
              Join Pool ({formatEther(stakeAmount)} MON)
            </button>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>Gas limit: 90,000 units</p>
          </div>
        )}

        {/* Go to Sprint */}
        {joined && !failed && isActive && (
          <Link
            href={`/sprint?poolId=${poolId}`}
            id="go-sprint-btn"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px 0', borderRadius: 8, marginBottom: 10,
              background: 'var(--sage)', color: '#fff',
              fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
            }}
          >
            <Zap style={{ width: 15, height: 15 }} />
            Go to Sprint Mode
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        )}

        {/* Settle */}
        {remaining <= 0 && status === 0 && (
          <button id="settle-pool-btn" onClick={handleSettle} disabled={txPending} className="btn-secondary" style={{ width: '100%', marginBottom: 10, gap: 8 }}>
            <Trophy style={{ width: 15, height: 15 }} />
            Settle Pool (distribute rewards)
          </button>
        )}

        {/* Claim */}
        {isSettled && joined && !failed && !claimed && (
          <button id="claim-payout-btn" onClick={handleClaim} disabled={txPending} className="btn-primary" style={{ width: '100%', gap: 8, background: 'var(--green)', borderColor: 'var(--green-bg)' }}>
            {txPending ? <Spinner /> : <Trophy style={{ width: 15, height: 15 }} />}
            Claim Payout ({formatEther(stakeAmount + sharePerWinner)} MON)
          </button>
        )}

        {claimed && (
          <p style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 700, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <CheckCircle style={{ width: 16, height: 16 }} /> Payout claimed!
          </p>
        )}

        {!isConnected && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '10px 0', fontSize: '0.875rem' }}>
            Connect wallet to participate
          </p>
        )}
      </div>

      {/* ── Participants ─────────────────────────────────── */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Users style={{ width: 16, height: 16 }} />
          Participants ({participantCount.toString()})
        </h2>
        <div>
          {(participants ?? []).map((addr, i) => (
            <div key={addr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'var(--sage-faint)', border: '1px solid var(--sage-ring)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--sage-dark)',
                }}>
                  {i + 1}
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {addr.slice(0, 10)}…{addr.slice(-6)}
                  {addr === address && (
                    <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--sage)', fontWeight: 700 }}>(you)</span>
                  )}
                </span>
              </div>
              <a
                href={`https://testnet.monadscan.com/address/${addr}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                <ExternalLink style={{ width: 13, height: 13 }} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
