import { describe, expect, it } from 'vitest'
import { explainCompliance, summariseProgress, type StateCount } from './progress'

const counts = (yes: number, partial: number, no: number, na: number, open: number) =>
  (
    [
      ['compliant', yes],
      ['potential_gap', partial],
      ['gap', no],
      ['excluded', na],
      ['pending', open],
    ] as const
  ).map(([complianceState, n]): StateCount => ({ complianceState, reviewState: 'not_reviewed', n }))

describe('compliance posture working', () => {
  it('TC-C16.3-02 the working shown beside the posture reproduces the figure for every mix of answers', () => {
    const mismatches: string[] = []
    const range = [0, 1, 2, 3, 5, 8, 13]
    for (const yes of range)
      for (const partial of range)
        for (const no of range)
          for (const na of range)
            for (const open of [0, 4, 22]) {
              const progress = summariseProgress(counts(yes, partial, no, na, open))
              const working = explainCompliance(progress)
              // What a reader computes from the numbers on screen: points ÷ scored, one decimal.
              const byHand =
                working.scored === 0
                  ? null
                  : Math.round((working.points * 1000) / working.scored) / 10
              const accounted =
                working.scored + working.notApplicable + working.notAnswered === progress.total
              if (byHand !== progress.compliancePct || working.pct !== progress.compliancePct) {
                mismatches.push(
                  `${yes}/${partial}/${no}/${na}/${open}: ${byHand} vs ${progress.compliancePct}`,
                )
              }
              if (!accounted) mismatches.push(`${yes}/${partial}/${no}/${na}/${open}: total`)
            }
    expect(mismatches).toEqual([])
    // The golden case of TC-C6.4-01: (30 + 10/2) / 52 = 67.3%.
    const golden = explainCompliance(summariseProgress(counts(30, 10, 12, 8, 22)))
    expect([golden.points, golden.scored, golden.pct]).toEqual([35, 52, 67.3])
  })
})
