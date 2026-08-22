/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      // @coinbase/cdp-sdk optional peer deps that aren't installed.
      // Aliased to a no-op so Turbopack doesn't fail trying to bundle them.
      '@x402/core/client':      './lib/empty-module.js',
      '@x402/evm/exact/client': './lib/empty-module.js',
      '@x402/evm/upto/client':  './lib/empty-module.js',
      '@x402/svm/exact/client': './lib/empty-module.js',
      '@x402/evm':              './lib/empty-module.js',
    },
  },

  // Webpack fallback (for non-Turbopack builds / CI)
  webpack: (config) => {
    config.externals.push(
      'pino-pretty', 'lokijs', 'encoding',
      '@x402/core/client', '@x402/evm/exact/client',
      '@x402/evm/upto/client', '@x402/svm/exact/client', '@x402/evm',
    )
    return config
  },
}

module.exports = nextConfig
