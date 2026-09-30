import { provisionUser, setUserEnabled, type KeycloakAdmin } from '@duatf/platform-identity'
import type { UserProvisioner } from './context'

/** Creates and manages sign-in accounts in the Keycloak realm through its admin API. */
export const keycloakProvisioner = (admin: KeycloakAdmin, realm: string): UserProvisioner => ({
  provision: (input) => provisionUser(admin, realm, input),
  setEnabled: (accountId, enabled) => setUserEnabled(admin, realm, accountId, enabled),
})
