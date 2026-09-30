// Rebuilds the test database: app role, empty schema, migrations, framework releases 1.0.0 and 1.1.0.
import { join } from 'node:path'
import {
  findRepoRoot,
  loadRootEnvFile,
  parseEnv,
  seedEnvSchema,
  testDatabaseEnvSchema,
} from '@duatf/core-config'
import { ensureAppRole, recreateSchema, runMigrations } from '@duatf/platform-db'
import { buildRelease, importSeedVault, RELEASE_1_1_0 } from '@duatf/seed-import'

loadRootEnvFile()
const env = parseEnv(testDatabaseEnvSchema)
const { SEED_VAULT_PATH } = parseEnv(seedEnvSchema)

const role = await ensureAppRole(env.TEST_DATABASE_URL, env.TEST_APP_DATABASE_URL)
await recreateSchema(env.TEST_DATABASE_URL, role)
await runMigrations(env.TEST_DATABASE_URL)
const report = await importSeedVault({
  vaultPath: join(findRepoRoot(), SEED_VAULT_PATH),
  databaseUrl: env.TEST_DATABASE_URL,
})
const release = await buildRelease({
  databaseUrl: env.TEST_DATABASE_URL,
  questionBankPath: join(findRepoRoot(), 'seed', 'question-bank', 'questions.yaml'),
  ...RELEASE_1_1_0,
})
console.log(`Test database ready (framework releases ${report.version} and ${release.version}).`)
