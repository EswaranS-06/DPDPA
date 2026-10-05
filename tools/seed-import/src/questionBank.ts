import type {
  AnswerOption,
  AnswerOutcome,
  AnswerType,
  ObligationTrigger,
  QuestionApplicability,
  QuestionnaireRespondent,
  RiskLevel,
} from '@duatf/platform-db'
import { parse } from 'yaml'
import { z } from 'zod'
import type { TemplateFile, TemplateQuestion } from './templates'

// The question bank is the ComplyX templates (templates.yaml, imported from the workbooks)
// joined with ComplyX's knowledge-base mapping (kb-mapping.yaml). Everything legal about a
// question (references, penalty, phase, applicability) comes from the mapped obligations.

const outcomeSchema = z.enum(['compliant', 'potential_gap', 'gap', 'informational'])

const mappingSchema = z.object({
  version: z.literal(1),
  questionnaires: z.record(
    z.string().regex(/^TPL-\d{3}$/),
    z.object({
      title: z.string().min(3),
      respondent: z.enum(['organisation', 'department', 'vendor']),
      description: z.string().min(20),
    }),
  ),
  questions: z.record(
    z.string(),
    z.object({
      title: z.string().min(5).max(90),
      domain: z.string().regex(/^D\d{2}$/),
      obligations: z.array(z.string().regex(/^(OBL|LNK)-[A-Z]+-\d{2}$/)).min(1),
      controls: z.array(z.string().regex(/^CTL-[A-Z]+-\d{2}$/)).min(1),
      scoring: z.enum(['reversed', 'informational']).optional(),
      outcomes: z.record(z.string(), outcomeSchema).optional(),
      note: z.string().min(10).optional(),
      gates: z
        .array(
          z.object({
            question: z.string(),
            values: z.array(z.string().min(1)).min(1),
            reason: z.string().min(10),
          }),
        )
        .optional(),
    }),
  ),
})
export type KbMapping = z.infer<typeof mappingSchema>
export type QuestionMapping = KbMapping['questions'][string]
export type QuestionnaireInfo = KbMapping['questionnaires'][string] & {
  respondent: QuestionnaireRespondent
}

/** Reads kb-mapping.yaml. */
export const parseKbMapping = (source: string): KbMapping => mappingSchema.parse(parse(source))

/** Template questions with no mapping, mappings with no template question, and broken gates. */
export const mappingGaps = (files: readonly TemplateFile[], mapping: KbMapping) => {
  const questions = files.flatMap((file) => file.questions)
  const codes = questions.map((question) => question.code)
  const badGates = Object.entries(mapping.questions).flatMap(([code, entry]) =>
    (entry.gates ?? []).flatMap((gate) => {
      const gateQuestion = questions.find((question) => question.code === gate.question)
      if (!gateQuestion) return [`${code}: gate ${gate.question} is not a question`]
      if (gate.question === code) return [`${code}: a question cannot gate itself`]
      return gate.values
        .filter((value) => !gateQuestion.options.includes(value))
        .map((value) => `${code}: "${value}" is not an option of ${gate.question}`)
    }),
  )
  return {
    unmapped: codes.filter((code) => !mapping.questions[code]),
    orphaned: Object.keys(mapping.questions).filter((code) => !codes.includes(code)),
    noQuestionnaire: files
      .map((file) => file.questionnaire)
      .filter((code) => !mapping.questionnaires[code]),
    badGates,
  }
}

// --- Answer options ---------------------------------------------------------------------------

const option = (value: string, label: string, outcome: AnswerOutcome, hint?: string) =>
  hint ? { value, label, outcome, hint } : { value, label, outcome }

/** The maturity scale used by every maturity question: 3 and 4 meet the requirement. */
export const MATURITY_LEVELS: AnswerOption[] = [
  option('0', '0 · Not in place', 'gap', 'Nothing exists yet.'),
  option('1', '1 · Initial', 'gap', 'Ad hoc and undocumented; depends on individuals.'),
  option('2', '2 · Developing', 'potential_gap', 'Partly documented, or applied inconsistently.'),
  option('3', '3 · Defined', 'compliant', 'Documented, approved and applied consistently.'),
  option('4', '4 · Managed', 'compliant', 'Measured, reviewed and improved on a set cycle.'),
]

const YES_NO: Record<'standard' | 'reversed' | 'informational', AnswerOption[]> = {
  standard: [
    option('yes', 'Yes', 'compliant', 'In place, with evidence.'),
    option('partial', 'Partial', 'potential_gap', 'Partly in place.'),
    option('no', 'No', 'gap', 'Not in place.'),
  ],
  reversed: [
    option('yes', 'Yes', 'gap', 'Counts as a gap for this question.'),
    option('partial', 'Partial', 'potential_gap', 'Counts as a potential gap.'),
    option('no', 'No', 'compliant', 'Counts as compliant for this question.'),
  ],
  informational: [
    option('yes', 'Yes', 'informational', 'Recorded, not scored.'),
    option('partial', 'Partial', 'informational', 'Recorded, not scored.'),
    option('no', 'No', 'informational', 'Recorded, not scored.'),
  ],
}

const YES_NO_TEMPLATE = ['Yes', 'Partial', 'No', 'N-A']
const MATURITY_TEMPLATE = ['0', '1', '2', '3', '4']

const ANSWER_TYPE: Record<TemplateQuestion['type'], AnswerType> = {
  BINARY_PLUS: 'yes_no',
  MATURITY: 'maturity',
  SINGLE_SELECT: 'choice',
  MULTI_SELECT: 'multi_choice',
  FREE_TEXT: 'text',
}

