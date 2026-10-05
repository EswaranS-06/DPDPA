// Imports the ComplyX question templates: pnpm questions:import [folder]
// Reads every TPL-*.xlsx in the folder (default seed/question-bank/source), writes
// seed/question-bank/templates.yaml and reports questions the KB mapping does not cover yet.
// The new questions reach the app with the next knowledge-base release.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { findRepoRoot } from '@duatf/core-config'
import { mappingGaps, parseKbMapping } from './questionBank'
import { questionBankPaths } from './release'
import { readTemplateFolder, templateBankYaml } from './templates'

const root = findRepoRoot()
const folder = resolve(process.argv[2] ?? join(root, 'seed', 'question-bank', 'source'))
const paths = questionBankPaths(root)

const files = await readTemplateFolder(folder)
writeFileSync(paths.templatesPath, templateBankYaml(files))
for (const file of files) {
  console.log(`${file.questionnaire}  ${file.file}: ${file.questions.length} questions`)
}
const gaps = mappingGaps(files, parseKbMapping(readFileSync(paths.mappingPath, 'utf8')))
console.log(`Wrote ${paths.templatesPath}.`)
if (
  gaps.unmapped.length ||
  gaps.orphaned.length ||
  gaps.noQuestionnaire.length ||
  gaps.badGates.length
) {
  console.log(`Needs KB mapping: ${gaps.unmapped.join(', ') || 'none'}.`)
  console.log(`Mapped but no longer in a template: ${gaps.orphaned.join(', ') || 'none'}.`)
  console.log(`Questionnaires without a title: ${gaps.noQuestionnaire.join(', ') || 'none'}.`)
  console.log(`Gates to fix: ${gaps.badGates.join('; ') || 'none'}.`)
  process.exitCode = 1
}
