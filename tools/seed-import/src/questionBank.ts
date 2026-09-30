import type { ObligationTrigger, QuestionApplicability } from '@duatf/platform-db'
import { parse } from 'yaml'
import { z } from 'zod'

const questionBankSchema = z.object({
  version: z.literal(1),
  questions: z
    .array(
      z.object({
        control: z.string().regex(/^CTL-[A-Z]+-\d{2}$/),
        question: z.string().trim().min(20).endsWith('?'),
        recommendation: z.string().trim().min(20),
      }),
    )
    .min(1),
})

export type AuthoredQuestion = z.infer<typeof questionBankSchema>['questions'][number]

/** Reads the authored question file; every control may appear only once. */
export const parseQuestionBank = (source: string): AuthoredQuestion[] => {
  const { questions } = questionBankSchema.parse(parse(source))
  const seen = new Set<string>()
  for (const item of questions) {
    if (seen.has(item.control)) throw new Error(`Control ${item.control} has two questions.`)
    seen.add(item.control)
  }
  return questions
}

/** Q-BRE-01 for CTL-BRE-01. */
export const questionCode = (controlCode: string): string => controlCode.replace(/^CTL-/, 'Q-')

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
  /** The control's own evidence: needed to answer Yes. */
  required: string[]
  /** Evidence the linked obligations expect that the control does not already list. */
  recommended: string[]
  /** Standard document requests (PBC list) for the control's domain. */
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

// Penalty tiers (Schedule to the Act) mapped to a 1-5 impact weight. Obligations under other
// laws carry no DPDP tier and are weighted as "any other provision".
const TIER_WEIGHT: Record<string, number> = { P1: 5, P2: 5, P3: 4, P4: 4, P7: 3, P6: 2, P5: 1 }
const OTHER_LAW_WEIGHT = 3
const UNLINKED_WEIGHT = 2

/** Impact weight of a question: the heaviest penalty tier among its obligations. */
export const riskWeight = (tiers: readonly (string | null)[]): number => {
  if (tiers.length === 0) return UNLINKED_WEIGHT
  return Math.max(...tiers.map((tier) => (tier ? (TIER_WEIGHT[tier] ?? 3) : OTHER_LAW_WEIGHT)))
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
