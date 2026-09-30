import { randomInt } from 'node:crypto'

export class KeycloakError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'KeycloakError'
    this.status = status
  }
}

type TokenSource = () => Promise<string>

const requestToken = async (baseUrl: string, realm: string, form: Record<string, string>) => {
  const response = await fetch(`${baseUrl}/realms/${realm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form),
  })
  if (!response.ok) {
    throw new KeycloakError(response.status, `Keycloak token request failed (${response.status}).`)
  }
  return (await response.json()) as { access_token: string; expires_in: number }
}

/** Caches an access token until shortly before it expires. */
const cachedToken = (fetchToken: () => ReturnType<typeof requestToken>): TokenSource => {
  let token: { value: string; expiresAt: number } | undefined
  return async () => {
    if (token && token.expiresAt > Date.now()) return token.value
    const fresh = await fetchToken()
    token = { value: fresh.access_token, expiresAt: Date.now() + (fresh.expires_in - 30) * 1000 }
    return token.value
  }
}

/** Service-account token (client credentials) for the application's own admin client. */
export const clientCredentials = (
  baseUrl: string,
  realm: string,
  clientId: string,
  clientSecret: string,
): TokenSource =>
  cachedToken(() =>
    requestToken(baseUrl, realm, {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  )

/** Master-realm administrator token; for setup tooling only. */
export const masterAdmin = (baseUrl: string, username: string, password: string): TokenSource =>
  cachedToken(() =>
    requestToken(baseUrl, 'master', {
      grant_type: 'password',
      client_id: 'admin-cli',
      username,
      password,
    }),
  )

export type AdminResponse<T> = { status: number; location: string | null; data: T | null }

export type KeycloakAdmin = ReturnType<typeof createKeycloakAdmin>

/** Thin client for the Keycloak admin REST API (paths start after /admin). */
export const createKeycloakAdmin = (baseUrl: string, token: TokenSource) => {
  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    options: { allow404?: boolean } = {},
  ): Promise<AdminResponse<T>> => {
    const response = await fetch(`${baseUrl}/admin${path}`, {
      method,
      headers: {
        authorization: `Bearer ${await token()}`,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.status === 404 && options.allow404) {
      return { status: 404, location: null, data: null }
    }
    if (!response.ok) {
      const text = await response.text()
      throw new KeycloakError(
        response.status,
        `Keycloak ${method} ${path} failed (${response.status}): ${text.slice(0, 300)}`,
      )
    }
    const text = await response.text()
    return {
      status: response.status,
      location: response.headers.get('location'),
      data: text ? (JSON.parse(text) as T) : null,
    }
  }
  return { request }
}

export type KeycloakUser = {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
  enabled: boolean
  requiredActions?: string[]
}

export const findUserByEmail = async (
  admin: KeycloakAdmin,
  realm: string,
  email: string,
): Promise<KeycloakUser | null> => {
  const { data } = await admin.request<KeycloakUser[]>(
    'GET',
    `/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`,
  )
  return data?.[0] ?? null
}

/** Actions Keycloak forces at first sign-in: choose a password and enrol an authenticator app. */
export const FIRST_LOGIN_ACTIONS = ['UPDATE_PASSWORD', 'CONFIGURE_TOTP'] as const

const splitName = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/)
  return { firstName: parts[0] ?? displayName, lastName: parts.slice(1).join(' ') || '-' }
}

/**
 * Creates (or, when the email already exists, resets) a Keycloak user with a one-time password.
 * Returns the Keycloak user id.
 */
export const provisionUser = async (
  admin: KeycloakAdmin,
  realm: string,
  input: { email: string; displayName: string; temporaryPassword: string },
): Promise<string> => {
  const email = input.email.toLowerCase()
  const existing = await findUserByEmail(admin, realm, email)
  const representation = {
    username: email,
    email,
    emailVerified: true,
    enabled: true,
    ...splitName(input.displayName),
    requiredActions: [...FIRST_LOGIN_ACTIONS],
  }
  let id = existing?.id
  if (id) {
    await admin.request('PUT', `/realms/${realm}/users/${id}`, representation)
  } else {
    const created = await admin.request('POST', `/realms/${realm}/users`, representation)
    id = created.location?.split('/').pop()
    if (!id) throw new KeycloakError(500, 'Keycloak did not return the new user id.')
  }
  await admin.request('PUT', `/realms/${realm}/users/${id}/reset-password`, {
    type: 'password',
    value: input.temporaryPassword,
    temporary: true,
  })
  return id
}

export const setUserEnabled = async (
  admin: KeycloakAdmin,
  realm: string,
  keycloakId: string,
  enabled: boolean,
): Promise<void> => {
  await admin.request('PUT', `/realms/${realm}/users/${keycloakId}`, { enabled })
}

const ALPHABETS = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnopqrstuvwxyz',
  '23456789',
  '!@#$%^&*-_=+?',
] as const

/** A 16-character one-time password that satisfies the realm policy (all four character classes). */
export const generateTemporaryPassword = (length = 16): string => {
  const all = ALPHABETS.join('')
  const pick = (alphabet: string) => alphabet[randomInt(alphabet.length)] ?? 'x'
  const chars = [...ALPHABETS.map(pick), ...Array.from({ length: length - 4 }, () => pick(all))]
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1)
    ;[chars[index], chars[swap]] = [chars[swap] ?? '', chars[index] ?? '']
  }
  return chars.join('')
}
