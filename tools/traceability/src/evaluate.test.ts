import { describe, expect, it } from 'vitest'
import { collectVitest, type Observation } from './collect'
import { evaluate } from './evaluate'
import { planSchema } from './plan'

const plan = planSchema.parse({
  version: 1,
  phases: [
    {
      id: 'C9',
      title: 'Sample phase',
      release: 'R0',
      reviews: ['tech_lead'],
      subphases: [
        {
          id: 'C9.1',
          title: 'Active work',
          state: 'active',
          tests: [
            { id: 'TC-C9.1-01', title: 'passes', expected: 'x', source: 'literal' },
            { id: 'TC-C9.1-02', title: 'fails', expected: 'x', source: 'literal' },
            { id: 'TC-C9.1-03', title: 'has no result', expected: 'x', source: 'literal' },
            { id: 'TC-C9.1-04', title: 'snapshot moved', expected: 'x', source: 'oracle' },
            {
              id: 'TC-C9.1-05',
              title: 'waits',
              expected: 'x',
              source: 'literal',
              deferredTo: 'C3',
            },
            { id: 'TC-C9.1-06', title: 'manual', expected: 'x', source: 'manual', kind: 'manual' },
          ],
        },
        {
          id: 'C9.2',
          title: 'Later work',
          state: 'planned',
          tests: [{ id: 'TC-C9.2-01', title: 'later', expected: 'x', source: 'literal' }],
        },
      ],
    },
  ],
})

const observed = (id: string, outcome: Observation['outcome'], drift = false): Observation => ({
  id,
  outcome,
  drift,
  origin: 'vitest',
  name: id,
})

const statusOf = (id: string, observations: Observation[]) =>
  evaluate(plan, observations, []).tests.find((test) => test.id === id)?.status

describe('traceability evaluation', () => {
  const observations = [
    observed('TC-C9.1-01', 'pass'),
    observed('TC-C9.1-02', 'fail'),
    observed('TC-C9.1-04', 'fail', true),
    observed('TC-C7.7-07', 'pass'),
  ]

  it('TC-C0.4-01 flags MISSING, UNTRACED and FAIL, and blocks the gate', () => {
    const result = evaluate(plan, observations, [])
    expect(statusOf('TC-C9.1-03', observations)).toBe('MISSING')
    expect(statusOf('TC-C9.1-02', observations)).toBe('FAIL')
    expect(result.untraced).toEqual(['TC-C7.7-07'])
    expect(result.gate.ok).toBe(false)
    expect(result.gate.blocking).toEqual([
      'TC-C9.1-02 FAIL',
      'TC-C9.1-03 MISSING',
      'TC-C7.7-07 UNTRACED',
    ])
    expect(result.subphases.find((row) => row.id === 'C9.1')?.status).toBe('FAILING')
  })

  it('TC-C0.4-02 reports DRIFT, DEFERRED and PLANNED without blocking the gate', () => {
    const passing = [
      observed('TC-C9.1-01', 'pass'),
      observed('TC-C9.1-02', 'pass'),
      observed('TC-C9.1-03', 'pass'),
      observed('TC-C9.1-04', 'fail', true),
    ]
    const result = evaluate(plan, passing, [])
    expect(statusOf('TC-C9.1-04', passing)).toBe('DRIFT')
    expect(statusOf('TC-C9.1-05', passing)).toBe('DEFERRED')
    expect(statusOf('TC-C9.2-01', passing)).toBe('PLANNED')
    expect(statusOf('TC-C9.1-06', passing)).toBe('MANUAL-PENDING')
    expect(result.gate.ok).toBe(true)
    expect(result.phases[0]?.status).toBe('IN PROGRESS')
  })

  it('marks a phase DONE only when tests pass and every review is approved', () => {
    const all = ['TC-C9.1-01', 'TC-C9.1-02', 'TC-C9.1-03', 'TC-C9.1-04', 'TC-C9.1-06'].map((id) =>
      observed(id, 'pass'),
    )
    expect(evaluate(plan, all, []).phases[0]?.status).toBe('TESTS PASSING')
    const reviewed = evaluate(plan, all, [{ phase: 'C9', role: 'tech_lead', decision: 'approved' }])
    expect(reviewed.phases[0]?.status).toBe('DONE')
  })

  it('reads test IDs from a Vitest JSON report', () => {
    const report = {
      testResults: [
        {
          assertionResults: [
            { fullName: 'suite TC-C9.1-01 passes', status: 'passed' },
            { fullName: 'suite TC-C9.1-04 [drift] counts', status: 'failed' },
            { fullName: 'suite has no id', status: 'passed' },
          ],
        },
      ],
    }
    expect(collectVitest(report)).toEqual([
      {
        id: 'TC-C9.1-01',
        outcome: 'pass',
        drift: false,
        origin: 'vitest',
        name: 'suite TC-C9.1-01 passes',
      },
      {
        id: 'TC-C9.1-04',
        outcome: 'fail',
        drift: true,
        origin: 'vitest',
        name: 'suite TC-C9.1-04 [drift] counts',
      },
    ])
  })
})
