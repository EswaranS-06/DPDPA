import { provisionUser, setUserEnabled, type KeycloakAdmin } from '@duatf/platform-identity'
import type { ObjectStore } from '@duatf/platform-storage'
import type { EvidenceStorage, UserProvisioner } from './context'

/** Creates and manages sign-in accounts in the Keycloak realm through its admin API. */
export const keycloakProvisioner = (admin: KeycloakAdmin, realm: string): UserProvisioner => ({
  provision: (input) => provisionUser(admin, realm, input),
  setEnabled: (accountId, enabled) => setUserEnabled(admin, realm, accountId, enabled),
})

/** Evidence storage backed by the object store (bucket duatf-evidence). */
export const objectEvidenceStorage = (store: ObjectStore): EvidenceStorage => ({
  put: async (key, content, contentType) => {
    const stored = await store.put(key, content, contentType)
    return { sha256: stored.sha256, size: stored.size }
  },
  signedUrl: (key, seconds, fileName) => store.signedGetUrl(key, seconds, fileName),
  remove: (key) => store.remove(key),
})
