// pnpm duatf templates import <zip> [--dry-run]: brings in a version of ComplyX's DPDP template
// library, byte for byte, and says what changed (ADR-0010 decision 1).
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { parseArgs } from 'node:util'
import { structureIssues } from '../library/checks'
import { importLibrary } from '../library/manifest'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { 'dry-run': { type: 'boolean', default: false } },
})
const file = positionals[0]
if (!file) {
  console.error(
    'Give the library zip: pnpm duatf templates import <Templater-DPDP.zip> [--dry-run]',
  )
  process.exit(64)
}
const lines = (items: readonly string[]) => items.map((item) => `\n  ${item}`).join('')
const report = await importLibrary(readFileSync(file), {
  source: basename(file),
  dryRun: values['dry-run'],
})
console.log(`Added (${report.added.length})${lines(report.added)}`)
console.log(`Changed (${report.changed.length})${lines(report.changed)}`)
console.log(`Removed (${report.removed.length})${lines(report.removed)}`)
console.log(`Unchanged: ${report.unchanged}. Source SHA-256 ${report.manifest.sourceSha256}.`)
if (values['dry-run']) {
  console.log('Dry run: nothing was written.')
} else {
  const issues = structureIssues()
  const inTemplates = issues.problems.filter((problem) => !problem.startsWith('00-common/'))
  const unknown = issues.unknownFlags.map((flag) => `unknown flag ${flag}`)
  console.log(
    inTemplates.length || unknown.length
      ? `The templates have structural problems:${lines([...inTemplates, ...unknown])}`
      : 'Imported. The templates pass the library’s own structural checks.',
  )
  const notes = issues.problems.filter((problem) => problem.startsWith('00-common/'))
  if (notes.length) {
    console.log(`In the common files (the library's own validator lists these too):${lines(notes)}`)
  }
  if (report.changed.length) {
    console.log(
      'Changed templates need legal review again: an Administrator marks each one on its page.',
    )
  }
}
