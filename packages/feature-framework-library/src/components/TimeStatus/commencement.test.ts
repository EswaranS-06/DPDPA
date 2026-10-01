import { describe, expect, it } from 'vitest'
import { commencementOn } from './commencement'

describe('commencement status', () => {
  it('TC-C16.4-01 a provision reads as in force, starting in so many days, or stopped, on a given day', () => {
    // Phase 2 of the DPDP Rules, 2025 starts on 13 November 2026; seen on 1 Oct 2026 it is 43 days away.
    expect(commencementOn('2026-11-13', null, '2026-10-01')).toEqual({
      state: 'starts',
      label: 'Starts 13 November 2026, in 43 days',
      detail: 'Commences 13 November 2026',
      days: 43,
    })
    expect(commencementOn('2026-11-13', null, '2026-11-12').label).toBe(
      'Starts 13 November 2026, tomorrow',
    )
    // On the day and after, it is in force.
    expect(commencementOn('2026-11-13', null, '2026-11-13')).toEqual({
      state: 'in_force',
      label: 'In force',
      detail: 'In force since 13 November 2026',
    })
    expect(commencementOn(null, null, '2026-10-01').detail).toBe('In force')
    // A provision with an end date (the SPDI Rules end on 13 May 2027).
    expect(commencementOn('2011-04-11', '2027-05-13', '2026-10-01')).toEqual({
      state: 'in_force',
      label: 'In force until 13 May 2027',
      detail: 'In force since 11 April 2011, stops applying 13 May 2027',
    })
    expect(commencementOn('2011-04-11', '2027-05-13', '2027-05-13')).toEqual({
      state: 'stopped',
      label: 'Stopped applying 13 May 2027',
      detail: 'No longer applies from 13 May 2027',
    })
  })
})
