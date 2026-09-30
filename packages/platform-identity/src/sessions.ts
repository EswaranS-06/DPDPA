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
  idToken?: string | null
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
    idToken: input.idToken ?? null,
  })
  return { token, expiresAt }
}

export type SessionUser = {
  sessionId: string
  userId: string
  email: string
  displayName: string
  kind: 'firm' | 'client'
  expiresAt: Date
}

/** The signed-in user for a session token, or null when the session is unknown, expired, revoked or the user is disabled. */
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
      email: appUser.email,
      displayName: appUser.displayName,
      kind: appUser.kind,
    })
    .from(userSession)
    .innerJoin(appUser, eq(appUser.id, userSession.userId))
    .where(
      and(
        eq(userSession.id, hashToken(token)),
        isNull(userSession.revokedAt),
        gt(userSession.expiresAt, now),
        eq(appUser.status, 'active'),
      ),
    )
    .limit(1)
  return row ?? null
}

/** Revokes a session; returns the ID token kept for the Keycloak logout, if any. */
export const revokeSession = async (db: Executor, token: string): Promise<string | null> => {
  const [row] = await db
    .update(userSession)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSession.id, hashToken(token)), isNull(userSession.revokedAt)))
    .returning({ idToken: userSession.idToken })
  return row?.idToken ?? null
}

/** Revokes every open session of a user (used when access is removed). */
export const revokeUserSessions = async (db: Executor, userId: string): Promise<void> => {
  await db
    .update(userSession)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSession.userId, userId), isNull(userSession.revokedAt)))
}
