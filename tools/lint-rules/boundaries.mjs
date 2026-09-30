// Dependency-direction rules for the monorepo: apps -> feature-* -> platform-* -> core-*.
// Kept as plain config objects so the rules can be tested in isolation (TC-C0.2-01).
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const APPS = ['@duatf/web', '@duatf/backend', '@duatf/e2e']
const TOOLS = [
  '@duatf/seed-import',
  '@duatf/traceability',
  '@duatf/test-support',
  '@duatf/lint-rules',
  '@duatf/keycloak-setup',
  '@duatf/demo-data',
]
const DEEP_IMPORT = {
  group: ['@duatf/*/src', '@duatf/*/src/**'],
  message: 'Import from the package entry point, not its internal files.',
}

const restrict = (files, groups) => ({
  files,
  rules: {
    'no-restricted-imports': ['error', { patterns: [...groups, DEEP_IMPORT] }],
  },
})

const listFeatures = (repoRoot) => {
  const packagesDir = join(repoRoot, 'packages')
  if (!existsSync(packagesDir)) return []
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('feature-'))
    .map((entry) => entry.name)
}

/** @param {string} repoRoot */
export const boundaryConfigs = (repoRoot) => [
  restrict(
    ['packages/core-*/**/*.{ts,tsx}'],
    [
      {
        group: ['@duatf/platform-*', '@duatf/feature-*', ...APPS, ...TOOLS],
        message: 'core-* packages may only import other core-* packages.',
      },
    ],
  ),
  restrict(
    ['packages/platform-*/**/*.{ts,tsx}'],
    [
      {
        group: ['@duatf/feature-*', ...APPS, ...TOOLS],
        message: 'platform-* packages may only import core-* and other platform-* packages.',
      },
    ],
  ),
  ...listFeatures(repoRoot).map((feature) =>
    restrict(
      [`packages/${feature}/**/*.{ts,tsx}`],
      [
        {
          group: [
            '@duatf/feature-*',
            `!@duatf/${feature}`,
            `!@duatf/${feature}-*`,
            ...APPS,
            ...TOOLS,
          ],
          message: 'A feature may import core-*, platform-* and its own sub-features only.',
        },
      ],
    ),
  ),
  restrict(['apps/**/*.{ts,tsx}', 'tools/**/*.{ts,tsx}'], []),
]
