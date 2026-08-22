// Empty shim for optional peer dependencies that are not installed.
// Used to silence Turbopack/webpack "module not found" errors for
// packages that are only needed at runtime in specific Coinbase CDP flows.
module.exports = {}
