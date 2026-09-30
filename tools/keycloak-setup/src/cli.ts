// Creates or updates the Keycloak realm and clients used by DUATF. Safe to run repeatedly.
import { keycloakSetupEnvSchema, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { describeRealm, ensureRealm } from './realm'
import { masterAdminClient, realmSettings } from './settings'

loadRootEnvFile()
const env = parseEnv(keycloakSetupEnvSchema)
const admin = masterAdminClient(env)
const settings = realmSettings(env)

await ensureRealm(admin, settings)
const summary = await describeRealm(admin, settings)
console.log(
  `Realm ${settings.realm} ready: ${summary.clients.map((client) => client.clientId).join(', ')}.`,
)
console.log(`Issuer: ${env.PUBLIC_KEYCLOAK_URL}/realms/${settings.realm}`)
