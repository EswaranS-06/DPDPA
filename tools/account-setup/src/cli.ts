// Creates the one sign-in account of the self-assessment edition, or resets it.
// Usage: pnpm account:setup --username eswaran --name "Eswaran S"
// The one-time password goes to .run/first-login.txt (readable by its owner only) and is never
// printed; the first sign-in asks for a new password.
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { databaseEnvSchema, findRepoRoot, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { createDatabase } from '@duatf/platform-db'
import { setupAccount } from '@duatf/platform-identity'

loadRootEnvFile()
const { values } = parseArgs({
  options: {
    username: { type: 'string' },
    name: { type: 'string' },
  },
})
if (!values.username || !values.name) {
  console.error('Usage: pnpm account:setup --username <username> --name "<name shown in the app>"')
  process.exit(64)
}
const handle = createDatabase(parseEnv(databaseEnvSchema).DATABASE_URL, { max: 1 })
const folder = join(findRepoRoot(), '.run')
const passwordFile = join(folder, 'first-login.txt')
try {
  const result = await setupAccount(handle.db, {
    username: values.username,
    displayName: values.name,
  })
  mkdirSync(folder, { recursive: true, mode: 0o700 })
  writeFileSync(
    passwordFile,
    `Username: ${values.username.trim().toLowerCase()}\nOne-time password: ${result.oneTimePassword}\n`,
    { mode: 0o600 },
  )
  chmodSync(passwordFile, 0o600)
  console.log(`${result.created ? 'Created' : 'Reset'} the account ${values.username}.`)
  console.log(`One-time password written to ${passwordFile} (owner-only). Sign-ins were ended.`)
} finally {
  await handle.close()
}
