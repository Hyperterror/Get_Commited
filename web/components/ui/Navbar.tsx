'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Zap, LayoutDashboard, Layers, ShoppingBag, User, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/pools',     label: 'Pools',     icon: Layers },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/store',     label: 'Store',     icon: ShoppingBag },
  { href: '/profile',   label: 'Profile',   icon: User },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 60 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                  color: active ? 'var(--sage-dark)' : 'var(--text-secondary)',
                  background: active ? 'var(--sage-faint)' : 'transparent',
                  border: `1px solid ${active ? 'var(--sage-ring)' : 'transparent'}`,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side: RainbowKit button + mobile toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* RainbowKit ConnectButton — styled to match our light theme */}
          <div className="hidden sm:block">
            <ConnectButton
              accountStatus="address"
              chainStatus="none"
              showBalance={false}
            />
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              padding: 8, borderRadius: 8, background: 'transparent',
              border: '1px solid var(--border)', cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '12px 16px 16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    fontSize: '0.9rem', fontWeight: active ? 600 : 500,
                    color: active ? 'var(--sage-dark)' : 'var(--text-secondary)',
                    background: active ? 'var(--sage-faint)' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {label}
                </Link>
              )
            })}
          </div>
          {/* ConnectButton in mobile menu */}
          <ConnectButton
            accountStatus="address"
            chainStatus="none"
            showBalance={false}
          />
        </div>
      )}
    </header>
  )
}
