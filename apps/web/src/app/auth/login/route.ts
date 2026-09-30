import { encodeTransaction, LOGIN_COOKIE } from '@duatf/platform-identity'
import { NextResponse, type NextRequest } from 'next/server'
import { cookieSecure, oidc } from '@/server/auth'
import { env } from '@/server/runtime'

export const dynamic = 'force-dynamic'

/** Starts the Keycloak sign-in: remembers state, nonce and PKCE verifier in a short-lived cookie. */
export const GET = async (request: NextRequest) => {
  try {
    const { url, transaction } = await oidc().beginLogin(
      request.nextUrl.searchParams.get('next') ?? '/',
    )
    const response = NextResponse.redirect(url)
    response.cookies.set(LOGIN_COOKIE, encodeTransaction(transaction), {
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure(),
      path: '/auth',
      maxAge: 600,
    })
    return response
  } catch (error) {
    console.error('Sign-in could not start', error)
    return NextResponse.redirect(new URL('/login?error=provider_error', env().PUBLIC_WEB_URL))
  }
}
