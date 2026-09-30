import { createHash } from 'node:crypto'
import type { StorageEnv } from '@duatf/core-config'
import { Client } from 'minio'
import { noopScanner, type FileScanner } from './scanner'

export type StoredObject = {
  key: string
  sha256: string
  size: number
  versionId: string | null
  scanEngine: string
}

export class RejectedFileError extends Error {
  constructor(key: string, reason: string) {
    super(`File ${key} was rejected: ${reason}`)
    this.name = 'RejectedFileError'
  }
}

export const createObjectStore = (
  env: StorageEnv,
  bucket: string,
  scanner: FileScanner = noopScanner,
) => {
  const endpoint = new URL(env.S3_ENDPOINT)
  const useSSL = endpoint.protocol === 'https:'
  const client = new Client({
    endPoint: endpoint.hostname,
    port: Number(endpoint.port || (useSSL ? 443 : 80)),
    useSSL,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
  })

  return {
    bucket,

    /** Scans, hashes and stores a file; the SHA-256 is kept as object metadata for later checks. */
    put: async (key: string, content: Buffer, contentType: string): Promise<StoredObject> => {
      const scan = await scanner.scan(content)
      if (!scan.clean)
        throw new RejectedFileError(key, `malware detected (${scan.signature ?? scan.engine})`)
      const sha256 = createHash('sha256').update(content).digest('hex')
      const info = await client.putObject(bucket, key, content, content.length, {
        'Content-Type': contentType,
        'X-Amz-Meta-Sha256': sha256,
        'X-Amz-Meta-Scan-Engine': scan.engine,
      })
      return {
        key,
        sha256,
        size: content.length,
        versionId: info.versionId ?? null,
        scanEngine: scan.engine,
      }
    },

    stat: async (key: string) => {
      const stat = await client.statObject(bucket, key)
      const meta = stat.metaData as Record<string, string | undefined>
      return { size: stat.size, sha256: meta.sha256 ?? meta['x-amz-meta-sha256'] ?? null }
    },

    signedGetUrl: (key: string, expirySeconds: number) =>
      client.presignedGetObject(bucket, key, expirySeconds),

    remove: (key: string) => client.removeObject(bucket, key),

    ping: async (): Promise<void> => {
      if (!(await client.bucketExists(bucket))) throw new Error(`Bucket ${bucket} does not exist`)
    },
  }
}

export type ObjectStore = ReturnType<typeof createObjectStore>
