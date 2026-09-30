// Usage: pnpm demo:load            (re)loads the Nadall and AMMA demo clients
//        pnpm demo:load --remove   removes them
import { parseArgs } from 'node:util'
import {
  appDatabaseEnvSchema,
  databaseEnvSchema,
  loadRootEnvFile,
  parseEnv,
  storageEnvSchema,
} from '@duatf/core-config'
import { objectEvidenceStorage } from '@duatf/feature-compliance-api'
import { createDatabase } from '@duatf/platform-db'
import { createObjectStore } from '@duatf/platform-storage'
import { loadDemo, removeDemo } from './loader'

loadRootEnvFile()
const { values } = parseArgs({ options: { remove: { type: 'boolean', default: false } } })
const env = parseEnv(
  databaseEnvSchema.extend(appDatabaseEnvSchema.shape).extend(storageEnvSchema.shape),
)
const app = createDatabase(env.APP_DATABASE_URL, { max: 2 })
const owner = createDatabase(env.DATABASE_URL, { max: 1 })
const deps = {
  db: app.db,
  ownerDb: owner.db,
  storage: objectEvidenceStorage(createObjectStore(env, env.S3_BUCKET_EVIDENCE)),
}
try {
  if (values.remove) {
    const removed = await removeDemo(deps)
    console.log(removed.length ? `Removed demo clients ${removed.join(', ')}.` : 'No demo clients.')
  } else {
    const summary = await loadDemo(deps)
    for (const client of summary.clients) {
      console.log(
        `${client.name} (${client.code}): ${client.assessments} assessment${client.assessments === 1 ? '' : 's'}, ${client.findings} findings, ${client.actions} remediation actions.`,
      )
    }
    console.log(`Demo people (no sign-in accounts yet): ${summary.people.length}.`)
  }
} finally {
  await Promise.all([app.close(), owner.close()])
}
