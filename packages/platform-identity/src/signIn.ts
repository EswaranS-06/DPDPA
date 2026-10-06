import {
  and,
  appendAudit,
  appUser,
  eq,
  isNull,
  ne,
  roleAssignment,
  userSession,
  type Database,
  type Executor,
} from '@duatf/platform-db'
import {
  decoyHash,
  generateOneTimePassword,
  hashPassword,
  passwordProblem,
  verifyPassword,
} from './password'

// Sign-in for the self-audit edition: a username and password on DUATF's own sign-in page.
// Only people whose login is enabled can sign in; repeated failures lock the account for a while.

export type LoginErrorCode = 'invalid' | 'locked' | 'disabled'

export class LoginError extends Error {
  readonly code: LoginErrorCode

  constructor(code: LoginErrorCode, message: string) {
    super(message)
    this.name = 'LoginError'
    this.code = code
  }
}

export const MAX_FAILED_LOGINS = 5
export const LOCK_MINUTES = 15

export const normaliseUsername = (username: string) => username.trim().toLowerCase()

/** A valid username: 2 to 64 letters, digits, dots, dashes, underscores or @. */
export const isValidUsername = (username: string) =>
  /^[a-z0-9][a-z0-9._@-]{1,63}$/.test(normaliseUsername(username))

export type SignedInUser = {
  userId: string
  username: string
  displayName: string
  mustChangePassword: boolean
}

const INVALID = 'Incorrect username or password.'

/**
 * Checks a username and password. Unknown names take as long as wrong passwords. After
 * MAX_FAILED_LOGINS failures in a row the account is locked for LOCK_MINUTES.
 */
export const signInWithPassword = async (
  db: Database,
  input: { username: string; password: string; now?: Date },
): Promise<SignedInUser> => {
  const now = input.now ?? new Date()
  const [user] = await db
    .select()
    .from(appUser)
    .where(eq(appUser.username, normaliseUsername(input.username)))
    .limit(1)
  if (!user?.passwordHash || !user.loginEnabled || !user.username) {
    await verifyPassword(input.password, await decoyHash())
    throw new LoginError('invalid', INVALID)
  }
  if (user.lockedUntil && user.lockedUntil > now) {
    throw new LoginError(
      'locked',
      `Too many attempts. Try again after ${user.lockedUntil.toISOString().slice(11, 16)} UTC.`,
    )
  }
  const matches = await verifyPassword(input.password, user.passwordHash)
  if (matches && user.status === 'disabled') {
    throw new LoginError('disabled', 'This account has been disabled.')
  }
  const username = user.username
  const result = await db.transaction(async (tx) => {
    if (!matches) {
      const failures = user.failedLogins + 1
      const locking = failures >= MAX_FAILED_LOGINS
      await tx
        .update(appUser)
        .set({
          failedLogins: locking ? 0 : failures,
          lockedUntil: locking ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : null,
        })
        .where(eq(appUser.id, user.id))
      await appendAudit(tx, {
        actorUserId: null,
        tenantId: null,
        action: locking ? 'auth.locked' : 'auth.sign_in_failed',
        entity: 'app_user',
        entityId: user.id,
        detail: { failures },
      })
      // Returned, not thrown, so the failure count is committed.
      return null
    }
    await tx
      .update(appUser)
      .set({ failedLogins: 0, lockedUntil: null, lastLoginAt: now })
      .where(eq(appUser.id, user.id))
    await appendAudit(tx, {
      actorUserId: user.id,
      tenantId: null,
      action: 'auth.sign_in',
      entity: 'app_user',
      entityId: user.id,
    })
    return {
      userId: user.id,
      username,
      displayName: user.displayName,
      mustChangePassword: user.mustChangePassword,
    }
  })
  if (!result) throw new LoginError('invalid', INVALID)
  return result
}

/** Problems with a password change, by form field. */
export class PasswordChangeError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('The password was not changed.')
    this.name = 'PasswordChangeError'
    this.fieldErrors = fieldErrors
  }
}

/**
 * Changes the password after checking the current one. Every other session of the account is
 * signed out.
 */
export const changePassword = async (
  db: Database,
  input: {
    userId: string
    sessionId: string
    current: string
    next: string
    confirm: string
  },
): Promise<void> => {
  const [user] = await db.select().from(appUser).where(eq(appUser.id, input.userId))
  if (!user?.passwordHash) throw new PasswordChangeError({ current: 'Account not found.' })
  if (!(await verifyPassword(input.current, user.passwordHash))) {
    throw new PasswordChangeError({ current: 'The current password is not right.' })
  }
  const problem = passwordProblem(input.next, user.username ?? '')
  if (problem) throw new PasswordChangeError({ next: problem })
  if (input.next !== input.confirm) {
    throw new PasswordChangeError({ confirm: 'The two new passwords are not the same.' })
  }
  if (input.next === input.current) {
    throw new PasswordChangeError({ next: 'Choose a password you have not just used.' })
  }
  const hash = await hashPassword(input.next)
  await db.transaction(async (tx) => {
    await tx
      .update(appUser)
      .set({ passwordHash: hash, mustChangePassword: false, passwordChangedAt: new Date() })
      .where(eq(appUser.id, input.userId))
    await tx
      .update(userSession)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(userSession.userId, input.userId),
          ne(userSession.id, input.sessionId),
          isNull(userSession.revokedAt),
        ),
      )
    await appendAudit(tx, {
      actorUserId: input.userId,
      tenantId: null,
      action: 'auth.password_change',
      entity: 'app_user',
      entityId: input.userId,
    })
  })
}

