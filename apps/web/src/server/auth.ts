import {
  can,
  CAPABILITIES,
  describeDenial,
  type AccessScope,
  type Capability,
  type Denial,
  type Principal,
} from '@duatf/core-access'
import {
  createOidc,
  findSessionUser,
  loadPrincipal,
  SESSION_COOKIE,
  type Oidc,
  type SessionUser,
} from '@duatf/platform-identity'
import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { database, env } from './runtime'

declare global {
  var duatfOidc: Oidc | undefined
}

export const oidc = (): Oidc => {
  if (!globalThis.duatfOidc) {
    const settings = env()
    globalThis.duatfOidc = createOidc({
      issuer: settings.OIDC_ISSUER,
      clientId: settings.OIDC_CLIENT_ID,
      clientSecret: settings.OIDC_CLIENT_SECRET,
      appUrl: settings.PUBLIC_WEB_URL,
    })
  }
  return globalThis.duatfOidc
}

/** Cookies are marked Secure only when the app is served over https. */
export const cookieSecure = () => env().PUBLIC_WEB_URL.startsWith('https://')

export type Session = { user: SessionUser; principal: Principal }

/** The signed-in user for this request (memoised per request), or null. */
export const currentSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const db = database().db
  const user = await findSessionUser(db, token)
  if (!user) return null
  return { user, principal: await loadPrincipal(db, user) }
})

const currentPath = async () => {
  const path = (await headers()).get('x-duatf-path')
  return path && path.startsWith('/') ? path : '/'
}

/** Sends anonymous visitors to the sign-in page and returns the session otherwise. */
export const requireSession = async (): Promise<Session> => {
  const session = await currentSession()
  if (!session) redirect(`/login?next=${encodeURIComponent(await currentPath())}`)
  return session
}

/**
 * Requires a capability. Outside the user's scope the page answers "not found", so the
 * existence of another client's records is not revealed.
 */
export const requireCapability = async (
  capability: Capability,
  scope: AccessScope = {},
): Promise<Session> => {
  const session = await requireSession()
  if (!can(session.principal, capability, scope)) notFound()
  return session
}

/**
 * For pages that explain a refusal instead of hiding it: null when the user may do it, the
 * explanation when they may not. Someone who cannot see the client at all still gets "not found".
 */
export const permissionFor = async (
  capability: Capability,
  scope: AccessScope = {},
): Promise<{ session: Session; denial: Denial | null }> => {
  const session = await requireSession()
  if (can(session.principal, capability, scope)) return { session, denial: null }
  const clientScoped = CAPABILITIES[capability].scope !== 'firm'
  if (clientScoped && !can(session.principal, 'client.view', { clientId: scope.clientId })) {
    notFound()
  }
  return { session, denial: describeDenial(session.principal, capability, scope) }
}
