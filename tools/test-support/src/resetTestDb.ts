// Rebuilds the test database: app role, empty schema, migrations, framework release 1.0.0.
import { join } from 'node:path'
import {
  findRepoRoot,
  loadRootEnvFile,
  parseEnv,
  seedEnvSchema,
  testDatabaseEnvSchema,
} from '@duatf/core-config'
import { ensureAppRole, recreateSchema, runMigrations } from '@duatf/platform-db'
import { importSeedVault } from '@duatf/seed-import'

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
console.log(`Test database ready (framework release ${report.version}).`)
