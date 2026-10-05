import { randomBytes } from 'node:crypto'
import type { Principal } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  appUser,
  createDatabase,
  eq,
  inArray,
  legalEntity,
  roleAssignment,
  sql,
  tenant,
  userSession,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateOneTimePassword, hashPassword, passwordProblem, verifyPassword } from './password'
import { loadPrincipal, tenantScope } from './principal'
import { safeReturnTo } from './returnTo'
import { createSession, findSessionUser, hashToken, revokeSession } from './sessions'
import {
  changePassword,
  issueLogin,
  LOCK_MINUTES,
  LoginError,
  MAX_FAILED_LOGINS,
  revokeLogin,
  setupAccount,
  signInWithPassword,
  UsernameTakenError,
  type PasswordChangeError,
} from './signIn'

const env = parseEnv(testDatabaseEnvSchema)
const tag = () => randomBytes(4).toString('hex')

describe('sign-in, sessions and passwords', () => {
  let owner: DatabaseHandle
  let app: DatabaseHandle
  const userIds: string[] = []

  /** A person, with a login when a username is given. Returns the one-time password too. */
  const makeUser = async (options: { username?: string; status?: 'active' | 'disabled' } = {}) => {
    const [row] = await owner.db
      .insert(appUser)
      .values({ displayName: 'Test User', kind: 'firm', status: options.status ?? 'active' })
      .returning({ id: appUser.id })
    const id = row?.id ?? ''
    userIds.push(id)
    const password = options.username
      ? await owner.db.transaction((tx) =>
          issueLogin(tx, { userId: id, username: options.username ?? '', actorUserId: null }),
        )
      : ''
    return { id, username: options.username ?? '', password }
  }

  beforeAll(() => {
    owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
    app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  })
  afterAll(async () => {
    if (userIds.length) await owner.db.delete(appUser).where(inArray(appUser.id, userIds))
    await Promise.all([owner.close(), app.close()])
  })

  it('TC-C3.2-01 stores only token hashes and refuses expired or revoked sessions', async () => {
    const user = await makeUser({ username: `sess-${tag()}` })
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

    // Neither a disabled person nor a person without a login keeps a session.
    const disabled = await makeUser({ username: `off-${tag()}`, status: 'disabled' })
    const second = await createSession(app.db, { userId: disabled.id, ttlHours: 1 })
    expect(await findSessionUser(app.db, second.token)).toBeNull()
    const noLogin = await makeUser()
    const third = await createSession(app.db, { userId: noLogin.id, ttlHours: 1 })
    expect(await findSessionUser(app.db, third.token)).toBeNull()
  })

  it('TC-C3.2-02 signs in only with the right password of an enabled login, and locks after repeated failures', async () => {
    const username = `it-head-${tag()}`
    const user = await makeUser({ username })
    expect(user.password).toMatch(/^[A-Za-z0-9]{20}$/)

    // Usernames are not case-sensitive; the first sign-in must change the password.
    const signedIn = await signInWithPassword(app.db, {
      username: `  ${username.toUpperCase()} `,
      password: user.password,
    })
    expect(signedIn).toMatchObject({ userId: user.id, username, mustChangePassword: true })

    // A wrong password and an unknown name give the same answer.
    const wrong = await signInWithPassword(app.db, {
      username,
      password: 'not the password',
    }).catch((error: unknown) => error)
    const unknown = await signInWithPassword(app.db, {
      username: `nobody-${tag()}`,
      password: user.password,
    }).catch((error: unknown) => error)
    expect(wrong).toBeInstanceOf(LoginError)
    expect([(wrong as LoginError).code, (wrong as LoginError).message]).toEqual([
      (unknown as LoginError).code,
      (unknown as LoginError).message,
    ])

    // Five failures in a row lock the account, even for the right password, for 15 minutes.
    for (let attempt = 1; attempt < MAX_FAILED_LOGINS; attempt += 1) {
      await expect(
        signInWithPassword(app.db, { username, password: `wrong ${attempt}` }),
      ).rejects.toMatchObject({ code: 'invalid' })
    }
    await expect(
      signInWithPassword(app.db, { username, password: user.password }),
    ).rejects.toMatchObject({ code: 'locked' })
    const afterLock = new Date(Date.now() + (LOCK_MINUTES + 1) * 60_000)
    expect(
      (await signInWithPassword(app.db, { username, password: user.password, now: afterLock }))
        .userId,
    ).toBe(user.id)

    // A disabled person is told so only once the password is right.
    await owner.db.update(appUser).set({ status: 'disabled' }).where(eq(appUser.id, user.id))
    await expect(
      signInWithPassword(app.db, { username, password: user.password }),
    ).rejects.toMatchObject({ code: 'disabled' })
    await owner.db.update(appUser).set({ status: 'active' }).where(eq(appUser.id, user.id))

    // Revoking the login ends sessions and sign-in; the person stays.
    const { token } = await createSession(app.db, { userId: user.id, ttlHours: 1 })
    await owner.db.transaction((tx) => revokeLogin(tx, { userId: user.id, actorUserId: null }))
    expect(await findSessionUser(app.db, token)).toBeNull()
    await expect(
      signInWithPassword(app.db, { username, password: user.password }),
    ).rejects.toMatchObject({ code: 'invalid' })
    const [kept] = await owner.db.select().from(appUser).where(eq(appUser.id, user.id))
    expect([kept?.loginEnabled, kept?.passwordHash, kept?.username]).toEqual([
      false,
      null,
      username,
    ])

    // A username belongs to one person.
    const other = await makeUser()
    await expect(
      owner.db.transaction((tx) =>
        issueLogin(tx, { userId: other.id, username, actorUserId: null }),
      ),
    ).rejects.toBeInstanceOf(UsernameTakenError)
  })

  it('changes the password only with the current one, and signs out the other sessions', async () => {
    const username = `change-${tag()}`
    const user = await makeUser({ username })
    const kept = await createSession(app.db, { userId: user.id, ttlHours: 1 })
    const elsewhere = await createSession(app.db, { userId: user.id, ttlHours: 1 })
    const change = (input: { current: string; next: string; confirm?: string }) =>
      changePassword(app.db, {
        userId: user.id,
        sessionId: hashToken(kept.token),
        current: input.current,
        next: input.next,
        confirm: input.confirm ?? input.next,
      }).catch((error: unknown) => error)

    const fields = async (input: { current: string; next: string; confirm?: string }) =>
      Object.keys(((await change(input)) as PasswordChangeError).fieldErrors)
    expect(await fields({ current: 'not it at all', next: 'Harbour lights 2026' })).toEqual([
      'current',
    ])
    expect(await fields({ current: user.password, next: 'short' })).toEqual(['next'])
    expect(await fields({ current: user.password, next: `${username} secret 99` })).toEqual([
      'next',
    ])
    expect(
      await fields({
        current: user.password,
        next: 'Harbour lights 2026',
        confirm: 'Harbour lights 2027',
      }),
    ).toEqual(['confirm'])

    expect(await change({ current: user.password, next: 'Harbour lights 2026' })).toBeUndefined()
    expect((await findSessionUser(app.db, kept.token))?.mustChangePassword).toBe(false)
    expect(await findSessionUser(app.db, elsewhere.token)).toBeNull()
    expect(
      (await signInWithPassword(app.db, { username, password: 'Harbour lights 2026' }))
        .mustChangePassword,
    ).toBe(false)
  })

  it('sets up the first administrator from the server, and resets their login when run again', async () => {
    const username = `admin-${tag()}`
    const first = await setupAccount(owner.db, { username, displayName: 'Senior Auditor' })
    userIds.push(first.userId)
    expect(first.created).toBe(true)
    const principal = await loadPrincipal(app.db, {
      userId: first.userId,
      username,
      displayName: 'Senior Auditor',
    })
    expect(principal.assignments).toEqual([
      { role: 'firm_admin', clientId: null, departmentId: null },
    ])
    const again = await setupAccount(owner.db, { username, displayName: 'Senior Auditor' })
    expect([again.userId, again.created]).toEqual([first.userId, false])
    expect(again.oneTimePassword).not.toBe(first.oneTimePassword)
    await expect(
      signInWithPassword(app.db, { username, password: first.oneTimePassword }),
    ).rejects.toBeInstanceOf(LoginError)
    expect(
      (await signInWithPassword(app.db, { username, password: again.oneTimePassword })).userId,
    ).toBe(first.userId)
    const roles = await owner.db
      .select({ role: roleAssignment.role })
      .from(roleAssignment)
      .where(eq(roleAssignment.userId, first.userId))
    expect(roles).toEqual([{ role: 'firm_admin' }])
  })

  it('hashes passwords with scrypt and a fresh salt, and judges new passwords', async () => {
    const hash = await hashPassword('Harbour lights 2026')
    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$[\w-]+\$[\w-]+$/)
    expect(await hashPassword('Harbour lights 2026')).not.toBe(hash)
    expect(await verifyPassword('Harbour lights 2026', hash)).toBe(true)
    expect(await verifyPassword('harbour lights 2026', hash)).toBe(false)
    expect(await verifyPassword('anything', 'md5$abc')).toBe(false)

    expect(passwordProblem('Harbour lights 2026', 'it-head')).toBeNull()
    expect(passwordProblem('short', 'it-head')).toMatch(/at least 12/)
    expect(passwordProblem('my it-head password', 'it-head')).toMatch(/username/)
    expect(passwordProblem('aaaaaaaaaaaaaaaa', 'it-head')).toMatch(/repetitive/)

    const seen = new Set(Array.from({ length: 50 }, () => generateOneTimePassword()))
    expect(seen.size).toBe(50)
    for (const password of seen) expect(password).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{20}$/)
  })

  it('keeps return paths on this site', () => {
    expect(safeReturnTo('/clients/1')).toBe('/clients/1')
    expect(safeReturnTo('//evil.example')).toBe('/')
    expect(safeReturnTo('https://evil.example')).toBe('/')
    expect(safeReturnTo('/\\evil.example')).toBe('/')
    expect(safeReturnTo(undefined)).toBe('/')
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
      email: 'dpo',
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
