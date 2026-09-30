import { loadRootEnvFile, parseEnv, webEnvSchema } from '@duatf/core-config'
import { isoDate } from '@duatf/core-utils'
import {
  createFrameworkLibraryApi,
  frameworkLibraryRouter,
} from '@duatf/feature-framework-library-api'
import { createDatabase, type DatabaseHandle } from '@duatf/platform-db'
import { router } from '@duatf/platform-trpc'

declare global {
  // One connection pool per server process, reused across hot reloads in development.
  var duatfDatabase: DatabaseHandle | undefined
}

export const database = (): DatabaseHandle => {
  if (!globalThis.duatfDatabase) {
    loadRootEnvFile()
    const env = parseEnv(webEnvSchema)
    globalThis.duatfDatabase = createDatabase(env.APP_DATABASE_URL, { max: 10 })
  }
  return globalThis.duatfDatabase
}

export const appRouter = router({ framework: frameworkLibraryRouter })

export const libraryApi = () => createFrameworkLibraryApi({ db: database().db })

/** Today's date in India, used for commencement status. */
export const today = () => isoDate(new Date())
