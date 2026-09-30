import { NextResponse, type NextRequest } from 'next/server'

/** Passes the requested path to server components so sign-in can return the user to it. */
export const proxy = (request: NextRequest) => {
  const headers = new Headers(request.headers)
  headers.set('x-duatf-path', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/|fonts/|favicon.ico|auth/|api/).*)'],
}
