import { describe, expect, it } from 'vitest'
import { buildLadder } from './ladder'

const summary = {
  release: { version: '1.0.0', publishedAt: null },
  asOf: '2026-09-30',
  inForce: 7,
  counts: {
    law: 75,
    obligations: 99,
    controls: 82,
    domains: 18,
    processes: 124,
    sectors: 20,
    dataElements: 91,
    vocabularies: 17,
    playbooks: 11,
  },
  milestones: [
    { date: null, count: 3, domains: [{ code: 'D09', title: 'Security', count: 3 }] },
    { date: '2022-06-28', count: 4, domains: [{ code: 'D10', title: 'Breach', count: 4 }] },
    {
      date: '2026-11-13',
      count: 6,
      domains: [{ code: 'D18', title: 'Consent Manager Operations', count: 6 }],
    },
    {
      date: '2027-05-13',
      count: 86,
      domains: [
        { code: 'D01', title: 'Governance', count: 5 },
        { code: 'D06', title: 'Consent', count: 81 },
      ],
    },
  ],
}

describe('commencement ladder', () => {
  it('counts what applies today and states the upcoming dates in a sentence', () => {
    const ladder = buildLadder(summary, '2026-09-30')
    expect(ladder.liveToday).toBe(7)
    expect(ladder.headline).toBe('7 of 99 obligations apply today.')
    expect(ladder.upcoming).toBe('6 start on 13 November 2026 and the remaining 86 on 13 May 2027.')
    expect(ladder.steps.map((step) => step.cumulative)).toEqual([7, 13, 99])
    expect(ladder.steps[1]?.detail).toBe('6 more: Consent Manager Operations')
    expect(ladder.steps[2]?.detail).toBe('86 more across 2 domains')
    expect(ladder.countdown).toBe('225 days to go.')
  })

  it('places steps in time order within the axis', () => {
    const positions = buildLadder(summary, '2026-09-30').steps.map((step) => step.position)
    expect(positions[0]).toBe(0)
    expect(positions[1]).toBeGreaterThan(0)
    expect(positions[2]).toBeGreaterThan(positions[1] ?? 0)
    expect(positions[2]).toBeLessThan(100)
  })

  it('shows everything in force after the last date', () => {
    const ladder = buildLadder(summary, '2027-06-01')
    expect(ladder.headline).toBe('99 of 99 obligations apply today.')
    expect(ladder.upcoming).toBeNull()
    expect(ladder.countdown).toBeNull()
  })
})
