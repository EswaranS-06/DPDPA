import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  // Workspace packages ship TypeScript source.
  transpilePackages: [
    '@duatf/core-access',
    '@duatf/core-config',
    '@duatf/core-ui',
    '@duatf/core-utils',
    '@duatf/feature-framework-library',
    '@duatf/feature-framework-library-api',
    '@duatf/platform-db',
    '@duatf/platform-identity',
    '@duatf/platform-trpc',
  ],
  serverExternalPackages: ['postgres', 'openid-client'],
  // Lets the dev server be opened from other machines on the LAN.
  allowedDevOrigins: ['192.168.0.110'],
  headers: () =>
    Promise.resolve([
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]),
}

export default config
