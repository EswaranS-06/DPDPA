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

/** File name for a Content-Disposition header: no quotes, backslashes or line breaks. */
const safeFileName = (name: string) => name.replace(/["\\\r\n]/g, '_')

export const createObjectStore = (
  env: StorageEnv,
  bucket: string,
  scanner: FileScanner = noopScanner,
) => {
  const clientFor = (url: string) => {
    const endpoint = new URL(url)
    const useSSL = endpoint.protocol === 'https:'
    return new Client({
      endPoint: endpoint.hostname,
      port: Number(endpoint.port || (useSSL ? 443 : 80)),
      useSSL,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      // A fixed region means signing links needs no round trip to the server.
      region: 'us-east-1',
    })
  }
  const client = clientFor(env.S3_ENDPOINT)
  // Links handed to browsers must use an address other machines can reach.
  const publicClient = env.S3_PUBLIC_ENDPOINT ? clientFor(env.S3_PUBLIC_ENDPOINT) : client

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

    /** A link that works for expirySeconds; optionally makes the browser save it as fileName. */
    signedGetUrl: (key: string, expirySeconds: number, fileName?: string) =>
      publicClient.presignedGetObject(
        bucket,
        key,
        expirySeconds,
        fileName
          ? {
              'response-content-disposition': `attachment; filename="${safeFileName(fileName)}"`,
            }
          : {},
      ),

    remove: (key: string) => client.removeObject(bucket, key),

    ping: async (): Promise<void> => {
      if (!(await client.bucketExists(bucket))) throw new Error(`Bucket ${bucket} does not exist`)
    },
  }
}

export type ObjectStore = ReturnType<typeof createObjectStore>
