import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { z } from 'zod'
import { collectManual, collectPlaywright, collectVitest, type Observation } from './collect'
import { evaluate, type Review } from './evaluate'
import { planSchema } from './plan'
import { renderStatusMarkdown } from './report'

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))
const readYaml = (path: string): unknown => parse(readFileSync(path, 'utf8'))
const yamlFilesIn = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith('.yaml'))
        .map((name) => join(dir, name))
    : []

const reviewSchema = z.object({
  phase: z.string(),
  role: z.string(),
  reviewer: z.string(),
  date: z.string(),
  decision: z.enum(['approved', 'changes-requested']),
})

const plan = planSchema.parse(readYaml('plan/plan.yaml'))
const observations: Observation[] = [
  ...(existsSync('reports/vitest.json') ? collectVitest(readJson('reports/vitest.json')) : []),
  ...(existsSync('reports/playwright.json')
    ? collectPlaywright(readJson('reports/playwright.json'))
    : []),
  ...collectManual(yamlFilesIn('plan/manual-results').map(readYaml)),
]
const reviews: Review[] = yamlFilesIn('plan/reviews').map((path) =>
  reviewSchema.parse(readYaml(path)),
)

const evaluation = evaluate(plan, observations, reviews)
mkdirSync('reports', { recursive: true })
writeFileSync('reports/traceability.json', JSON.stringify(evaluation, null, 2))
writeFileSync('plan/STATUS.md', renderStatusMarkdown(evaluation))

for (const phase of evaluation.phases.filter((row) => row.status !== 'PLANNED')) {
  console.log(`${phase.id.padEnd(4)} ${phase.status.padEnd(14)} ${phase.title}`)
}
const counts = evaluation.tests.reduce<Record<string, number>>((acc, test) => {
  acc[test.status] = (acc[test.status] ?? 0) + 1
  return acc
}, {})
console.log('tests:', counts)
if (!evaluation.gate.ok) {
  console.error('Gate blocked:\n' + evaluation.gate.blocking.map((item) => `  ${item}`).join('\n'))
  process.exit(1)
}
console.log('Gate passing.')
