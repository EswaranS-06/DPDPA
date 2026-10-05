import type { ObjectStore } from '@duatf/platform-storage'
import type { EvidenceStorage } from './context'

/** Evidence storage backed by the object store (the evidence bucket). */
export const objectEvidenceStorage = (store: ObjectStore): EvidenceStorage => ({
  put: async (key, content, contentType) => {
    const stored = await store.put(key, content, contentType)
    return { sha256: stored.sha256, size: stored.size }
  },
  signedUrl: (key, seconds, fileName) => store.signedGetUrl(key, seconds, fileName),
  remove: (key) => store.remove(key),
})
