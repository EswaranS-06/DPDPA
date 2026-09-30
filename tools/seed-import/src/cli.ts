import { join } from 'node:path'
import {
  databaseEnvSchema,
  findRepoRoot,
  loadRootEnvFile,
  parseEnv,
  seedEnvSchema,
} from '@duatf/core-config'
import { AlreadyImportedError, importSeedVault } from './importer'

loadRootEnvFile()
const dryRun = process.argv.includes('--dry-run')
const { SEED_VAULT_PATH } = parseEnv(seedEnvSchema)
const vaultPath = join(findRepoRoot(), SEED_VAULT_PATH)

try {
  const report = await importSeedVault({
    vaultPath,
    databaseUrl: dryRun ? '' : parseEnv(databaseEnvSchema).DATABASE_URL,
    dryRun,
  })
  console.log(`${dryRun ? 'Dry run' : 'Imported'} framework release ${report.version}`)
  console.log(`Source digest ${report.digest.slice(0, 16)}`)
  for (const [table, count] of Object.entries(report.counts)) {
    console.log(`  ${table.padEnd(22)} ${count}`)
  }
  const unresolved = Object.entries(report.unresolvedLinks)
  if (unresolved.length) {
    console.log(`Links kept as plain text (target not in the framework): ${unresolved.length}`)
    for (const [target, times] of unresolved) console.log(`  ${target} (${times})`)
  }
} catch (error) {
  if (error instanceof AlreadyImportedError) {
    console.error(error.message)
    process.exit(2)
  }
  throw error
}
