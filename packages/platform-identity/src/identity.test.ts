import { randomBytes } from 'node:crypto'
import type { Principal } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  appUser,
  createDatabase,
  eq,
  legalEntity,
  sql,
  tenant,
  userSession,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateTemporaryPassword } from './keycloakAdmin'
import { createOidc, decodeTransaction, encodeTransaction, LoginError, safeReturnTo } from './oidc'
import { tenantScope } from './principal'
import { createSession, findSessionUser, hashToken, revokeSession } from './sessions'
import { resolveSignIn } from './signIn'

const env = parseEnv(testDatabaseEnvSchema)
const tag = () => randomBytes(4).toString('hex')

describe('sessions and sign-in', () => {
  let owner: DatabaseHandle
  let app: DatabaseHandle
  const emails: string[] = []

  const makeUser = async (status: 'invited' | 'active' | 'disabled' = 'active') => {
    const email = `user-${tag()}@example.test`
    emails.push(email)
    const [row] = await owner.db
      .insert(appUser)
      .values({ email, displayName: 'Test User', kind: 'firm', status })
      .returning({ id: appUser.id })
    return { id: row?.id ?? '', email }
  }

  beforeAll(() => {
    owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
    app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  })
  afterAll(async () => {
    for (const email of emails) await owner.db.delete(appUser).where(eq(appUser.email, email))
    await Promise.all([owner.close(), app.close()])
  })

  it('TC-C3.2-01 stores only token hashes and refuses expired or revoked sessions', async () => {
    const user = await makeUser()
    const { token } = await createSession(app.db, { userId: user.id, ttlHours: 1 })
    const stored = await owner.db.select().from(userSession).where(eq(userSession.userId, user.id))
    expect(stored).toHaveLength(1)
    expect(stored[0]?.id).toBe(hashToken(token))
    expect(JSON.stringify(stored)).not.toContain(token)

    expect((await findSessionUser(app.db, token))?.userId).toBe(user.id)
    expect(await findSessionUser(app.db, `${token}x`)).toBeNull()
    const later = new Date(Date.now() + 2 * 3_600_000)
    expect(await findSessionUser(app.db, token, later)).toBeNull()

    await revokeSession(app.db, token)
    expect(await findSessionUser(app.db, token)).toBeNull()

    const disabled = await makeUser('disabled')
    const second = await createSession(app.db, { userId: disabled.id, ttlHours: 1 })
    expect(await findSessionUser(app.db, second.token)).toBeNull()
  })

  it('links an invited user on first sign-in and refuses unknown or disabled users', async () => {
    const invited = await makeUser('invited')
    const subject = `kc-${tag()}`
    const signedIn = await resolveSignIn(app.db, {
      subject,
      email: invited.email,
      name: 'Test User',
      idToken: 'x',
    })
    expect(signedIn.userId).toBe(invited.id)
    const [row] = await owner.db.select().from(appUser).where(eq(appUser.id, invited.id))
    expect(row?.keycloakId).toBe(subject)
    expect(row?.status).toBe('active')

    await expect(
      resolveSignIn(app.db, {
        subject: `kc-${tag()}`,
        email: `nobody-${tag()}@example.test`,
        name: 'Nobody',
        idToken: 'x',
      }),
    ).rejects.toMatchObject({ code: 'not_registered' })

    const disabled = await makeUser('disabled')
    await expect(
      resolveSignIn(app.db, {
        subject: `kc-${tag()}`,
        email: disabled.email,
        name: 'Off',
        idToken: 'x',
      }),
    ).rejects.toMatchObject({ code: 'disabled' })
  })
})

