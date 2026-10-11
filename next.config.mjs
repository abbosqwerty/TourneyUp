/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'

/**
 * Baseline security headers. CSP is intentionally omitted here and left to
 * `middleware.ts` when nonce support is added — a static `unsafe-inline`
 * policy would be worse than none.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
]

const nextConfig = {
  // Self-contained server bundle (server.js + traced node_modules) for Node hosting.
  output: 'standalone',
  // A stray lockfile in $HOME otherwise wins workspace-root inference.
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  images: {
    // Uploaded images are served from /api/media/[id] as raw bytes.
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
