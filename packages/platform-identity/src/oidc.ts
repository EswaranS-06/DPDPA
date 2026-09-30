import * as client from 'openid-client'

export const LOGIN_COOKIE = 'duatf_login'

export type OidcSettings = {
  issuer: string
  clientId: string
  clientSecret: string
  /** Public URL of the web app, e.g. http://192.168.0.110:53000 */
  appUrl: string
}

/** What the browser keeps (in a short-lived cookie) between leaving for Keycloak and coming back. */
export type LoginTransaction = {
  state: string
  nonce: string
  codeVerifier: string
  returnTo: string
}

export type IdentityClaims = {
  subject: string
  email: string
  name: string
  idToken: string
}

export type LoginErrorCode =
  'state_mismatch' | 'provider_error' | 'missing_email' | 'not_registered' | 'disabled'

export class LoginError extends Error {
  readonly code: LoginErrorCode

  constructor(code: LoginErrorCode, message: string) {
    super(message)
    this.name = 'LoginError'
    this.code = code
  }
}

/** Only same-site relative paths, so the login flow cannot be used as an open redirect. */
export const safeReturnTo = (value: string | null | undefined): string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\')
    ? value
    : '/'

export const encodeTransaction = (transaction: LoginTransaction): string =>
  Buffer.from(JSON.stringify(transaction)).toString('base64url')

export const decodeTransaction = (value: string | undefined): LoginTransaction | null => {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >
    const { state, nonce, codeVerifier, returnTo } = parsed
    if (
      typeof state !== 'string' ||
      typeof nonce !== 'string' ||
      typeof codeVerifier !== 'string' ||
      typeof returnTo !== 'string'
    ) {
      return null
    }
    return { state, nonce, codeVerifier, returnTo: safeReturnTo(returnTo) }
  } catch {
    return null
  }
}

export type Oidc = ReturnType<typeof createOidc>

/** Authorization code flow with PKCE (S256), state and nonce against the Keycloak realm. */
export const createOidc = (settings: OidcSettings) => {
  const redirectUri = `${settings.appUrl}/auth/callback`
  let discovered: Promise<client.Configuration> | undefined

  const configuration = () => {
    discovered ??= client
      .discovery(
        new URL(settings.issuer),
        settings.clientId,
        settings.clientSecret,
        undefined,
        // The LAN deployment serves Keycloak over plain http.
        settings.issuer.startsWith('http://')
          ? { execute: [client.allowInsecureRequests] }
          : undefined,
      )
      .catch((error: unknown) => {
        discovered = undefined
        throw error
      })
    return discovered
  }

  const beginLogin = async (
    returnTo: string,
  ): Promise<{ url: URL; transaction: LoginTransaction }> => {
    const config = await configuration()
    const transaction: LoginTransaction = {
      state: client.randomState(),
      nonce: client.randomNonce(),
      codeVerifier: client.randomPKCECodeVerifier(),
      returnTo: safeReturnTo(returnTo),
    }
    const url = client.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      response_type: 'code',
      state: transaction.state,
      nonce: transaction.nonce,
      code_challenge: await client.calculatePKCECodeChallenge(transaction.codeVerifier),
      code_challenge_method: 'S256',
    })
    return { url, transaction }
  }

  /** Exchanges the code for tokens. The state is checked first, before any call to Keycloak. */
  const completeLogin = async (
    params: URLSearchParams,
    transaction: LoginTransaction | null,
  ): Promise<IdentityClaims> => {
    if (params.has('error')) {
      throw new LoginError('provider_error', params.get('error_description') ?? 'Sign-in failed.')
    }
    if (!transaction || !params.get('state') || params.get('state') !== transaction.state) {
      throw new LoginError('state_mismatch', 'The sign-in request did not match. Please try again.')
    }
    const config = await configuration()
    const callbackUrl = new URL(redirectUri)
    callbackUrl.search = params.toString()
    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: transaction.codeVerifier,
      expectedState: transaction.state,
      expectedNonce: transaction.nonce,
      idTokenExpected: true,
    })
    const claims = tokens.claims()
    const email = typeof claims?.email === 'string' ? claims.email.toLowerCase() : ''
    if (!claims || !email || !tokens.id_token) {
      throw new LoginError('missing_email', 'Your Keycloak account has no email address.')
    }
    const name =
      typeof claims.name === 'string' && claims.name.trim() !== '' ? claims.name.trim() : email
    return { subject: claims.sub, email, name, idToken: tokens.id_token }
  }

  const logoutUrl = async (idToken: string | null): Promise<URL> => {
    const config = await configuration()
    return client.buildEndSessionUrl(config, {
      post_logout_redirect_uri: `${settings.appUrl}/login?status=signed_out`,
      client_id: settings.clientId,
      ...(idToken ? { id_token_hint: idToken } : {}),
    })
  }

  return { beginLogin, completeLogin, logoutUrl, redirectUri }
}
