'use client'

import { motion } from 'framer-motion'
import { useReadContract } from 'wagmi'
import Link from 'next/link'
import {
  Zap, Users, TrendingUp, Shield, Flame, Star,
  ArrowRight, Plus, Activity, Trophy, Target, Eye, Smartphone
} from 'lucide-react'
import { CONTRACTS, GET_COMMITTED_ABI } from '@/lib/contracts'

// ─── Inline SVG: stacked layers icon ──────────────────
function Layers2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 2 10 6.5L12 15 2 8.5z" />
      <path d="m2 15.5 10 6.5 10-6.5" />
      <path d="m2 11.5 10 6.5 10-6.5" />
    </svg>
  )
}

// ─── Stat pill ─────────────────────────────────────────
function StatPill({
  icon: Icon, label, value, color,
}: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon style={{ width: 20, height: 20, color: '#fff' }} />
      </div>
      <div>
        <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</p>
      </div>
    </div>
  )
}

// ─── Live Stats ────────────────────────────────────────
function LiveStats() {
  const { data: poolCount } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'poolCount',
  })

  const stats = [
    { label: 'Active Pools',       value: poolCount ? poolCount.toString() : '—', icon: Layers2,   color: 'var(--sage)' },
    { label: 'Testnet MON Staked', value: '—',                                    icon: TrendingUp, color: '#1D4ED8' },
    { label: 'Slashing Events',    value: '—',                                    icon: Flame,      color: 'var(--red)' },
    { label: 'Commitments Kept',   value: '—',                                    icon: Trophy,     color: 'var(--amber)' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => <StatPill key={s.label} {...s} />)}
    </div>
  )
}

// ─── Feature Card ──────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, accent }: {
  icon: any; title: string; desc: string; accent: string
}) {
  return (
    <motion.div
      className="card card-hover p-6 flex flex-col gap-4"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: accent + '18',
        border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 20, height: 20, color: accent }} />
      </div>
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── How It Works Step ─────────────────────────────────
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div style={{
        flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
        background: 'var(--sage-faint)', border: '1px solid var(--sage-ring)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', fontWeight: 700, color: 'var(--sage-dark)',
      }}>
        {n}
      </div>
      <div>
        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{title}</h4>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.65 }}>{desc}</p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="dot-bg min-h-screen">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 16px 64px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 999,
              background: 'var(--sage-faint)', border: '1px solid var(--sage-ring)',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--sage-dark)',
              marginBottom: 28,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse-sage 2s infinite' }} />
            Live on Monad Testnet
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
              fontWeight: 800, letterSpacing: '-0.03em',
              lineHeight: 1.12, marginBottom: 20,
              color: 'var(--text-primary)',
            }}
          >
            Stake your{' '}
            <span className="gradient-text">commitment.</span>
            <br />
            Earn from{' '}
            <span className="gradient-text-fire">quitters.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontSize: '1.05rem', color: 'var(--text-secondary)',
              lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px',
            }}
          >
            Join time-boxed focus pools on Monad. Stay committed, claim your stake back
            plus a share of everyone who quit. Switch tabs? You're slashed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/pools" id="cta-browse-pools" className="btn-primary" style={{ gap: 8, padding: '11px 22px', fontSize: '0.9rem' }}>
              <Zap style={{ width: 16, height: 16 }} />
              Browse Pools
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
            <Link
              href="/pools"
              id="cta-create-pool"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600,
                background: 'var(--surface)', border: '1px solid var(--border-dark)',
                color: 'var(--text-secondary)', textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              Create Pool
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Live Stats ───────────────────────────────────── */}
      <section style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px 60px' }}>
        <LiveStats />
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px 64px' }}>
        <div className="card" style={{ padding: '40px 48px' }}>
          <p className="label" style={{ marginBottom: 8 }}>Process</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>How it works</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 32 }}>Four steps from intent to reward.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <Step n={1} title="Connect & Stake" desc="Connect via email, passkey, or MetaMask. Join a pool by staking equal MON with other participants." />
            <Step n={2} title="Sprint With Focus" desc="Start your session. Page Visibility API monitors your tab. Switch apps = instant slash. Phone down = stay focused." />
            <Step n={3} title="Survive the Clock" desc="Make it to the deadline without distractions. Completers get 100% of their stake back automatically." />
            <Step n={4} title="Earn From Quitters" desc="Slashed stakes are split equally among all successful completers. More failures = bigger bonus for you." />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px 64px' }}>
        <p className="label" style={{ marginBottom: 8 }}>The discipline stack</p>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Four integrated systems</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28 }}>Every layer is designed to keep you accountable.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard icon={Target}     title="Staking Pools"  desc="Equal-stake multiplayer pools with deadline-enforced settlement on Monad." accent="var(--sage)" />
          <FeatureCard icon={Eye}        title="Focus Guard"    desc="Page Visibility + Device Motion APIs detect distraction in real time."     accent="var(--red)" />
          <FeatureCard icon={Star}       title="XP Reputation"  desc="Earn soulbound XP with streak multipliers. Level up to Monad Monk."        accent="var(--amber)" />
          <FeatureCard icon={Shield}     title="Perk Store"     desc="Burn XP for Streak Shields, Yield Boosters, and NFT reputation badges."    accent="var(--blue)" />
        </div>
      </section>

      {/* ── Payout Math ──────────────────────────────────── */}
      <section style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px 96px' }}>
        <div className="card" style={{ padding: '40px 48px' }}>
          <p className="label" style={{ marginBottom: 8 }}>Reward formula</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>The math</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
            Transparent, fully on-chain. No platform fee on testnet.
          </p>

          {/* Formula callout */}
          <div style={{
            background: 'var(--sage-faint)', border: '1px solid var(--sage-ring)',
            borderRadius: 10, padding: '14px 20px', marginBottom: 28,
            fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--sage-dark)', fontWeight: 600,
          }}>
            Winner payout = stake_back + (slashed_treasury ÷ success_count)
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Participants', 'Stake Each', 'Failures', 'Winner Gets'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 16px 10px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['5', '1 MON', '2 fail',  '1 + 0.667 = 1.667 MON'],
                  ['4', '2 MON', '1 fails', '2 + 0.333 = 2.333 MON'],
                  ['10','1 MON', '5 fail',  '1 + 1.0 = 2.0 MON (2×)'],
                ].map(([p, s, f, w]) => (
                  <tr key={p + s} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px 12px 0', color: 'var(--text-primary)', fontWeight: 500 }}>{p}</td>
                    <td style={{ padding: '12px 16px 12px 0', color: 'var(--text-secondary)' }}>{s}</td>
                    <td style={{ padding: '12px 16px 12px 0', color: 'var(--red)', fontWeight: 500 }}>{f}</td>
                    <td style={{ padding: '12px 0',           color: 'var(--green)', fontWeight: 600 }}>{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 16 }}>
            Yield Booster applies 1.2× to the bonus portion only, not the returned stake.
          </p>
        </div>
      </section>

    </div>
  )
}
