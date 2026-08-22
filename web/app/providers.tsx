'use client'

import { RainbowKitProvider, getDefaultConfig, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { WagmiProvider } from 'wagmi'
import { monadTestnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

const config = getDefaultConfig({
  appName: 'Get_Committed',
  // WalletConnect project ID — get a free one at https://cloud.walletconnect.com
  // For local dev / hackathon you can use this placeholder; some wallets still work via injected provider
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  chains: [monadTestnet],
  ssr: true,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000 },
  },
})

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#5A7A5A',          // sage green
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          locale="en-US"
          initialChain={monadTestnet}
        >
          {children}
          <Toaster
            position="bottom-right"
            theme="light"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-md)',
                borderRadius: '10px',
                fontSize: '0.875rem',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
