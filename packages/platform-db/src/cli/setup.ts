import {
  appDatabaseEnvSchema,
  databaseEnvSchema,
  loadRootEnvFile,
  parseEnv,
} from '@duatf/core-config'
import { ensureAppRole } from '../admin'

loadRootEnvFile()
const { DATABASE_URL } = parseEnv(databaseEnvSchema)
const { APP_DATABASE_URL } = parseEnv(appDatabaseEnvSchema)
const role = await ensureAppRole(DATABASE_URL, APP_DATABASE_URL)
console.log(`App role "${role}" is ready.`)
