import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findRepoRoot } from '@duatf/core-config'
import { PERSONAL_DATA_CATEGORIES } from '@duatf/feature-compliance-api/personal-data'
import { describe, expect, it } from 'vitest'
import {
  answerOptions,
  formatReference,
  mappingGaps,
  mergeApplicability,
  parseKbMapping,
  suggestEvidence,
  type QuestionMapping,
} from './questionBank'
import { questionBankPaths } from './release'
import {
  optionsFromNote,
  parseTemplateBank,
  readTemplateFolder,
  templateBankYaml,
  type TemplateQuestion,
} from './templates'

const root = findRepoRoot()
const paths = questionBankPaths(root)
const templatesText = readFileSync(paths.templatesPath, 'utf8')
const files = parseTemplateBank(templatesText)
const mapping = parseKbMapping(readFileSync(paths.mappingPath, 'utf8'))
const questions = files.flatMap((file) => file.questions)

const key = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')

describe('ComplyX templates', () => {
  it('TC-C19.1-01 templates.yaml is exactly what the three workbooks hold', async () => {
    const fromWorkbooks = await readTemplateFolder(join(root, 'seed', 'question-bank', 'source'))
    expect(templateBankYaml(fromWorkbooks)).toBe(templatesText)
    expect(files.map((file) => [file.questionnaire, file.questions.length])).toEqual([
      ['TPL-001', 70],
      ['TPL-002', 73],
      ['TPL-003', 58],
    ])
    expect(questions).toHaveLength(201)
  })

  it('TC-C19.1-02 maps every question to the knowledge base, with valid answers and gates', () => {
    expect(mappingGaps(files, mapping)).toEqual({
      unmapped: [],
      orphaned: [],
      noQuestionnaire: [],
      badGates: [],
    })
    const types: Record<string, number> = {}
    for (const question of questions) {
      const entry = mapping.questions[question.code] as QuestionMapping
      const answers = answerOptions(question, entry)
      types[answers.answerType] = (types[answers.answerType] ?? 0) + 1
      expect(answers.options.length > 1, question.code).toBe(answers.answerType !== 'text')
    }
    expect(types).toEqual({ yes_no: 93, maturity: 85, choice: 12, text: 10, multi_choice: 1 })

    // B0.1 asks for the categories of personal data: the data map's categories, not the
    // industry sectors the workbook lists.
    const b01 = questions.find((question) => question.code === 'B0.1') as TemplateQuestion
    expect(
      answerOptions(b01, mapping.questions['B0.1'] as QuestionMapping).options.map(
        (item) => item.label,
      ),
    ).toEqual(
      PERSONAL_DATA_CATEGORIES.filter((category) => !category.notPersonal).map(
        (category) => category.title,
      ),
    )

    // The gates the self-reconciliation relies on.
    const gated = (code: string) =>
      (mapping.questions[code]?.gates ?? []).map(
        (gate) => `${gate.question}=${gate.values.join('|')}`,
      )
    expect(gated('A12.1')).toEqual(['A1.4=No'])
    expect(gated('A4.1')).toEqual(['A2.5=Neither|Disability data'])
    expect(gated('A4.4')).toEqual(["A2.5=Neither|Children's data"])
    expect(gated('A10.2')).toEqual(['A10.1=No transfers'])
  })
})

