import { describe, expect, it } from 'vitest'
import { formatSequentialCode, sequenceScope } from './codes'
import {
  addCalendarDays,
  addHours,
  daysBetween,
  formatDay,
  formatIst,
  isoDate,
  isOnOrBefore,
} from './dates'

describe('codes', () => {
  it('builds the series key and zero-pads the number', () => {
    const scope = sequenceScope('ACT', 'acme', 'hr')
    expect(scope).toBe('ACT-ACME-HR')
    expect(formatSequentialCode(scope, 1)).toBe('ACT-ACME-HR-001')
    expect(formatSequentialCode('FND-ACME', 31)).toBe('FND-ACME-031')
    expect(formatSequentialCode('EVD-ACME', 142, 4)).toBe('EVD-ACME-0142')
  })

  it('rejects segments that would break the code format', () => {
    expect(() => sequenceScope('ACT', 'AC ME')).toThrow('Invalid code segment')
    expect(() => formatSequentialCode('ACT-X', 0)).toThrow('Invalid sequence value')
  })
})

describe('India-time dates', () => {
  it('counts calendar days across month ends', () => {
    expect(addCalendarDays('2027-06-01', 90)).toBe('2027-08-30')
    expect(addCalendarDays('2027-05-13', -30)).toBe('2027-04-13')
  })

  it('uses the Indian calendar date near midnight UTC', () => {
    expect(isoDate(new Date('2027-05-12T19:00:00Z'))).toBe('2027-05-13')
  })

  it('adds hours for statutory clocks and formats in IST', () => {
    const aware = new Date('2027-06-10T04:30:00Z')
    expect(formatIst(aware)).toBe('10 Jun 2027, 10:00 IST')
    expect(formatIst(addHours(aware, 6))).toBe('10 Jun 2027, 16:00 IST')
    expect(formatIst(addHours(aware, 72))).toBe('13 Jun 2027, 10:00 IST')
  })

  it('formats days and counts days between dates', () => {
    expect(formatDay('2027-05-13')).toBe('13 May 2027')
    expect(daysBetween('2026-09-30', '2027-05-13')).toBe(225)
    expect(daysBetween('2026-11-13', '2026-09-30')).toBe(-44)
  })

  it('compares ISO dates', () => {
    expect(isOnOrBefore('2027-05-12', '2027-05-13')).toBe(true)
    expect(isOnOrBefore('2027-05-14', '2027-05-13')).toBe(false)
    expect(() => isOnOrBefore('13/05/2027', '2027-05-13')).toThrow('YYYY-MM-DD')
  })
})
