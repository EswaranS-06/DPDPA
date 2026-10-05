import { Chip } from '@duatf/core-ui'
import type { QuestionDetail, QuestionListItem } from '@duatf/feature-framework-library-api'

type AnswerType = QuestionListItem['answerType']
type RiskLevel = QuestionListItem['riskLevel']
type AnswerOutcome = QuestionDetail['options'][number]['outcome']

export const ANSWER_TYPE_LABEL: Record<AnswerType, string> = {
  yes_no: 'Yes / No',
  maturity: 'Maturity 0-4',
  choice: 'Choice',
  multi_choice: 'Several choices',
  text: 'Free text',
}

/** What choosing an option means for compliance. */
export const OUTCOME_LABEL: Record<AnswerOutcome, string> = {
  compliant: 'Compliant',
  potential_gap: 'Potential gap (counts half)',
  gap: 'Gap',
  informational: 'Recorded, not scored',
}

const RISK = {
  critical: { label: 'Critical risk', tone: 'danger' },
  high: { label: 'High risk', tone: 'warning' },
  medium: { label: 'Medium risk', tone: 'neutral' },
  low: { label: 'Low risk', tone: 'neutral' },
} as const

/** The risk weight the template gives a question. */
export const RiskLevelChip = ({ level }: { level: RiskLevel }) => (
  <Chip tone={RISK[level].tone} title="Risk weight from the ComplyX template">
    {RISK[level].label}
  </Chip>
)