/** How a template question is answered and what each answer means. */
export const answerOptions = (
  template: TemplateQuestion,
  mapping: QuestionMapping,
): { answerType: AnswerType; options: AnswerOption[]; scored: boolean } => {
  const answerType = ANSWER_TYPE[template.type]
  const fail = (problem: string) => {
    throw new Error(`Question ${template.code}: ${problem}`)
  }
  if (mapping.scoring && answerType !== 'yes_no') fail('scoring applies to yes/no questions only.')
  if (mapping.outcomes && answerType !== 'choice') fail('outcomes apply to choice questions only.')
  let options: AnswerOption[] = []
  if (answerType === 'yes_no') {
    if (template.options.join('|') !== YES_NO_TEMPLATE.join('|')) {
      fail(`expected the options ${YES_NO_TEMPLATE.join(', ')}.`)
    }
    options = YES_NO[mapping.scoring ?? 'standard']
  } else if (answerType === 'maturity') {
    if (template.options.join('|') !== MATURITY_TEMPLATE.join('|')) {
      fail(`expected the levels ${MATURITY_TEMPLATE.join(', ')}.`)
    }
    options = MATURITY_LEVELS
  } else if (answerType === 'choice' || answerType === 'multi_choice') {
    if (template.options.length < 2) fail('a choice question needs at least two options.')
    const outcomes = mapping.outcomes ?? {}
    const unknown = Object.keys(outcomes).filter((label) => !template.options.includes(label))
    if (unknown.length) fail(`outcomes name unknown options: ${unknown.join(', ')}.`)
    options = template.options.map((label) =>
      option(label, label, outcomes[label] ?? 'informational'),
    )
  }
  return {
    answerType,
    options,
    scored: options.some((item) => item.outcome !== 'informational'),
  }
}

// --- Derived from the knowledge base -----------------------------------------------------------

/** Impact weight (1-5) of a finding raised by the question, from the template's risk weight. */
export const RISK_WEIGHT: Record<RiskLevel, number> = { critical: 5, high: 4, medium: 3, low: 2 }

const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\s.;:,]+$/, '')
    .trim()

const uniqueNew = (items: readonly string[], taken: Set<string>): string[] => {
  const result: string[] = []
  for (const item of items) {
    const key = normalise(item)
    if (!key || taken.has(key)) continue
    taken.add(key)
    result.push(item.trim())
  }
  return result
}

export type EvidenceSuggestions = {
  /** The mapped controls' own evidence: needed to answer Yes. */
  required: string[]
  /** Evidence the linked obligations expect that the controls do not already list. */
  recommended: string[]
  /** Standard document requests (PBC list) for the question's domain. */
  supporting: string[]
}

/** Splits evidence into three lists with no item in more than one (compared case-insensitively). */
export const suggestEvidence = (input: {
  controlEvidence: readonly string[]
  obligationEvidence: readonly string[]
  domainPbcItems: readonly string[]
}): EvidenceSuggestions => {
  const taken = new Set<string>()
  const required = uniqueNew(input.controlEvidence, taken)
  const recommended = uniqueNew(input.obligationEvidence, taken)
  const supporting = uniqueNew(input.domainPbcItems, taken)
  return { required, recommended, supporting }
}

/** A question applies when any of its obligations applies. */
export const mergeApplicability = (
  triggers: readonly ObligationTrigger[],
): QuestionApplicability => {
  if (triggers.length === 0 || triggers.some((trigger) => trigger.always)) {
    return { always: true, roles: [], flags: [], bases: [] }
  }
  const union = (pick: (trigger: ObligationTrigger) => string[] | undefined) =>
    [...new Set(triggers.flatMap((trigger) => pick(trigger) ?? []))].sort()
  return {
    always: false,
    roles: union((trigger) => trigger.role),
    flags: union((trigger) => trigger.flags),
    bases: union((trigger) => trigger.basis),
  }
}

/** "DPDP Act s.8(6); DPDP Rules R7(1)" for DPDP obligations; other laws as recorded. */
export const formatReference = (obligation: {
  regime: string
  actRef: string | null
  ruleRef: string | null
  scheduleRef: string | null
}): string => {
  const dpdp = obligation.regime === 'DPDP'
  const parts = [
    obligation.actRef ? (dpdp ? `DPDP Act ${obligation.actRef}` : obligation.actRef) : null,
    obligation.ruleRef ? (dpdp ? `DPDP Rules ${obligation.ruleRef}` : obligation.ruleRef) : null,
    obligation.scheduleRef || null,
  ].filter((part): part is string => Boolean(part))
  return parts.join('; ')
}

type ControlText = { code: string; title: string; description: string; testProcedure: string }

/** What to put in place when the answer shows a gap: the mapped controls, in the KB's words. */
export const recommendationFor = (controls: readonly ControlText[]): string =>
  controls.length === 1
    ? `Put in place ${controls[0]?.code} ${controls[0]?.title}: ${controls[0]?.description}`
    : [
        'Put in place these controls:',
        ...controls.map((item) => `- ${item.code} ${item.title}: ${item.description}`),
      ].join('\n')

/** How the auditor tests the answer: each mapped control's test procedure. */
export const guidanceFor = (controls: readonly ControlText[]): string =>
  controls.length === 1
    ? (controls[0]?.testProcedure ?? '')
    : controls.map((item) => `${item.code}: ${item.testProcedure}`).join('\n')
