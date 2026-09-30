import { describe, expect, it } from 'vitest'
import {
  formatReference,
  mergeApplicability,
  parseQuestionBank,
  questionCode,
  riskWeight,
  suggestEvidence,
} from './questionBank'

const key = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')

describe('evidence suggestions', () => {
  it('TC-C4.3-01 splits evidence into required, recommended and supporting with no duplicates', () => {
    const result = suggestEvidence({
      controlEvidence: ['IR plan', 'Breach register', 'breach register.'],
      obligationEvidence: ['Breach Register', 'Board intimation template', 'IR plan', 'DP notice'],
      domainPbcItems: ['Incident register (last 24 months)', 'DP notice', 'IR plan'],
    })
    expect(result).toEqual({
      required: ['IR plan', 'Breach register'],
      recommended: ['Board intimation template', 'DP notice'],
      supporting: ['Incident register (last 24 months)'],
    })
    const all = [...result.required, ...result.recommended, ...result.supporting].map(key)
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('question bank helpers', () => {
  it('gives the question code of a control', () => {
    expect(questionCode('CTL-BRE-01')).toBe('Q-BRE-01')
  })

  it('merges obligation triggers: any "always" wins, otherwise the union of conditions', () => {
    expect(mergeApplicability([{ always: true }, { flags: ['children'] }])).toEqual({
      always: true,
      roles: [],
      flags: [],
      bases: [],
    })
    expect(
      mergeApplicability([{ role: ['sdf'] }, { flags: ['children', 'pwd'] }, { flags: ['pwd'] }]),
    ).toEqual({ always: false, roles: ['sdf'], flags: ['children', 'pwd'], bases: [] })
  })

  it('weights impact by the heaviest penalty tier', () => {
    expect(riskWeight(['P7', 'P1'])).toBe(5)
    expect(riskWeight(['P3'])).toBe(4)
    expect(riskWeight(['P7'])).toBe(3)
    expect(riskWeight([null])).toBe(3)
    expect(riskWeight([])).toBe(2)
  })

  it('formats DPDP and other-law references', () => {
    expect(
      formatReference({ regime: 'DPDP', actRef: 's.8(6)', ruleRef: 'R7(1)', scheduleRef: null }),
    ).toBe('DPDP Act s.8(6); DPDP Rules R7(1)')
    expect(
      formatReference({
        regime: 'Other Indian law',
        actRef: 'IT Act s.43A',
        ruleRef: 'SPDI Rules 2011',
        scheduleRef: '',
      }),
    ).toBe('IT Act s.43A; SPDI Rules 2011')
  })

  it('refuses a question file with two questions for one control', () => {
    const entry = `  - control: CTL-BRE-01
    question: Is there an incident response plan with every clock?
    recommendation: Write an incident response plan with every clock.
`
    expect(() => parseQuestionBank(`version: 1\nquestions:\n${entry}${entry}`)).toThrow(
      /two questions/,
    )
  })
})
