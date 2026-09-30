import { FIRST_LOGIN_ACTIONS, type KeycloakAdmin } from '@duatf/platform-identity'

export type RealmSettings = {
  realm: string
  /** Public URL of the web app; used for redirect and logout URLs. */
  appUrl: string
  webClientId: string
  webClientSecret: string
  adminClientId: string
  adminClientSecret: string
}

// 12+ characters with all four character classes; no reuse of the last 5 passwords.
const PASSWORD_POLICY =
  'length(12) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1) and notUsername and notEmail and passwordHistory(5)'

const ADMIN_CLIENT_ROLES = ['manage-users', 'view-users', 'query-users']

const realmRepresentation = (settings: RealmSettings) => ({
  realm: settings.realm,
  enabled: true,
  displayName: 'DUATF',
  // Private LAN addresses may use http; anything else needs TLS.
  sslRequired: 'external',
  registrationAllowed: false,
  loginWithEmailAllowed: true,
  duplicateEmailsAllowed: false,
  resetPasswordAllowed: true,
  rememberMe: false,
  verifyEmail: false,
  editUsernameAllowed: false,
  bruteForceProtected: true,
  permanentLockout: false,
  failureFactor: 5,
  waitIncrementSeconds: 60,
  maxFailureWaitSeconds: 900,
  maxDeltaTimeSeconds: 43200,
  passwordPolicy: PASSWORD_POLICY,
  otpPolicyType: 'totp',
  otpPolicyAlgorithm: 'HmacSHA1',
  otpPolicyDigits: 6,
  otpPolicyPeriod: 30,
  accessTokenLifespan: 300,
  ssoSessionIdleTimeout: 1800,
  ssoSessionMaxLifespan: 43200,
  smtpServer: {
    host: 'mailpit',
    port: '1025',
    from: 'no-reply@duatf.local',
    fromDisplayName: 'DUATF',
  },
})

const webClient = (settings: RealmSettings) => ({
  clientId: settings.webClientId,
  name: 'DUATF web',
  enabled: true,
  protocol: 'openid-connect',
  publicClient: false,
  clientAuthenticatorType: 'client-secret',
  secret: settings.webClientSecret,
  standardFlowEnabled: true,
  implicitFlowEnabled: false,
  directAccessGrantsEnabled: false,
  serviceAccountsEnabled: false,
  frontchannelLogout: true,
  rootUrl: settings.appUrl,
  baseUrl: '/',
  redirectUris: [`${settings.appUrl}/auth/callback`],
  webOrigins: [settings.appUrl],
  attributes: {
    'pkce.code.challenge.method': 'S256',
    'post.logout.redirect.uris': `${settings.appUrl}/login*`,
  },
})

const adminClient = (settings: RealmSettings) => ({
  clientId: settings.adminClientId,
  name: 'DUATF user administration',
  enabled: true,
  protocol: 'openid-connect',
  publicClient: false,
  clientAuthenticatorType: 'client-secret',
  secret: settings.adminClientSecret,
  standardFlowEnabled: false,
  implicitFlowEnabled: false,
  directAccessGrantsEnabled: false,
  serviceAccountsEnabled: true,
})

type ClientRepresentation = { id: string; clientId: string } & Record<string, unknown>
type RoleRepresentation = { id: string; name: string } & Record<string, unknown>

const findClient = async (admin: KeycloakAdmin, realm: string, clientId: string) => {
  const { data } = await admin.request<ClientRepresentation[]>(
    'GET',
    `/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`,
  )
  return data?.[0] ?? null
}

/** Creates the client or brings it back to the desired configuration; returns its internal id. */
const ensureClient = async (
  admin: KeycloakAdmin,
  realm: string,
  desired: { clientId: string } & Record<string, unknown>,
): Promise<string> => {
  const existing = await findClient(admin, realm, desired.clientId)
  if (existing) {
    await admin.request('PUT', `/realms/${realm}/clients/${existing.id}`, {
      ...desired,
      id: existing.id,
    })
    return existing.id
  }
  await admin.request('POST', `/realms/${realm}/clients`, desired)
  const created = await findClient(admin, realm, desired.clientId)
  if (!created) throw new Error(`Client ${desired.clientId} was not created.`)
  return created.id
}

