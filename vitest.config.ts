import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  test: {
    include: ['{apps,packages,tools}/**/src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', 'apps/e2e/**'],
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
