import {
  parseEnv,
  redisEnvSchema,
  storageEnvSchema,
  testDatabaseEnvSchema,
} from '@duatf/core-config'
import { createDatabase } from '@duatf/platform-db'
import { createObjectStore } from '@duatf/platform-storage'
import { Redis } from 'ioredis'
import { afterAll, describe, expect, it } from 'vitest'
import { buildServer, databaseProbe } from './server'

const { TEST_APP_DATABASE_URL } = parseEnv(testDatabaseEnvSchema)
const { REDIS_URL } = parseEnv(redisEnvSchema)
const storageEnv = parseEnv(storageEnvSchema)

const database = createDatabase(TEST_APP_DATABASE_URL, { max: 2 })
const redis = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
const storage = createObjectStore(storageEnv, storageEnv.S3_BUCKET_EVIDENCE)

afterAll(async () => {
  redis.disconnect()
  await database.close()
})

const probes = {
  database: databaseProbe(database.db),
  redis: async () => {
    await redis.ping()
  },
  storage: () => storage.ping(),
}

describe('API server', () => {
  it('TC-C1.5-01 reports database, Redis and storage up', async () => {
    const app = await buildServer({ db: database.db, version: 'test', probes })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ok',
      version: 'test',
      checks: { database: 'up', redis: 'up', storage: 'up' },
    })
    await app.close()
  })

  it('reports degraded with 503 when a dependency is down', async () => {
    const app = await buildServer({
      db: database.db,
      version: 'test',
      probes: { ...probes, redis: () => Promise.reject(new Error('down')) },
    })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(503)
    expect(response.json()).toMatchObject({ status: 'degraded', checks: { redis: 'down' } })
    await app.close()
  })

  it('serves the framework library over tRPC', async () => {
    const app = await buildServer({ db: database.db, version: 'test', probes })
    const input = encodeURIComponent(JSON.stringify({ code: 'OBL-CON-01' }))
    const response = await app.inject({
      method: 'GET',
      url: `/trpc/framework.obligation?input=${input}`,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ result: { data: { code: 'OBL-CON-01' } } })
    await app.close()
  })
})
