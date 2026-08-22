'use client'

import Link from 'next/link'
import { Zap, ExternalLink } from 'lucide-react'
import { CONTRACTS } from '@/lib/contracts'

const APP_LINKS = [
  { href: '/pools',     label: 'Pools' },
  { href: '/sprint',    label: 'Sprint' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/store',     label: 'Store' },
  { href: '/profile',   label: 'Profile' },
]

const RESOURCE_LINKS = [
  { href: `https://testnet.monadscan.com/address/${CONTRACTS.GET_COMMITTED}`, label: 'Contract on MonadScan' },
  { href: 'https://testnet.monad.xyz/faucet', label: 'Testnet Faucet' },
  { href: 'https://testnet.monadscan.com', label: 'MonadScan Explorer' },
]

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '48px 24px 24px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>

        {/* Logo & Tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--sage)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(90,122,90,0.35)',
            }}>
              <Zap style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              Get<span style={{ color: 'var(--sage)' }}>_</span>Committed
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.5 }}>
            The On-Chain Discipline Economy on Monad. Stake MON, stay focused, earn rewards.
          </p>
        </div>

        {/* App Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 100 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>App</p>
          {APP_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>

        {/* Resource Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Resources</p>
          {RESOURCE_LINKS.map(({ href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {label} <ExternalLink style={{ width: 11, height: 11, opacity: 0.5 }} />
            </a>
          ))}
        </div>

        {/* Built on Monad Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', justifyContent: 'flex-start' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 600, padding: '5px 12px', borderRadius: 999,
            background: 'var(--sage-faint)', color: 'var(--sage-dark)',
            border: '1px solid var(--sage-ring)',
          }}>
            ⚡ Built on Monad Testnet
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            Chain ID: 10143
          </span>
        </div>
      </div>

      {/* Bottom divider + disclaimer */}
      <div style={{
        maxWidth: 1280, margin: '36px auto 0',
        borderTop: '1px solid var(--border)',
        paddingTop: 16,
        display: 'flex', justifyContent: 'center',
      }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          ⚠ Testnet only — no real value. Contracts are unaudited.
        </p>
      </div>
    </footer>
  )
}
