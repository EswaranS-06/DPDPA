import { databaseEnvSchema, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { runMigrations } from '../admin'

loadRootEnvFile()
const { DATABASE_URL } = parseEnv(databaseEnvSchema)
await runMigrations(DATABASE_URL)
console.log('Migrations applied.')
