import {
  ACTION_STATUSES,
  ANSWERS,
  APPLICABILITY_STATES,
  ASSESSMENT_STATUSES,
  CLIENT_STATUSES,
  COMPLIANCE_STATES,
  EVIDENCE_STATUSES,
  FINDING_STATUSES,
  GAP_TYPES,
  REVIEW_STATES,
  RISK_STATUSES,
  USER_STATUSES,
} from '@duatf/platform-db'
import { describe, expect, it } from 'vitest'
import { STATUS, type StatusKinds } from './status'

/** The values each kind can take, read from the database schema at test time. */
const VALUES: { [K in keyof StatusKinds]: readonly StatusKinds[K][] } = {
  answer: ANSWERS,
  compliance: COMPLIANCE_STATES,
  review: REVIEW_STATES,
  assessment: ASSESSMENT_STATUSES,
  action: ACTION_STATUSES,
  finding: FINDING_STATUSES,
  gap: GAP_TYPES,
  risk: RISK_STATUSES,
  evidence: EVIDENCE_STATUSES,
  client: CLIENT_STATUSES,
  applicability: APPLICABILITY_STATES,
  user: USER_STATUSES,
}

describe('status language', () => {
  it('TC-C16.1-02 every database state has a label, a tone and an icon, and no stray entries', () => {
    const problems: string[] = []
    for (const kind of Object.keys(VALUES) as (keyof StatusKinds)[]) {
      const entries: Record<string, { label: string; tone: string; icon: unknown }> = STATUS[kind]
      const values: readonly string[] = VALUES[kind]
      for (const value of values) {
        const entry = entries[value]
        if (!entry) problems.push(`${kind}.${value} has no entry`)
        else if (!entry.label.trim() || !entry.tone || !entry.icon) {
          problems.push(`${kind}.${value} lacks a label, tone or icon`)
        }
      }
      for (const value of Object.keys(entries)) {
        if (!values.includes(value)) problems.push(`${kind}.${value} is not a database value`)
      }
      const labels = values.map((value) => entries[value]?.label)
      if (new Set(labels).size !== labels.length) problems.push(`${kind} repeats a label`)
    }
    expect(problems).toEqual([])
  })
})
