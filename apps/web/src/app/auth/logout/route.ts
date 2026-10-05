import { appendAudit } from '@duatf/platform-db'
import { findSessionUser, revokeSession, SESSION_COOKIE } from '@duatf/platform-identity'
import { NextResponse, type NextRequest } from 'next/server'
import { database, env } from '@/server/runtime'

export const dynamic = 'force-dynamic'

/** Ends the session. POST only, so links cannot sign people out. */
export const POST = async (request: NextRequest) => {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    const db = database().db
    const user = await findSessionUser(db, token)
    await db.transaction(async (tx) => {
      await revokeSession(tx, token)
      if (user) {
        await appendAudit(tx, {
          actorUserId: user.userId,
          tenantId: null,
          action: 'auth.sign_out',
          entity: 'app_user',
          entityId: user.userId,
        })
      }
    })
  }
  const response = NextResponse.redirect(
    new URL('/login?status=signed_out', env().PUBLIC_WEB_URL),
    303,
  )
  response.cookies.delete({ name: SESSION_COOKIE, path: '/' })
  return response
}
