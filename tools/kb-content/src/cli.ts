// Usage: pnpm kb:content [--publish]
// Adds the AI-drafted reference entries to the open knowledge-base draft (starting one if needed).
// Entries already there are left alone; when nothing is missing, no draft is left behind.
// Without --publish nothing is published: a firm administrator reviews each entry and publishes
// the draft. With --publish (used when setting up the self-assessment edition, at ComplyX's
// request) the draft is published at once; its entries keep their "awaiting legal review" labels.
import { appDatabaseEnvSchema, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { discardDraft, openDraft, publishDraft } from '@duatf/feature-framework-library-api'
import { createDatabase } from '@duatf/platform-db'
import { applyContent, contentContext } from './apply'

loadRootEnvFile()
const env = parseEnv(appDatabaseEnvSchema)
const handle = createDatabase(env.APP_DATABASE_URL, { max: 2 })
try {
  const ctx = contentContext(handle.db)
  const draftWasOpen = Boolean(await openDraft(handle.db))
  const report = await applyContent(ctx)
  const changed = report.added.length > 0 || report.fixed.length > 0
  console.log(
    `${report.startedDraft ? 'Started' : 'Used'} draft ${report.version}: ${report.added.length} added, ${report.fixed.length} fixed, ${report.skipped.length} already there.`,
  )
  for (const line of [...report.added, ...report.fixed]) console.log(`  ${line}`)
  if (!changed && report.startedDraft) {
    await discardDraft(ctx)
    console.log('Nothing to add; the empty draft was discarded.')
  } else if (process.argv.includes('--publish') && draftWasOpen) {
    console.log(
      `Draft ${report.version} was already open, so it was not published. Review and publish it in the knowledge-base editor.`,
    )
  } else if (process.argv.includes('--publish') && changed) {
    const published = await publishDraft(
      {
        ...ctx,
        origin: 'staff',
        principal: { ...ctx.principal, displayName: 'Self-assessment set-up (ComplyX request)' },
      },
      {
        acknowledge: true,
        notes:
          'Published when the self-assessment edition was set up, as ComplyX asked. AI-drafted entries keep their awaiting-review labels until reviewed.',
      },
    )
    console.log(`Published release ${published.version}.`)
  }
} finally {
  await handle.close()
}
