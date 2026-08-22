'use client'

import { useAccount, useReadContract } from 'wagmi'
import { motion } from 'framer-motion'
import { Shield, Star, Trophy, Flame, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { CONTRACTS, GET_COMMITTED_ABI, getLevelInfo, getXPProgress, LEVELS } from '@/lib/contracts'

export default function ProfilePage() {
  const { address, isConnected } = useAccount()

  const { data: profile } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'getUserProfile',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  })

  const [xp, streak, level, hasShield] = profile ?? [0n, 0n, 1n, false]
  const xpNum    = Number(xp)
  const streakNum = Number(streak)
  const levelNum  = Number(level)
  const info      = getLevelInfo(xpNum)
  const progress  = getXPProgress(xpNum)

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    toast.success('Address copied!')
  }

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 16 }}>👤</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Connect to View Profile</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your on-chain reputation is tied to your wallet address.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Profile Hero ─────────────────────────────────── */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, flexShrink: 0,
            background: 'var(--sage-faint)', border: '2px solid var(--sage-ring)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            {info.emoji}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{info.name}</h1>
              <span style={{
                fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
                background: 'var(--sage-faint)', color: 'var(--sage-dark)',
                border: '1px solid var(--sage-ring)', fontWeight: 700,
              }}>Level {levelNum}</span>
              {hasShield && (
                <span style={{
                  fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
                  background: 'var(--blue-bg)', color: 'var(--blue)',
                  border: '1px solid #BFDBFE', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Shield style={{ width: 11, height: 11 }} /> Shield Active
                </span>
              )}
            </div>

            <button
              onClick={copyAddress}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginBottom: 14,
                color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'monospace',
              }}
            >
              {address?.slice(0, 14)}…{address?.slice(-6)}
              <Copy style={{ width: 13, height: 13, opacity: 0.6 }} />
            </button>

            <div className="xp-bar" style={{ marginBottom: 6 }}>
              <motion.div
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {xpNum.toLocaleString()} XP · {progress}% to Lv.{Math.min(levelNum + 1, 4)}
            </p>
          </div>

          {/* Explorer */}
          <a
            href={`https://testnet.monadscan.com/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '0.8rem', color: 'var(--sage-dark)', fontWeight: 600,
              textDecoration: 'none', flexShrink: 0,
            }}
          >
            <ExternalLink style={{ width: 13, height: 13 }} />
            MonadScan
          </a>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'XP Earned',     value: xpNum.toLocaleString(),      icon: Star,   accent: 'var(--amber)' },
          { label: 'Streak Days',   value: `${streakNum} 🔥`,           icon: Flame,  accent: '#EA580C' },
          { label: 'Level',         value: `${levelNum} / 4`,           icon: Trophy, accent: 'var(--sage)' },
          { label: 'Streak Shield', value: hasShield ? 'Active' : 'None', icon: Shield, accent: 'var(--blue)' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="card" style={{ padding: '18px 16px', textAlign: 'center' }}>
            <Icon style={{ width: 18, height: 18, color: accent, margin: '0 auto 10px' }} />
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Reputation Journey ───────────────────────────── */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Reputation Journey</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {LEVELS.map((l, i) => {
            const reached  = levelNum >= l.level
            const current  = levelNum === l.level
            return (
              <div key={l.level} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                    transform: current ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s',
                    border: `2px solid ${current ? 'var(--sage)' : reached ? '#BBE0BB' : 'var(--border)'}`,
                    background: current ? 'var(--sage-faint)' : reached ? 'var(--green-bg)' : 'var(--surface2)',
                  }}>
                    {reached ? l.emoji : '🔒'}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: reached ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    Lv.{l.level}
                  </span>
                </div>
                {i < LEVELS.length - 1 && (
                  <div style={{
                    width: 40, height: 2, borderRadius: 1, flexShrink: 0,
                    background: reached && levelNum > l.level ? 'var(--sage)' : 'var(--border)',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Badges ───────────────────────────────────────── */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Reputation Badges</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {LEVELS.map(l => (
            <div key={l.level} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
                background: levelNum >= l.level ? 'var(--sage-faint)' : 'var(--surface2)',
                border: `1.5px solid ${levelNum >= l.level ? 'var(--sage-ring)' : 'var(--border)'}`,
                filter: levelNum >= l.level ? 'none' : 'grayscale(1)',
                opacity: levelNum >= l.level ? 1 : 0.35,
              }}>
                {l.emoji}
              </div>
              <p style={{ fontSize: '0.72rem', textAlign: 'center', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{l.name}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 16 }}>
          Burn 500 XP in the{' '}
          <a href="/store" style={{ color: 'var(--sage-dark)', fontWeight: 600, textDecoration: 'none' }}>Perk Store</a>
          {' '}to mint soulbound badge NFTs to your wallet.
        </p>
      </div>
    </div>
  )
}
