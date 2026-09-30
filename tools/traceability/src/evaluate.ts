import type { Observation } from './collect'
import type { Plan, PlanTest } from './plan'

export type TestStatus =
  'PASS' | 'FAIL' | 'MISSING' | 'SKIPPED' | 'DRIFT' | 'DEFERRED' | 'PLANNED' | 'MANUAL-PENDING'

export type PhaseStatus = 'DONE' | 'TESTS PASSING' | 'IN PROGRESS' | 'FAILING' | 'PLANNED'

type TestRow = PlanTest & { phase: string; subphase: string; status: TestStatus; blocking: boolean }
type SubphaseRow = { id: string; title: string; state: string; status: PhaseStatus }
type PhaseRow = {
  id: string
  title: string
  release: string
  status: PhaseStatus
  reviewsRequired: string[]
  reviewsRecorded: string[]
}

export type Review = { phase: string; role: string; decision: 'approved' | 'changes-requested' }

export type Evaluation = {
  tests: TestRow[]
  subphases: SubphaseRow[]
  phases: PhaseRow[]
  untraced: string[]
  gate: { ok: boolean; blocking: string[] }
}

const combine = (observations: Observation[]): Observation['outcome'] | undefined => {
  if (observations.length === 0) return undefined
  if (observations.some((o) => o.outcome === 'fail')) return 'fail'
  if (observations.every((o) => o.outcome === 'skip')) return 'skip'
  return 'pass'
}

const statusFor = (test: PlanTest, state: string, observed: Observation[]): TestStatus => {
  if (state === 'planned') return 'PLANNED'
  if (test.deferredTo) return 'DEFERRED'
  const outcome = combine(observed)
  if (outcome === undefined) return test.kind === 'manual' ? 'MANUAL-PENDING' : 'MISSING'
  if (outcome === 'pass') return 'PASS'
  if (outcome === 'skip') return 'SKIPPED'
  const failures = observed.filter((o) => o.outcome === 'fail')
  return failures.every((o) => o.drift) ? 'DRIFT' : 'FAIL'
}

const isBlocking = (test: PlanTest, status: TestStatus) =>
  test.mandatory && (status === 'FAIL' || status === 'MISSING' || status === 'SKIPPED')

const rollUp = (rows: TestRow[], state: string, reviewsDone: boolean): PhaseStatus => {
  if (state === 'planned' || rows.every((row) => row.status === 'PLANNED')) return 'PLANNED'
  const gated = rows.filter((row) => row.mandatory && row.status !== 'PLANNED')
  if (gated.some((row) => row.status === 'FAIL' || row.status === 'SKIPPED')) return 'FAILING'
  if (gated.some((row) => row.status === 'MISSING' || row.status === 'MANUAL-PENDING'))
    return 'IN PROGRESS'
  return reviewsDone ? 'DONE' : 'TESTS PASSING'
}

export const evaluate = (
  plan: Plan,
  observations: Observation[],
  reviews: Review[],
): Evaluation => {
  const byId = new Map<string, Observation[]>()
  for (const observation of observations) {
    byId.set(observation.id, [...(byId.get(observation.id) ?? []), observation])
  }

  const tests: TestRow[] = []
  const subphases: SubphaseRow[] = []
  const phases: PhaseRow[] = []

  for (const phase of plan.phases) {
    const approved = reviews
      .filter((review) => review.phase === phase.id && review.decision === 'approved')
      .map((review) => review.role)
    const reviewsDone = phase.reviews.every((role) => approved.includes(role))
    const phaseRows: TestRow[] = []
    let anyActive = false

    for (const subphase of phase.subphases) {
      if (subphase.state !== 'planned') anyActive = true
      const rows = subphase.tests.map((test) => {
        const status = statusFor(test, subphase.state, byId.get(test.id) ?? [])
        return {
          ...test,
          phase: phase.id,
          subphase: subphase.id,
          status,
          blocking: isBlocking(test, status),
        }
      })
      tests.push(...rows)
      phaseRows.push(...rows)
      subphases.push({
        id: subphase.id,
        title: subphase.title,
        state: subphase.state,
        status: rollUp(rows, subphase.state, false),
      })
    }

    phases.push({
      id: phase.id,
      title: phase.title,
      release: phase.release,
      status: rollUp(phaseRows, anyActive ? 'active' : 'planned', reviewsDone),
      reviewsRequired: phase.reviews,
      reviewsRecorded: approved,
    })
  }

  const planned = new Set(tests.map((test) => test.id))
  const untraced = [...byId.keys()].filter((id) => !planned.has(id)).sort()
  const blocking = [
    ...tests.filter((test) => test.blocking).map((test) => `${test.id} ${test.status}`),
    ...untraced.map((id) => `${id} UNTRACED`),
  ]

  return { tests, subphases, phases, untraced, gate: { ok: blocking.length === 0, blocking } }
}
