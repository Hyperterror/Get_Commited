/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack config (local dev with Next.js 16)
  turbopack: {
    resolveAlias: {
      '@x402/core/client':      './lib/empty-module.js',
      '@x402/evm/exact/client': './lib/empty-module.js',
      '@x402/evm/upto/client':  './lib/empty-module.js',
      '@x402/svm/exact/client': './lib/empty-module.js',
      '@x402/evm':              './lib/empty-module.js',
    },
  },

  // Webpack config — used by Vercel CI builds
  webpack: (config) => {
    config.externals.push(
      'pino-pretty',
      'lokijs',
      'encoding',
      '@x402/core/client',
      '@x402/evm/exact/client',
      '@x402/evm/upto/client',
      '@x402/svm/exact/client',
      '@x402/evm',
    )

    // Resolve the empty shim for any remaining references
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core/client':      require.resolve('./lib/empty-module.js'),
      '@x402/evm/exact/client': require.resolve('./lib/empty-module.js'),
      '@x402/evm/upto/client':  require.resolve('./lib/empty-module.js'),
      '@x402/svm/exact/client': require.resolve('./lib/empty-module.js'),
      '@x402/evm':              require.resolve('./lib/empty-module.js'),
    }

    return config
  },
}

module.exports = nextConfig
