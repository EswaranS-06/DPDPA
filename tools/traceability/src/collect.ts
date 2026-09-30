import { z } from 'zod'
import { TEST_ID_PATTERN } from './plan'

export type Observation = {
  id: string
  outcome: 'pass' | 'fail' | 'skip'
  /** A failing test marked [drift] reports a changed snapshot value, not broken code. */
  drift: boolean
  origin: 'vitest' | 'playwright' | 'manual'
  name: string
}

const idsIn = (name: string) => [...new Set(name.match(TEST_ID_PATTERN) ?? [])]

const toOutcome = (status: string): Observation['outcome'] => {
  if (status === 'passed' || status === 'pass') return 'pass'
  if (status === 'failed' || status === 'fail' || status === 'timedOut') return 'fail'
  return 'skip'
}

const vitestReport = z.object({
  testResults: z.array(
    z.object({
      assertionResults: z.array(z.object({ fullName: z.string(), status: z.string() })),
    }),
  ),
})

export const collectVitest = (json: unknown): Observation[] =>
  vitestReport.parse(json).testResults.flatMap((file) =>
    file.assertionResults.flatMap((test) =>
      idsIn(test.fullName).map((id) => ({
        id,
        outcome: toOutcome(test.status),
        drift: test.fullName.includes('[drift]'),
        origin: 'vitest' as const,
        name: test.fullName,
      })),
    ),
  )

type PlaywrightSuite = {
  title: string
  specs?: { title: string; tests: { results: { status: string }[] }[] }[]
  suites?: PlaywrightSuite[]
}
const playwrightSuite: z.ZodType<PlaywrightSuite> = z.lazy(() =>
  z.object({
    title: z.string(),
    specs: z
      .array(
        z.object({
          title: z.string(),
          tests: z.array(z.object({ results: z.array(z.object({ status: z.string() })) })),
        }),
      )
      .optional(),
    suites: z.array(playwrightSuite).optional(),
  }),
)

export const collectPlaywright = (json: unknown): Observation[] => {
  const report = z.object({ suites: z.array(playwrightSuite) }).parse(json)
  const walk = (suite: PlaywrightSuite): Observation[] => [
    ...(suite.specs ?? []).flatMap((spec) => {
      const last = spec.tests.flatMap((test) => test.results).at(-1)
      return idsIn(spec.title).map((id) => ({
        id,
        outcome: toOutcome(last?.status ?? 'skipped'),
        drift: spec.title.includes('[drift]'),
        origin: 'playwright' as const,
        name: spec.title,
      }))
    }),
    ...(suite.suites ?? []).flatMap(walk),
  ]
  return report.suites.flatMap(walk)
}

export const manualResultSchema = z.object({
  id: z.string(),
  result: z.enum(['pass', 'fail']),
  by: z.string(),
  date: z.string(),
  evidence: z.string(),
  notes: z.string().optional(),
})

export const collectManual = (entries: unknown[]): Observation[] =>
  entries.map((entry) => {
    const result = manualResultSchema.parse(entry)
    return {
      id: result.id,
      outcome: result.result,
      drift: false,
      origin: 'manual' as const,
      name: `${result.id} (manual, ${result.by}, ${result.date})`,
    }
  })
