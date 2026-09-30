import { loadRootEnvFile, parseEnv, webEnvSchema, type WebEnv } from '@duatf/core-config'
import { createDatabase, type DatabaseHandle } from '@duatf/platform-db'

declare global {
  // One connection pool per server process, reused across hot reloads in development.
  var duatfDatabase: DatabaseHandle | undefined
  var duatfEnv: WebEnv | undefined
}

export const env = (): WebEnv => {
  if (!globalThis.duatfEnv) {
    loadRootEnvFile()
    globalThis.duatfEnv = parseEnv(webEnvSchema)
  }
  return globalThis.duatfEnv
}

export const database = (): DatabaseHandle => {
  globalThis.duatfDatabase ??= createDatabase(env().APP_DATABASE_URL, { max: 10 })
  return globalThis.duatfDatabase
}
