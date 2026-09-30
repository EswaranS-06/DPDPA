import { frameworkLibraryRouter } from '@duatf/feature-framework-library-api'
import { pingDatabase, type Database } from '@duatf/platform-db'
import { router } from '@duatf/platform-trpc'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'

export const appRouter = router({ framework: frameworkLibraryRouter })

export type HealthProbe = () => Promise<void>

export type ServerDependencies = {
  db: Database
  probes: { database: HealthProbe; redis: HealthProbe; storage: HealthProbe }
  version: string
  logger?: boolean
}

const PROBE_TIMEOUT_MS = 3_000

const check = async (probe: HealthProbe): Promise<'up' | 'down'> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), PROBE_TIMEOUT_MS).unref(),
  )
  try {
    await Promise.race([probe(), timeout])
    return 'up'
  } catch {
    return 'down'
  }
}

export const buildServer = async (deps: ServerDependencies) => {
  const app = Fastify({ logger: deps.logger ?? false })

  app.get('/health', async (_request, reply) => {
    const [database, redis, storage] = await Promise.all([
      check(deps.probes.database),
      check(deps.probes.redis),
      check(deps.probes.storage),
    ])
    const checks = { database, redis, storage }
    const healthy = Object.values(checks).every((state) => state === 'up')
    return reply
      .code(healthy ? 200 : 503)
      .send({ status: healthy ? 'ok' : 'degraded', version: deps.version, checks })
  })

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter, createContext: () => ({ db: deps.db }) },
  })

  return app
}

export const databaseProbe =
  (db: Database): HealthProbe =>
  () =>
    pingDatabase(db)
