import { apiEnvSchema, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { createDatabase } from '@duatf/platform-db'
import { createObjectStore } from '@duatf/platform-storage'
import { Redis } from 'ioredis'
import { buildServer, databaseProbe } from './server'

loadRootEnvFile()
const env = parseEnv(apiEnvSchema)
const database = createDatabase(env.APP_DATABASE_URL)
const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
const storage = createObjectStore(env, env.S3_BUCKET_EVIDENCE)

const app = await buildServer({
  db: database.db,
  version: process.env.npm_package_version ?? '0.1.0',
  logger: true,
  probes: {
    database: databaseProbe(database.db),
    redis: async () => {
      await redis.ping()
    },
    storage: () => storage.ping(),
  },
})

const shutdown = async () => {
  await app.close()
  redis.disconnect()
  await database.close()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())

await app.listen({ host: env.HOST, port: env.API_PORT })
