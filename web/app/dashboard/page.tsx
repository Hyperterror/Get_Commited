'use client'

import { useAccount, useReadContract } from 'wagmi'
import { motion } from 'framer-motion'
import { Shield, Zap, Star, Trophy, Clock, Activity, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS, GET_COMMITTED_ABI, getLevelInfo, getXPProgress, LEVELS } from '@/lib/contracts'

// ─── XP Progress Card ──────────────────────────────────
function XPCard({ xp, level }: { xp: number; level: number }) {
  const info = getLevelInfo(xp)
  const progress = getXPProgress(xp)
  const nextLevel = LEVELS.find(l => l.level === level + 1)

  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--sage-faint)', border: '1px solid var(--sage-ring)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>
            {info.emoji}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{info.name}</span>
              <span style={{
                fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999,
                background: 'var(--sage-faint)', color: 'var(--sage-dark)',
                border: '1px solid var(--sage-ring)', fontWeight: 600,
              }}>Lv.{level}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>{xp.toLocaleString()} XP total</p>
          </div>
        </div>
        {nextLevel && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next level</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{nextLevel.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{nextLevel.minXP - xp} XP to go</p>
          </div>
        )}
      </div>

      <div className="xp-bar">
        <motion.div
          className="xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>{progress}% to next level</p>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: any; accent: string
}) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: accent + '18', border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      }}>
        <Icon style={{ width: 18, height: 18, color: accent }} />
      </div>
      <p style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 5 }}>{label}</p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────
export default function DashboardPage() {
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

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Connect Your Wallet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connect to view your on-chain dashboard.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 16px' }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {address?.slice(0, 10)}…{address?.slice(-6)}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* XP Progress */}
        <XPCard xp={xpNum} level={levelNum} />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Current Streak"  value={`${streakNum} 🔥`}          icon={Activity} accent="var(--amber)" />
          <StatCard label="XP Earned"        value={xpNum.toLocaleString()}    icon={Star}     accent="var(--sage)" />
          <StatCard label="Streak Shield"    value={hasShield ? 'Active' : 'None'} icon={Shield} accent="var(--blue)" />
          <StatCard label="Level"            value={`${levelNum} / 4`}         icon={Trophy}   accent="var(--sage-dark)" />
        </div>

        {/* Level roadmap */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Level Roadmap</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {LEVELS.map(l => {
              const reached  = levelNum >= l.level
              const current  = levelNum === l.level
              return (
                <div
                  key={l.level}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px', borderRadius: 10,
                    background: current ? 'var(--sage-faint)' : 'transparent',
                    border: `1px solid ${current ? 'var(--sage-ring)' : 'transparent'}`,
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    background: reached ? 'var(--sage-faint)' : 'var(--surface2)',
                    border: `1px solid ${reached ? 'var(--sage-ring)' : 'var(--border)'}`,
                  }}>
                    {reached ? l.emoji : '🔒'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: reached ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        Lv.{l.level} — {l.name}
                      </span>
                      {current && (
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999,
                          background: 'var(--green-bg)', color: 'var(--green)',
                          border: '1px solid #BBE0BB', fontWeight: 600,
                        }}>Current</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {l.maxXP === Infinity ? `${l.minXP.toLocaleString()}+ XP` : `${l.minXP.toLocaleString()} – ${l.maxXP.toLocaleString()} XP`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { href: '/pools',  label: 'Join a Pool',    desc: 'Stake MON and commit',   icon: Zap,    accent: 'var(--sage)' },
            { href: '/sprint', label: 'Active Sprint',  desc: 'Focus mode timer',        icon: Clock,  accent: 'var(--amber)' },
            { href: '/store',  label: 'Perk Store',     desc: 'Spend your XP',           icon: Shield, accent: 'var(--blue)' },
          ].map(({ href, label, desc, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              id={`dashboard-link-${href.slice(1)}`}
              className="card card-hover"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '18px 20px', textDecoration: 'none',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                background: accent + '18', border: `1px solid ${accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 17, height: 17, color: accent }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</p>
              </div>
              <ArrowRight style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
