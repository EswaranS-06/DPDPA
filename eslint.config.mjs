import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { boundaryConfigs } from './tools/lint-rules/boundaries.mjs'

const repoRoot = fileURLToPath(new URL('.', import.meta.url))
const SOURCE = [
  '{apps,packages,tools}/**/src/**/*.{ts,tsx}',
  'packages/*/index.ts',
  'packages/*/server.ts',
]
const NEXT_DEFAULT_EXPORT_FILES = [
  'apps/web/src/app/**/{page,layout,not-found,error,loading,global-error,route}.tsx',
  'apps/web/src/app/**/route.ts',
  '**/*.config.{ts,mjs,js}',
]

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/.next-preview/**',
    '**/dist/**',
    '**/.turbo/**',
    'seed/**',
    'docs/**',
    'reports/**',
    'packages/platform-db/migrations/**',
    'apps/web/next-env.d.ts',
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: SOURCE,
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: repoRoot },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports only.' },
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a string-literal union instead of an enum.',
        },
      ],
    },
  },
  {
    files: NEXT_DEFAULT_EXPORT_FILES,
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}', 'packages/feature-*/**/*.tsx', 'packages/core-ui/**/*.tsx'],
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    settings: { next: { rootDir: 'apps/web/' } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  ...boundaryConfigs(repoRoot),
])
