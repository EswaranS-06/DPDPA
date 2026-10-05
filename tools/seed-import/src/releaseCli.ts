// Builds framework release 1.1.0 from 1.0.0: copies it, applies the documented amendments and
// adds the ComplyX question bank. Run once per database: pnpm kb:release
import { databaseEnvSchema, findRepoRoot, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import { buildRelease, questionBankPaths, RELEASE_1_1_0, ReleaseExistsError } from './release'

loadRootEnvFile()
try {
  const report = await buildRelease({
    databaseUrl: parseEnv(databaseEnvSchema).DATABASE_URL,
    questionBank: questionBankPaths(findRepoRoot()),
    ...RELEASE_1_1_0,
  })
  console.log(
    `Published framework release ${report.version}: ${report.questions} questions, ${report.amendments} amendment(s).`,
  )
} catch (error) {
  if (error instanceof ReleaseExistsError) {
    console.error(error.message)
    process.exit(2)
  }
  throw error
}
