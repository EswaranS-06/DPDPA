import { randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  authEnvSchema,
  keycloakSetupEnvSchema,
  parseEnv,
  testDatabaseEnvSchema,
} from '@duatf/core-config'
import {
  appUser,
  createDatabase,
  eq,
  roleAssignment,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { clientCredentials, createKeycloakAdmin, findUserByEmail } from '@duatf/platform-identity'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootstrapFirmAdmin } from './bootstrapAdmin'
import { describeRealm, ensureRealm } from './realm'
import { masterAdminClient, realmSettings } from './settings'

const env = parseEnv(
  keycloakSetupEnvSchema
    .extend(authEnvSchema.pick({ OIDC_ISSUER: true }).shape)
    .extend(testDatabaseEnvSchema.shape),
)
const realm = `duatf-test-${randomBytes(3).toString('hex')}`
const admin = masterAdminClient(env)
const settings = realmSettings(env, realm)

describe('keycloak realm', () => {
  let db: DatabaseHandle
  const email = `admin-${randomBytes(3).toString('hex')}@example.test`
  const dir = mkdtempSync(join(tmpdir(), 'duatf-bootstrap-'))

  beforeAll(() => {
    db = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
  })
  afterAll(async () => {
    await admin.request('DELETE', `/realms/${realm}`, undefined, { allow404: true })
    await db.db.delete(appUser).where(eq(appUser.email, email))
    await db.close()
    rmSync(dir, { recursive: true, force: true })
  })

  it('TC-C3.1-01 sets up the realm idempotently with the LAN issuer', async () => {
    await ensureRealm(admin, settings)
    const first = await describeRealm(admin, settings)
    await ensureRealm(admin, settings)
    const second = await describeRealm(admin, settings)
    expect(second).toEqual(first)
    expect(first.clients.map((client) => client.clientId)).toEqual(
      [env.KEYCLOAK_ADMIN_CLIENT_ID, env.OIDC_CLIENT_ID].sort(),
    )
    const web = first.clients.find((client) => client.clientId === env.OIDC_CLIENT_ID)
    expect(web?.pkce).toBe('S256')
    expect(web?.redirectUris).toEqual([`${env.PUBLIC_WEB_URL}/auth/callback`])
    expect(first.registrationAllowed).toBe(false)
    expect(first.bruteForceProtected).toBe(true)

    const discovery = (await fetch(
      `${env.KEYCLOAK_URL}/realms/${realm}/.well-known/openid-configuration`,
    ).then((response) => response.json())) as { issuer: string }
    expect(discovery.issuer).toBe(`${env.PUBLIC_KEYCLOAK_URL}/realms/${realm}`)
    expect(env.OIDC_ISSUER).toBe(`${env.PUBLIC_KEYCLOAK_URL}/realms/duatf`)
    expect(new URL(env.PUBLIC_KEYCLOAK_URL).hostname).not.toMatch(/^(localhost|127\.)/)
  }, 60_000)

  it('bootstraps one firm administrator with a root-only one-time password', async () => {
    const serviceAccount = createKeycloakAdmin(
      env.KEYCLOAK_URL,
      clientCredentials(
        env.KEYCLOAK_URL,
        realm,
        env.KEYCLOAK_ADMIN_CLIENT_ID,
        env.KEYCLOAK_ADMIN_CLIENT_SECRET,
      ),
    )
    const passwordFile = join(dir, 'first-admin.txt')
    const input = { email, displayName: 'First Admin', realm, passwordFile }
    const first = await bootstrapFirmAdmin(db.db, serviceAccount, input)
    const second = await bootstrapFirmAdmin(db.db, serviceAccount, input)
    expect(second.userId).toBe(first.userId)

    const roles = await db.db
      .select({ role: roleAssignment.role, tenantId: roleAssignment.tenantId })
      .from(roleAssignment)
      .where(eq(roleAssignment.userId, first.userId))
    expect(roles).toEqual([{ role: 'firm_admin', tenantId: null }])

    const keycloakUser = await findUserByEmail(serviceAccount, realm, email)
    expect(keycloakUser?.requiredActions?.sort()).toEqual(['CONFIGURE_TOTP', 'UPDATE_PASSWORD'])
    expect(statSync(passwordFile).mode & 0o777).toBe(0o600)
    expect(readFileSync(passwordFile, 'utf8')).toContain(`email=${email}`)
  }, 60_000)
})
