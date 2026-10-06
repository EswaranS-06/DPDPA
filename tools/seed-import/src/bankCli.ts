// Puts a changed question bank into a new knowledge-base release: pnpm kb:questions
// Does nothing when the templates and the KB mapping are what the last release was built from.
import { databaseEnvSchema, findRepoRoot, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { questionBankPaths, updateQuestionBank } from './release'

loadRootEnvFile()
const report = await updateQuestionBank({
  databaseUrl: parseEnv(databaseEnvSchema).DATABASE_URL,
  questionBank: questionBankPaths(findRepoRoot()),
})
console.log(
  report
    ? `Published framework release ${report.version} with the updated question bank: ${report.questions} questions.`
    : 'The question bank is unchanged since the last release.',
)