const revokeAll = (tx: Executor, userId: string) =>
  tx
    .update(userSession)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSession.userId, userId), isNull(userSession.revokedAt)))

export class UsernameTakenError extends Error {
  constructor(username: string) {
    super(`The username ${username} is taken.`)
    this.name = 'UsernameTakenError'
  }
}

/**
 * Lets a person sign in (or resets their password): the username, a one-time password to be
 * changed at first sign-in, the lock cleared and any open session signed out. Returns the
 * one-time password, which is shown once and never stored. Call it inside a transaction: the
 * audit chain's lock lasts only as long as the transaction.
 */
export const issueLogin = async (
  tx: Executor,
  input: { userId: string; username: string; actorUserId: string | null },
): Promise<string> => {
  const username = normaliseUsername(input.username)
  if (!isValidUsername(username)) {
    throw new Error('Use 2 to 64 letters, digits, dots, dashes, underscores or @ for the username.')
  }
  const [taken] = await tx
    .select({ id: appUser.id })
    .from(appUser)
    .where(and(eq(appUser.username, username), ne(appUser.id, input.userId)))
  if (taken) throw new UsernameTakenError(username)
  const oneTimePassword = generateOneTimePassword()
  await tx
    .update(appUser)
    .set({
      username,
      loginEnabled: true,
      passwordHash: await hashPassword(oneTimePassword),
      mustChangePassword: true,
      passwordChangedAt: new Date(),
      failedLogins: 0,
      lockedUntil: null,
    })
    .where(eq(appUser.id, input.userId))
  await revokeAll(tx, input.userId)
  await appendAudit(tx, {
    actorUserId: input.actorUserId,
    tenantId: null,
    action: 'auth.login_issue',
    entity: 'app_user',
    entityId: input.userId,
    detail: { username },
  })
  return oneTimePassword
}

/** Stops a person from signing in and ends their sessions; they stay assignable. Call it inside a transaction. */
export const revokeLogin = async (
  tx: Executor,
  input: { userId: string; actorUserId: string | null },
): Promise<void> => {
  await tx
    .update(appUser)
    .set({ loginEnabled: false, passwordHash: null, mustChangePassword: true })
    .where(eq(appUser.id, input.userId))
  await revokeAll(tx, input.userId)
  await appendAudit(tx, {
    actorUserId: input.actorUserId,
    tenantId: null,
    action: 'auth.login_revoke',
    entity: 'app_user',
    entityId: input.userId,
  })
}

/**
 * Creates the first administrator, or resets an administrator's login: used by the set-up
 * command on the server (pnpm account:setup). Returns the one-time password.
 */
export const setupAccount = async (
  db: Database,
  input: { username: string; displayName: string },
): Promise<{ userId: string; oneTimePassword: string; created: boolean }> => {
  const username = normaliseUsername(input.username)
  if (!isValidUsername(username)) {
    throw new Error('Use 2 to 64 letters, digits, dots, dashes, underscores or @ for the username.')
  }
  const displayName = input.displayName.trim()
  if (displayName.length < 2) throw new Error('Give the name to show in the app.')
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(appUser).where(eq(appUser.username, username))
    let userId = existing?.id ?? ''
    if (existing) {
      await tx
        .update(appUser)
        .set({ displayName, status: 'active', kind: 'firm' })
        .where(eq(appUser.id, existing.id))
    } else {
      const [created] = await tx
        .insert(appUser)
        .values({ username, displayName, kind: 'firm', status: 'active' })
        .returning({ id: appUser.id })
      userId = created?.id ?? ''
    }
    const [admin] = await tx
      .select({ id: roleAssignment.id })
      .from(roleAssignment)
      .where(
        and(
          eq(roleAssignment.userId, userId),
          eq(roleAssignment.role, 'firm_admin'),
          isNull(roleAssignment.tenantId),
        ),
      )
    if (!admin) await tx.insert(roleAssignment).values({ userId, role: 'firm_admin' })
    const oneTimePassword = await issueLogin(tx, { userId, username, actorUserId: null })
    return { userId, oneTimePassword, created: !existing }
  })
}
