import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const config: NextConfig = {
  // A separate build folder lets a preview build run beside the live one (NEXT_DIST_DIR=.next-preview).
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
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
    '@duatf/feature-compliance-api',
    '@duatf/feature-framework-library',
    '@duatf/feature-framework-library-api',
    '@duatf/platform-db',
    '@duatf/platform-identity',
    '@duatf/platform-storage',
    '@duatf/platform-trpc',
  ],
  serverExternalPackages: ['postgres', 'openid-client', 'minio', 'exceljs'],
  // Evidence files up to 20 MB are sent through server actions (and the proxy in front of them).
  experimental: {
    serverActions: { bodySizeLimit: '21mb' },
    proxyClientMaxBodySize: '21mb',
  },
  // The framework library became one knowledge-base page; old links keep working.
  redirects: () =>
    Promise.resolve([
      { source: '/library', destination: '/knowledge-base', permanent: true },
      {
        source: '/library/law/bases',
        destination: '/knowledge-base?section=bases',
        permanent: true,
      },
      {
        source:
          '/library/:section(law|obligations|controls|domains|sectors|processes|data-elements|vocabularies|playbooks)',
        destination: '/knowledge-base?section=:section',
        permanent: true,
      },
      {
        source:
          '/library/:section(law|obligations|controls|domains|sectors|processes|vocabularies|playbooks)/:item',
        destination: '/knowledge-base?section=:section&item=:item',
        permanent: true,
      },
    ]),
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
