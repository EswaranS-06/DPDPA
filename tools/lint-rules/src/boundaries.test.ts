import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { boundaryConfigs } from '../boundaries.mjs'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

const lintAs = async (filePath: string, code: string) => {
  const eslint = new ESLint({
    cwd: repoRoot,
    overrideConfigFile: true,
    overrideConfig: [
      { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } },
      ...boundaryConfigs(repoRoot),
    ],
  })
  const [result] = await eslint.lintText(code, { filePath })
  return result?.messages.map((message) => message.ruleId) ?? []
}

describe('dependency direction', () => {
  it('TC-C0.2-01 rejects a core-* package importing a feature-* package', async () => {
    const rules = await lintAs(
      'packages/core-utils/src/fixture.ts',
      "import { x } from '@duatf/feature-framework-library'\nexport const y = x\n",
    )
    expect(rules).toContain('no-restricted-imports')
  })

  it('rejects a platform-* package importing a feature-* package', async () => {
    const rules = await lintAs(
      'packages/platform-db/src/fixture.ts',
      "import { x } from '@duatf/feature-framework-library'\nexport const y = x\n",
    )
    expect(rules).toContain('no-restricted-imports')
  })

  it('rejects deep imports into another package', async () => {
    const rules = await lintAs(
      'apps/web/src/fixture.ts',
      "import { x } from '@duatf/core-utils/src/codes'\nexport const y = x\n",
    )
    expect(rules).toContain('no-restricted-imports')
  })

  it('allows a feature to import core-* and platform-* packages', async () => {
    const rules = await lintAs(
      'packages/feature-framework-library/src/fixture.ts',
      "import { a } from '@duatf/core-utils'\nimport { b } from '@duatf/platform-db'\nexport const y = [a, b]\n",
    )
    expect(rules).toEqual([])
  })
})