describe('answer options', () => {
  const template = (overrides: Partial<TemplateQuestion>): TemplateQuestion => ({
    code: 'Z1.1',
    id: 'z',
    section: 'Test',
    text: 'Is this a test question?',
    type: 'BINARY_PLUS',
    options: ['Yes', 'Partial', 'No', 'N-A'],
    risk: 'HIGH',
    ref: null,
    attachment: false,
    ...overrides,
  })
  const entry: QuestionMapping = {
    title: 'A test question',
    domain: 'D01',
    obligations: ['OBL-GOV-01'],
    controls: ['CTL-GOV-01'],
  }
  const outcomes = (result: ReturnType<typeof answerOptions>) =>
    result.options.map((option) => `${option.value}:${option.outcome}`)

  it('scores Yes/No questions normally, reversed or not at all', () => {
    expect(outcomes(answerOptions(template({}), entry))).toEqual([
      'yes:compliant',
      'partial:potential_gap',
      'no:gap',
    ])
    expect(outcomes(answerOptions(template({}), { ...entry, scoring: 'reversed' }))).toEqual([
      'yes:gap',
      'partial:potential_gap',
      'no:compliant',
    ])
    const recorded = answerOptions(template({}), { ...entry, scoring: 'informational' })
    expect([recorded.scored, new Set(recorded.options.map((option) => option.outcome))]).toEqual([
      false,
      new Set(['informational']),
    ])
  })

  it('treats maturity 3 and 4 as compliant, 2 as a potential gap and 0 or 1 as a gap', () => {
    const maturity = template({ type: 'MATURITY', options: ['0', '1', '2', '3', '4'] })
    expect(outcomes(answerOptions(maturity, entry))).toEqual([
      '0:gap',
      '1:gap',
      '2:potential_gap',
      '3:compliant',
      '4:compliant',
    ])
  })

  it('gives choice options the outcome the mapping names, and refuses mismatches', () => {
    const choice = template({ type: 'SINGLE_SELECT', options: ['Yes', 'No', 'Planned'] })
    expect(
      outcomes(answerOptions(choice, { ...entry, outcomes: { Yes: 'compliant', No: 'gap' } })),
    ).toEqual(['Yes:compliant', 'No:gap', 'Planned:informational'])
    expect(() => answerOptions(choice, { ...entry, outcomes: { Maybe: 'gap' } })).toThrow(
      /unknown options: Maybe/,
    )
    expect(() => answerOptions(template({ options: ['Yes', 'No'] }), entry)).toThrow(
      /expected the options/,
    )
    expect(() => answerOptions(choice, { ...entry, scoring: 'reversed' })).toThrow(/yes\/no/)
  })

  it('reads the choices of a multi-select question from its note', () => {
    expect(optionsFromNote('(pick any, semicolon-separated: Email; SMS ; Phone)')).toEqual([
      'Email',
      'SMS',
      'Phone',
    ])
  })

  it('reports unmapped questions, orphaned mappings and broken gates', () => {
    const one = [{ file: 'x.xlsx', questionnaire: 'TPL-009', questions: [template({})] }]
    const broken = parseKbMapping(`version: 1
questionnaires: {}
questions:
  "Z1.1":
    title: A test question
    domain: D01
    obligations: [OBL-GOV-01]
    controls: [CTL-GOV-01]
    gates:
      - { question: Z1.1, values: ["Yes"], reason: "It cannot gate itself." }
  "Z9.9":
    title: Not in any template
    domain: D01
    obligations: [OBL-GOV-01]
    controls: [CTL-GOV-01]
    gates:
      - { question: Z1.1, values: [Maybe], reason: "Maybe is not an option." }
`)
    expect(mappingGaps(one, broken)).toEqual({
      unmapped: [],
      orphaned: ['Z9.9'],
      noQuestionnaire: ['TPL-009'],
      badGates: ['Z1.1: a question cannot gate itself', 'Z9.9: "Maybe" is not an option of Z1.1'],
    })
  })
})

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
    // ComplyX's own list for the question comes first; the knowledge base's becomes recommended.
    expect(
      suggestEvidence({
        templateEvidence: ['IR playbook', 'IR plan'],
        controlEvidence: ['IR plan', 'Breach register'],
        obligationEvidence: ['Board intimation template'],
        domainPbcItems: ['IR playbook', 'Incident register (last 24 months)'],
      }),
    ).toEqual({
      required: ['IR playbook', 'IR plan'],
      recommended: ['Breach register', 'Board intimation template'],
      supporting: ['Incident register (last 24 months)'],
    })
    const all = [...result.required, ...result.recommended, ...result.supporting].map(key)
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('school operations module', () => {
  it("TC-C20.10-01 B12 asks schools about children's data, tied to the children's obligations, with evidence", () => {
    const school = questions.filter((question) => question.code.startsWith('B12.'))
    expect(school.map((question) => question.code)).toEqual(
      Array.from({ length: 13 }, (_, index) => `B12.${index + 1}`),
    )
    expect(new Set(school.map((question) => question.section))).toEqual(
      new Set(['School Operations']),
    )
    expect(school.filter((question) => (question.evidence ?? []).length === 0)).toEqual([])
    const children = school
      .filter((question) =>
        (mapping.questions[question.code]?.obligations ?? []).some((code) =>
          code.startsWith('OBL-CHD-'),
        ),
      )
      .map((question) => question.code)
    expect(children).toEqual(['B12.1', 'B12.3', 'B12.4', 'B12.5', 'B12.7', 'B12.8', 'B12.13'])
  })
})

describe('question bank helpers', () => {
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
})
