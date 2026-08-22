import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Get_Committed — On-Chain Discipline Economy',
  description: 'Stake MON behind your goals. Succeed and earn from those who quit. The accountability protocol on Monad testnet.',
  keywords: ['Monad', 'DeFi', 'accountability', 'staking', 'productivity', 'web3'],
  openGraph: {
    title: 'Get_Committed',
    description: 'On-Chain Discipline Economy on Monad',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable} style={{ fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)' }}>
        <Providers>
          <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
