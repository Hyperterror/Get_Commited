'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { Smartphone, Eye, Timer, AlertTriangle, Trophy, Zap, CheckCircle } from 'lucide-react'
import { CONTRACTS, GET_COMMITTED_ABI } from '@/lib/contracts'
import { GAS_LIMITS } from '@/lib/gas'
import { usePageVisibility, useDeviceMotion, useWakeLock, useSprintTimer } from '@/lib/mobile-apis'

let demoSlashCallback: (() => void) | null = null

export default function SprintPage() {
  const { address, isConnected } = useAccount()
  const [activePoolId, setActivePoolId]   = useState<bigint | null>(null)
  const [sprintDeadline, setSprintDl]     = useState<number>(0)
  const [selectedDuration, setSelectedDuration] = useState<number>(0) // seconds
  const [isFocusMode, setIsFocusMode]     = useState(false)
  const [isSlashed, setIsSlashed]         = useState(false)
  const [showOverlay, setShowOverlay]     = useState(false)

  const { writeContractAsync } = useWriteContract()

  // ── Slash handler ──────────────────────────────────────
  const handleSlash = useCallback(async (reason: string) => {
    if (!isConnected || !activePoolId || isSlashed) return
    setIsSlashed(true)
    setShowOverlay(true)
    toast.error(`Slashed! ${reason}`, { duration: 5000 })
    try {
      await writeContractAsync({
        address: CONTRACTS.GET_COMMITTED,
        abi: GET_COMMITTED_ABI,
        functionName: 'reportFailure',
        args: [activePoolId, address!],
        gas: GAS_LIMITS.REPORT_FAILURE,
      })
      toast.error('Stake forfeited to winners. Better luck next sprint.')
    } catch (err: any) {
      toast.error(err?.shortMessage ?? 'Failed to report — try again')
    }
  }, [isConnected, activePoolId, isSlashed, address, writeContractAsync])

  // ── Mobile APIs ────────────────────────────────────────
  const { isVisible } = usePageVisibility(
    isFocusMode && !isSlashed ? () => handleSlash('You switched tabs') : undefined
  )
  const { isPhoneDown, permissionGranted, requestPermission } = useDeviceMotion(
    isFocusMode && !isSlashed ? () => handleSlash('Phone picked up') : undefined,
    isFocusMode && !isSlashed
  )
  const { isLocked, acquire: acquireWakeLock, release: releaseWakeLock } = useWakeLock()

  // ── Timer ──────────────────────────────────────────────
  const { remaining, formattedRemaining, isExpired } = useSprintTimer(
    sprintDeadline || Math.floor(Date.now() / 1000) + 3600
  )

  const handleComplete = useCallback(async () => {
    await releaseWakeLock()
    confetti({ particleCount: 160, spread: 80, origin: { y: 0.5 }, colors: ['#5A7A5A', '#3D6B3D', '#B45309'] })
    toast.success('Sprint complete! Claim your payout from the pool page.')
    setIsFocusMode(false)
  }, [releaseWakeLock])

  useEffect(() => {
    if (isExpired && isFocusMode && !isSlashed && activePoolId) handleComplete()
  }, [isExpired, isFocusMode, isSlashed, activePoolId, handleComplete])

  useEffect(() => {
    demoSlashCallback = () => handleSlash('DEMO: Panic button triggered')
    return () => { demoSlashCallback = null }
  }, [handleSlash])

  function startSprint() {
    setIsFocusMode(true)
    setIsSlashed(false)
    setShowOverlay(false)
    acquireWakeLock()
    if (permissionGranted === null) requestPermission()
  }

  const { data: poolCount } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'poolCount',
  })

  // ── Status indicator ─────────────────────────────────
  const StatusRow = ({ icon: Icon, label, ok, okText, failText }: {
    icon: any; label: string; ok: boolean; okText: string; failText: string
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <Icon style={{ width: 15, height: 15 }} />
        {label}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: ok ? 'var(--green)' : 'var(--red)' }}>
        {ok ? okText : failText}
      </span>
    </div>
  )

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Connect to Sprint</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connect your wallet and join a pool first.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '88vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

      {/* ── Slash overlay ───────────────────────────────── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="focus-overlay slash-flash-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              style={{ fontSize: '5rem', marginBottom: 16 }}
            >⚡</motion.div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--red)', marginBottom: 8 }}>SLASHED</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 28 }}>Your stake has been forfeited.</p>
            <button className="btn-danger" style={{ padding: '12px 28px' }} onClick={() => setShowOverlay(false)}>
              View Results
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pre-sprint setup ────────────────────────────── */}
      {!isFocusMode && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Focus Sprint</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Stay on this page. Pick up your phone? Slashed.</p>
          </div>

          {/* Rules card */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Sprint Rules</p>
            {[
              { icon: Eye,        text: 'Switch tabs → instant slash',        status: 'enforced',          statusColor: 'var(--green)' },
              { icon: Smartphone, text: 'Pick up phone → instant slash',       status: permissionGranted ? 'enforced' : 'needs permission', statusColor: permissionGranted ? 'var(--green)' : 'var(--red)' },
              { icon: Timer,      text: 'Timer expires → success + payout',   status: 'automatic',         statusColor: 'var(--sage-dark)' },
            ].map(({ icon: Icon, text, status, statusColor }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 15, height: 15, color: 'var(--sage)' }} />
                </div>
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{text}</span>
                <span style={{
                  fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999,
                  background: statusColor + '15', color: statusColor, fontWeight: 600,
                  border: `1px solid ${statusColor}30`,
                }}>{status}</span>
              </div>
            ))}
          </div>

          {/* Pool & duration selectors */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>Pool ID to sprint for</label>
              <input
                id="sprint-pool-id"
                type="number"
                min="1"
                placeholder="Enter Pool ID"
                className="input"
                onChange={e => { const v = parseInt(e.target.value); if (v > 0) setActivePoolId(BigInt(v)) }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>Sprint duration</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['25m', 1500], ['1h', 3600], ['2h', 7200]] as [string, number][]).map(([label, secs]) => {
                  const active = selectedDuration === secs
                  return (
                    <button
                      key={label}
                      onClick={() => {
                        setSelectedDuration(secs)
                        setSprintDl(Math.floor(Date.now() / 1000) + secs)
                      }}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8,
                        fontSize: '0.85rem', fontWeight: active ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: active ? 'var(--sage)' : 'var(--surface2)',
                        border: `1px solid ${active ? 'var(--sage-dark)' : 'var(--border)'}`,
                        color: active ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {selectedDuration === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 6 }}>
                  Pick a duration before starting
                </p>
              )}
            </div>
          </div>

          <button
            id="start-sprint-btn"
            onClick={startSprint}
            disabled={!activePoolId || selectedDuration === 0}
            className="btn-primary"
            style={{ width: '100%', padding: '13px 0', fontSize: '0.95rem', gap: 8 }}
          >
            <Zap style={{ width: 17, height: 17 }} />
            Start Focus Sprint
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Gas: ~70,000 units if slashed (Monad charges on limit)
          </p>
        </motion.div>
      )}

      {/* ── Active Sprint ────────────────────────────────── */}
      {isFocusMode && !isSlashed && (
        <div style={{ width: '100%', maxWidth: 360, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Big timer */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Time Remaining</p>
            <div style={{
              fontSize: 'clamp(3.5rem, 14vw, 5.5rem)',
              fontWeight: 900, fontFamily: 'monospace',
              color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {formattedRemaining}
            </div>
          </div>

          {/* Status card */}
          <div className="card" style={{ padding: '4px 20px' }}>
            <StatusRow icon={Eye}        label="Tab visible"  ok={isVisible}   okText="✓ Focused"  failText="✗ Hidden" />
            <StatusRow icon={Smartphone} label="Phone down"   ok={isPhoneDown} okText="✓ Down"     failText="Motion detected" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Trophy style={{ width: 15, height: 15 }} />
                Pool
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sage-dark)' }}>#{activePoolId?.toString()}</span>
            </div>
          </div>

          {/* Pulse dot */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--sage)' }} className="pulse-sage" />
          </div>

          {/* Demo panic button */}
          <button
            id="panic-slash-btn"
            onClick={() => demoSlashCallback?.()}
            className="btn-danger"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <AlertTriangle style={{ width: 15, height: 15 }} />
            DEMO: Trigger Slash
          </button>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Wake lock: {isLocked ? 'Active' : 'Inactive'}
          </p>
        </div>
      )}
    </div>
  )
}