const grantUserManagement = async (admin: KeycloakAdmin, realm: string, clientUuid: string) => {
  const { data: serviceUser } = await admin.request<{ id: string }>(
    'GET',
    `/realms/${realm}/clients/${clientUuid}/service-account-user`,
  )
  const management = await findClient(admin, realm, 'realm-management')
  if (!serviceUser || !management) throw new Error('realm-management client not found.')
  const roles: RoleRepresentation[] = []
  for (const name of ADMIN_CLIENT_ROLES) {
    const { data } = await admin.request<RoleRepresentation>(
      'GET',
      `/realms/${realm}/clients/${management.id}/roles/${name}`,
    )
    if (data) roles.push(data)
  }
  await admin.request(
    'POST',
    `/realms/${realm}/users/${serviceUser.id}/role-mappings/clients/${management.id}`,
    roles,
  )
}

const ensureRequiredActionsEnabled = async (admin: KeycloakAdmin, realm: string) => {
  for (const alias of FIRST_LOGIN_ACTIONS) {
    const { data } = await admin.request<Record<string, unknown>>(
      'GET',
      `/realms/${realm}/authentication/required-actions/${alias}`,
    )
    if (data && data.enabled !== true) {
      await admin.request('PUT', `/realms/${realm}/authentication/required-actions/${alias}`, {
        ...data,
        enabled: true,
      })
    }
  }
}

/**
 * Idempotently creates or updates the realm: password policy, brute-force protection, TOTP,
 * mail through Mailpit, the web client (code flow + PKCE) and the user-administration client.
 */
export const ensureRealm = async (admin: KeycloakAdmin, settings: RealmSettings): Promise<void> => {
  const existing = await admin.request('GET', `/realms/${settings.realm}`, undefined, {
    allow404: true,
  })
  if (existing.status === 404) await admin.request('POST', '/realms', realmRepresentation(settings))
  else await admin.request('PUT', `/realms/${settings.realm}`, realmRepresentation(settings))

  await ensureClient(admin, settings.realm, webClient(settings))
  const adminUuid = await ensureClient(admin, settings.realm, adminClient(settings))
  await grantUserManagement(admin, settings.realm, adminUuid)
  await ensureRequiredActionsEnabled(admin, settings.realm)
}

/** A comparable summary of the realm and our clients, for the idempotency test and the CLI. */
export const describeRealm = async (admin: KeycloakAdmin, settings: RealmSettings) => {
  const { data: realm } = await admin.request<Record<string, unknown>>(
    'GET',
    `/realms/${settings.realm}`,
  )
  const { data: clients } = await admin.request<ClientRepresentation[]>(
    'GET',
    `/realms/${settings.realm}/clients`,
  )
  const ours = (clients ?? [])
    .filter((client) => [settings.webClientId, settings.adminClientId].includes(client.clientId))
    .map((client) => ({
      id: client.id,
      clientId: client.clientId,
      publicClient: client.publicClient,
      standardFlowEnabled: client.standardFlowEnabled,
      serviceAccountsEnabled: client.serviceAccountsEnabled,
      redirectUris: client.redirectUris,
      pkce: (client.attributes as Record<string, string> | undefined)?.[
        'pkce.code.challenge.method'
      ],
    }))
    .sort((a, b) => a.clientId.localeCompare(b.clientId))
  return {
    realm: realm?.realm,
    enabled: realm?.enabled,
    passwordPolicy: realm?.passwordPolicy,
    bruteForceProtected: realm?.bruteForceProtected,
    registrationAllowed: realm?.registrationAllowed,
    otpPolicyType: realm?.otpPolicyType,
    clients: ours,
  }
}
