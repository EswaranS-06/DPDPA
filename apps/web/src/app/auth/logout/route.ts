import { appendAudit } from '@duatf/platform-db'
import { findSessionUser, revokeSession, SESSION_COOKIE } from '@duatf/platform-identity'
import { NextResponse, type NextRequest } from 'next/server'
import { oidc } from '@/server/auth'
import { database, env } from '@/server/runtime'

export const dynamic = 'force-dynamic'

/** Ends the DUATF session, then the Keycloak session. POST only, so links cannot sign people out. */
export const POST = async (request: NextRequest) => {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  let idToken: string | null = null
  if (token) {
    const db = database().db
    const user = await findSessionUser(db, token)
    idToken = await db.transaction(async (tx) => {
      const kept = await revokeSession(tx, token)
      if (user) {
        await appendAudit(tx, {
          actorUserId: user.userId,
          tenantId: null,
          action: 'auth.sign_out',
          entity: 'app_user',
          entityId: user.userId,
        })
      }
      return kept
    })
  }
  let target: URL
  try {
    target = await oidc().logoutUrl(idToken)
  } catch {
    target = new URL('/login?status=signed_out', env().PUBLIC_WEB_URL)
  }
  const response = NextResponse.redirect(target, 303)
  response.cookies.delete({ name: SESSION_COOKIE, path: '/' })
  return response
}
