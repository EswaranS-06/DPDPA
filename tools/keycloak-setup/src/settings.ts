import type { KeycloakSetupEnv } from '@duatf/core-config'
import { createKeycloakAdmin, masterAdmin, type KeycloakAdmin } from '@duatf/platform-identity'
import type { RealmSettings } from './realm'

export const realmSettings = (
  env: KeycloakSetupEnv,
  realm = env.KEYCLOAK_REALM,
): RealmSettings => ({
  realm,
  appUrl: env.PUBLIC_WEB_URL,
  webClientId: env.OIDC_CLIENT_ID,
  webClientSecret: env.OIDC_CLIENT_SECRET,
  adminClientId: env.KEYCLOAK_ADMIN_CLIENT_ID,
  adminClientSecret: env.KEYCLOAK_ADMIN_CLIENT_SECRET,
})

export const masterAdminClient = (env: KeycloakSetupEnv): KeycloakAdmin =>
  createKeycloakAdmin(
    env.KEYCLOAK_URL,
    masterAdmin(env.KEYCLOAK_URL, env.KEYCLOAK_MASTER_USER, env.KEYCLOAK_MASTER_PASSWORD),
  )
