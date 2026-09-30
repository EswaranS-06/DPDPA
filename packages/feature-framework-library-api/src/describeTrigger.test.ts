import { describe, expect, it } from 'vitest'
import { describeTrigger } from './describeTrigger'
import { refHref } from './refs'

describe('plain-English triggers', () => {
  it('TC-C2.5-03 describes each kind of trigger', () => {
    expect(describeTrigger({ always: true })).toBe('Applies to every in-scope processing activity.')
    expect(describeTrigger({ basis: ['consent'] })).toBe(
      'Applies when the lawful basis is consent.',
    )
    expect(describeTrigger({ basis: ['s7c', 's7d', 's7e'] })).toBe(
      'Applies when the lawful basis is s.7(c) State function, s.7(d) legal duty to disclose or s.7(e) court order.',
    )
    expect(describeTrigger({ flags: ['children', 'tracking_ads'] })).toBe(
      "Applies when children's data is processed and there is tracking, profiling or targeted advertising.",
    )
    expect(describeTrigger({ role: ['sdf'] })).toBe(
      'Applies when the entity is a Significant Data Fiduciary.',
    )
    expect(describeTrigger({ basis: ['consent'], flags: ['legacy_data'] })).toBe(
      'Applies when the lawful basis is consent and data was collected on consent before commencement.',
    )
    expect(describeTrigger({})).toBe('No trigger is recorded for this obligation.')
  })
})

describe('reference links', () => {
  it('maps stored references to app routes', () => {
    expect(refHref('ref:obligation/OBL-CON-01')).toBe('/library/obligations/OBL-CON-01')
    expect(refHref('ref:law/S06')).toBe('/library/law/S06')
    expect(refHref('ref:basis/s7a')).toBe('/library/law/bases#s7a')
    expect(refHref('https://example.org')).toBe('https://example.org')
  })
})
