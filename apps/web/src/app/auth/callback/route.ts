import {
  createSession,
  decodeTransaction,
  LOGIN_COOKIE,
  LoginError,
  resolveSignIn,
  SESSION_COOKIE,
} from '@duatf/platform-identity'
import { NextResponse, type NextRequest } from 'next/server'
import { cookieSecure, oidc } from '@/server/auth'
import { database, env } from '@/server/runtime'

export const dynamic = 'force-dynamic'

const clientAddress = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

/** Finishes the Keycloak sign-in and opens a server-side session. */
export const GET = async (request: NextRequest) => {
  const settings = env()
  const transaction = decodeTransaction(request.cookies.get(LOGIN_COOKIE)?.value)
  const fail = (code: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${code}`, settings.PUBLIC_WEB_URL))
    response.cookies.delete({ name: LOGIN_COOKIE, path: '/auth' })
    return response
  }
  try {
    const claims = await oidc().completeLogin(request.nextUrl.searchParams, transaction)
    const db = database().db
    const user = await resolveSignIn(db, claims)
    const session = await createSession(db, {
      userId: user.userId,
      ttlHours: settings.SESSION_TTL_HOURS,
      ipAddress: clientAddress(request),
      userAgent: request.headers.get('user-agent'),
      idToken: claims.idToken,
    })
    const response = NextResponse.redirect(
      new URL(transaction?.returnTo ?? '/', settings.PUBLIC_WEB_URL),
    )
    response.cookies.delete({ name: LOGIN_COOKIE, path: '/auth' })
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure(),
      path: '/',
      expires: session.expiresAt,
    })
    return response
  } catch (error) {
    if (error instanceof LoginError) return fail(error.code)
    console.error('Sign-in callback failed', error)
    return fail('provider_error')
  }
}
