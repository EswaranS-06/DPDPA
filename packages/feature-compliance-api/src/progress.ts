import type { Answer, ComplianceState, ReviewState } from '@duatf/platform-db'

/** The gap rule. The database computes the same mapping in assessment_item.compliance_state. */
export const COMPLIANCE_OF: Record<Answer, ComplianceState> = {
  yes: 'compliant',
  partial: 'potential_gap',
  no: 'gap',
  not_applicable: 'excluded',
  not_assessed: 'pending',
}

export type StateCount = { complianceState: ComplianceState; reviewState: ReviewState; n: number }

export type Progress = {
  total: number
  answered: number
  pending: number
  compliant: number
  potentialGap: number
  gap: number
  excluded: number
  accepted: number
  returned: number
  /** Answered share of all questions, one decimal. */
  progressPct: number
  /**
   * (Yes + half of Partial) over the answered questions in scope (Yes, Partial, No), one
   * decimal; null until something in scope is answered. Not applicable is left out.
   */
  compliancePct: number | null
  /** Accepted share of answered questions, one decimal; null until something is answered. */
  reviewedPct: number | null
}

const percent = (part: number, whole: number): number | null =>
  whole === 0 ? null : Math.round((part * 1000) / whole) / 10

/** Progress and compliance of a set of items, from counts by state. */
export const summariseProgress = (counts: readonly StateCount[]): Progress => {
  const sum = (match: (row: StateCount) => boolean) =>
    counts.filter(match).reduce((total, row) => total + row.n, 0)
  const byState = (state: ComplianceState) => sum((row) => row.complianceState === state)
  const total = sum(() => true)
  const pending = byState('pending')
  const compliant = byState('compliant')
  const potentialGap = byState('potential_gap')
  const gap = byState('gap')
  const answered = total - pending
  const inScope = compliant + potentialGap + gap
  return {
    total,
    answered,
    pending,
    compliant,
    potentialGap,
    gap,
    excluded: byState('excluded'),
    accepted: sum((row) => row.reviewState === 'accepted' && row.complianceState !== 'pending'),
    returned: sum((row) => row.reviewState === 'returned' && row.complianceState !== 'pending'),
    progressPct: percent(answered, total) ?? 0,
    // Doubling both sides keeps "half of Partial" in whole numbers.
    compliancePct: percent(compliant * 2 + potentialGap, inScope * 2),
    reviewedPct: percent(
      sum((row) => row.reviewState === 'accepted' && row.complianceState !== 'pending'),
      answered,
    ),
  }
}
