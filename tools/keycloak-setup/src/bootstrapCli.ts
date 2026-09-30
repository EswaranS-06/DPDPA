// Usage: pnpm admin:bootstrap --email admin@duatf.local --name "Firm Administrator"
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import {
  databaseEnvSchema,
  findRepoRoot,
  keycloakAdminEnvSchema,
  loadRootEnvFile,
  parseEnv,
} from '@duatf/core-config'
import { createDatabase } from '@duatf/platform-db'
import { clientCredentials, createKeycloakAdmin } from '@duatf/platform-identity'
import { bootstrapFirmAdmin } from './bootstrapAdmin'

loadRootEnvFile()
const { values } = parseArgs({
  options: {
    email: { type: 'string', default: 'admin@duatf.local' },
    name: { type: 'string', default: 'Firm Administrator' },
  },
})
const env = parseEnv(keycloakAdminEnvSchema.extend(databaseEnvSchema.shape))
const keycloak = createKeycloakAdmin(
  env.KEYCLOAK_URL,
  clientCredentials(
    env.KEYCLOAK_URL,
    env.KEYCLOAK_REALM,
    env.KEYCLOAK_ADMIN_CLIENT_ID,
    env.KEYCLOAK_ADMIN_CLIENT_SECRET,
  ),
)
const handle = createDatabase(env.DATABASE_URL, { max: 1 })
const passwordFile = join(findRepoRoot(), '.run', 'first-admin.txt')
try {
  await bootstrapFirmAdmin(handle.db, keycloak, {
    email: values.email,
    displayName: values.name,
    realm: env.KEYCLOAK_REALM,
    passwordFile,
  })
  console.log(`Firm administrator ${values.email} is ready.`)
  console.log(`One-time password written to ${passwordFile} (readable by root only).`)
} finally {
  await handle.close()
}
