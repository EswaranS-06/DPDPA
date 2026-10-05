import { createHash, randomBytes } from 'node:crypto'
import { and, appUser, eq, gt, isNull, userSession, type Executor } from '@duatf/platform-db'

export const SESSION_COOKIE = 'duatf_session'

/** The browser keeps the token; the database keeps only its SHA-256. */
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export type NewSession = {
  userId: string
  ttlHours: number
  ipAddress?: string | null
  userAgent?: string | null
  now?: Date
}

export const createSession = async (
  db: Executor,
  input: NewSession,
): Promise<{ token: string; expiresAt: Date }> => {
  const token = randomBytes(32).toString('base64url')
  const now = input.now ?? new Date()
  const expiresAt = new Date(now.getTime() + input.ttlHours * 3_600_000)
  await db.insert(userSession).values({
    id: hashToken(token),
    userId: input.userId,
    createdAt: now,
    expiresAt,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent?.slice(0, 400) ?? null,
  })
  return { token, expiresAt }
}

export type SessionUser = {
  sessionId: string
  userId: string
  /** The sign-in name. */
  username: string
  displayName: string
  kind: 'firm' | 'client'
  /** True until the one-time password has been replaced. */
  mustChangePassword: boolean
  expiresAt: Date
}

/**
 * The signed-in user for a session token, or null when the session is unknown, expired or
 * revoked, or the person is disabled or no longer allowed to sign in.
 */
export const findSessionUser = async (
  db: Executor,
  token: string,
  now: Date = new Date(),
): Promise<SessionUser | null> => {
  const [row] = await db
    .select({
      sessionId: userSession.id,
      expiresAt: userSession.expiresAt,
      userId: appUser.id,
      username: appUser.username,
      displayName: appUser.displayName,
      kind: appUser.kind,
      mustChangePassword: appUser.mustChangePassword,
    })
    .from(userSession)
    .innerJoin(appUser, eq(appUser.id, userSession.userId))
    .where(
      and(
        eq(userSession.id, hashToken(token)),
        isNull(userSession.revokedAt),
        gt(userSession.expiresAt, now),
        eq(appUser.status, 'active'),
        eq(appUser.loginEnabled, true),
      ),
    )
    .limit(1)
  return row?.username ? { ...row, username: row.username } : null
}

/** Revokes a session. */
export const revokeSession = async (db: Executor, token: string): Promise<void> => {
  await db
    .update(userSession)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSession.id, hashToken(token)), isNull(userSession.revokedAt)))
}

/** Revokes every open session of a user (used when access is removed). */
export const revokeUserSessions = async (db: Executor, userId: string): Promise<void> => {
  await db
    .update(userSession)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSession.userId, userId), isNull(userSession.revokedAt)))
}
