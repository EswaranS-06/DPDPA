// Usage: pnpm kb:content
// Adds the AI-drafted reference entries to the open knowledge-base draft (starting one if needed).
// Nothing is published: a firm administrator reviews each entry and publishes the draft.
import { appDatabaseEnvSchema, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { createDatabase } from '@duatf/platform-db'
import { applyContent, contentContext } from './apply'

loadRootEnvFile()
const env = parseEnv(appDatabaseEnvSchema)
const handle = createDatabase(env.APP_DATABASE_URL, { max: 2 })
try {
  const report = await applyContent(contentContext(handle.db))
  console.log(
    `${report.startedDraft ? 'Started' : 'Used'} draft ${report.version}: ${report.added.length} added, ${report.fixed.length} fixed, ${report.skipped.length} already there.`,
  )
  for (const line of [...report.added, ...report.fixed]) console.log(`  ${line}`)
} finally {
  await handle.close()
}
