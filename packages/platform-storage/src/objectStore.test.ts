import { createHash, randomUUID } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import { parseEnv, storageEnvSchema } from '@duatf/core-config'
import { afterAll, describe, expect, it } from 'vitest'
import { createObjectStore, RejectedFileError } from './objectStore'

const env = parseEnv(storageEnvSchema)
const store = createObjectStore(env, env.S3_BUCKET_EVIDENCE)
const key = `test/${randomUUID()}.txt`

afterAll(() => store.remove(key))

describe('object storage', () => {
  it('TC-C1.4-01 stores the SHA-256 and refuses an expired signed URL', async () => {
    const content = Buffer.from('DUATF evidence sample: consent screen recording index\n')
    const stored = await store.put(key, content, 'text/plain')
    const expected = createHash('sha256').update(content).digest('hex')
    expect(stored.sha256).toBe(expected)
    expect((await store.stat(key)).sha256).toBe(expected)

    const url = await store.signedGetUrl(key, 1)
    const fresh = await fetch(url)
    expect(fresh.status).toBe(200)
    expect(await fresh.text()).toBe(content.toString())

    await sleep(2_500)
    const expired = await fetch(url)
    expect(expired.status).toBe(403)
  })

  it('rejects a file the scanner flags', async () => {
    const infected = createObjectStore(env, env.S3_BUCKET_EVIDENCE, {
      scan: () => Promise.resolve({ clean: false, engine: 'test', signature: 'EICAR' }),
    })
    await expect(
      infected.put(`test/${randomUUID()}.txt`, Buffer.from('x'), 'text/plain'),
    ).rejects.toThrow(RejectedFileError)
  })
})