describe('login callback', () => {
  const oidc = createOidc({
    // Unreachable on purpose: the state check must happen before any call to Keycloak.
    issuer: 'http://127.0.0.1:9/realms/none',
    clientId: 'duatf-web',
    clientSecret: 'not-a-real-secret-value',
    appUrl: 'http://127.0.0.1:53000',
  })
  const transaction = { state: 'expected', nonce: 'n', codeVerifier: 'v', returnTo: '/' }

  it('TC-C3.2-02 rejects a callback whose state does not match', async () => {
    const forged = new URLSearchParams({ code: 'abc', state: 'forged' })
    await expect(oidc.completeLogin(forged, transaction)).rejects.toBeInstanceOf(LoginError)
    await expect(oidc.completeLogin(forged, transaction)).rejects.toMatchObject({
      code: 'state_mismatch',
    })
    const missing = new URLSearchParams({ code: 'abc', state: 'expected' })
    await expect(oidc.completeLogin(missing, null)).rejects.toMatchObject({
      code: 'state_mismatch',
    })
  })

  it('keeps return paths on this site and survives cookie round trips', () => {
    expect(safeReturnTo('/clients/1')).toBe('/clients/1')
    expect(safeReturnTo('//evil.example')).toBe('/')
    expect(safeReturnTo('https://evil.example')).toBe('/')
    expect(safeReturnTo('/\\evil.example')).toBe('/')
    expect(decodeTransaction(encodeTransaction({ ...transaction, returnTo: '//x' }))).toEqual({
      ...transaction,
      returnTo: '/',
    })
    expect(decodeTransaction('not-json')).toBeNull()
  })

  it('generates one-time passwords with every character class', () => {
    const password = generateTemporaryPassword()
    expect(password).toHaveLength(16)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[^A-Za-z0-9]/)
  })
})

describe('client data isolation', () => {
  let owner: DatabaseHandle
  let app: DatabaseHandle
  const codes = [`CA${tag()}`.toUpperCase(), `CB${tag()}`.toUpperCase()]
  const ids: string[] = []

  beforeAll(async () => {
    owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
    app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
    for (const code of codes) {
      const [row] = await owner.db
        .insert(tenant)
        .values({ code, name: code })
        .returning({ id: tenant.id })
      ids.push(row?.id ?? '')
      await owner.db
        .insert(legalEntity)
        .values({ tenantId: row?.id ?? '', code: `ORG-${code}`, legalName: code })
    }
  })
  afterAll(async () => {
    await owner.db.execute(sql`delete from tenant where code in (${codes[0]}, ${codes[1]})`)
    await Promise.all([owner.close(), app.close()])
  })

  it("TC-C3.3-03 never shows a client user another client's rows", async () => {
    const [clientA, clientB] = ids as [string, string]
    const dpoOfA: Principal = {
      userId: 'u',
      email: 'dpo@example.test',
      displayName: 'DPO',
      assignments: [{ role: 'client_dpo', clientId: clientA, departmentId: null }],
    }
    const seen = await withTenants(app.db, tenantScope(dpoOfA), (tx) =>
      tx.select({ tenantId: legalEntity.tenantId }).from(legalEntity),
    )
    expect(new Set(seen.map((row) => row.tenantId))).toEqual(new Set([clientA]))

    const other = await withTenants(app.db, tenantScope(dpoOfA), (tx) =>
      tx.select().from(legalEntity).where(eq(legalEntity.tenantId, clientB)),
    )
    expect(other).toHaveLength(0)

    await expect(
      withTenants(app.db, tenantScope(dpoOfA), (tx) =>
        tx.insert(legalEntity).values({ tenantId: clientB, code: 'ORG-X', legalName: 'Sneaky' }),
      ),
    ).rejects.toThrow()

    const noClients = await withTenants(app.db, [], (tx) => tx.select().from(tenant))
    expect(noClients).toHaveLength(0)

    const firmWide: Principal = {
      ...dpoOfA,
      assignments: [{ role: 'lead_auditor', clientId: null, departmentId: null }],
    }
    const all = await withTenants(app.db, tenantScope(firmWide), (tx) =>
      tx.select({ id: tenant.id }).from(tenant),
    )
    expect(all.map((row) => row.id)).toEqual(expect.arrayContaining([clientA, clientB]))
  })
})
