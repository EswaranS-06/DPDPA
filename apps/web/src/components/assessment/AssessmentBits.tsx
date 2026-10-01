import { Stat, StatGrid } from '@duatf/core-ui'
import type { Progress } from '@duatf/feature-compliance-api'
import type { AssessmentStatus, ComplianceState, ReviewState } from '@duatf/platform-db'
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  Minus,
  type LucideIcon,
} from 'lucide-react'
import { Status } from '@/components/status'
import styles from './AssessmentBits.module.css'

export const AssessmentStatusChip = ({ status }: { status: AssessmentStatus }) => (
  <Status kind="assessment" value={status} />
)

export const ComplianceChip = ({ state }: { state: ComplianceState }) => (
  <Status kind="compliance" value={state} />
)

export const ReviewChip = ({ review }: { review: ReviewState }) =>
  review === 'not_reviewed' ? null : <Status kind="review" value={review} />

type Segment = {
  key: 'compliant' | 'potentialGap' | 'gap' | 'excluded' | 'pending'
  label: string
  className: string | undefined
  icon: LucideIcon
}

/** The five outcomes of a question, in reading order. Answers left to right, then the rest. */
export const SEGMENTS: readonly Segment[] = [
  { key: 'compliant', label: 'Yes', className: styles.yes, icon: CircleCheck },
  { key: 'potentialGap', label: 'Partial', className: styles.partial, icon: CircleAlert },
  { key: 'gap', label: 'No', className: styles.no, icon: CircleX },
  { key: 'excluded', label: 'Not applicable', className: styles.na, icon: Minus },
  { key: 'pending', label: 'Not answered', className: styles.pending, icon: CircleDashed },
]

const describe = (progress: Progress) =>
  SEGMENTS.map((segment) => `${progress[segment.key]} ${segment.label.toLowerCase()}`).join(', ')

/** One bar per set of questions: answers by outcome, then what is not answered yet. */
export const ProgressBar = ({
  progress,
  label,
  size = 'normal',
}: {
  progress: Progress
  label?: string
  size?: 'normal' | 'large'
}) => (
  <div
    className={size === 'large' ? `${styles.bar} ${styles.large}` : styles.bar}
    role="img"
    aria-label={`${label ? `${label}: ` : ''}${describe(progress)}`}
  >
    {SEGMENTS.map((segment) =>
      progress[segment.key] > 0 ? (
        <span
          key={segment.key}
          className={`${styles.segment} ${segment.className ?? ''}`}
          style={{ flexGrow: progress[segment.key] }}
          title={`${segment.label}: ${progress[segment.key]}`}
        />
      ) : null,
    )}
  </div>
)

/** The key to ProgressBar; with counts when a progress is given. */
export const Legend = ({ progress }: { progress?: Progress }) => (
  <ul className={styles.legend}>
    {SEGMENTS.map((segment) => (
      <li key={segment.key}>
        <span className={`${styles.swatch} ${segment.className ?? ''}`} aria-hidden="true" />
        {segment.label}
        {progress ? <span className={styles.legendCount}>{progress[segment.key]}</span> : null}
      </li>
    ))}
  </ul>
)

const shown = (value: number | null) => (value === null ? '—' : `${value}%`)

/** The headline numbers of an assessment. */
export const Metrics = ({ progress }: { progress: Progress }) => (
  <StatGrid label="Assessment figures">
    <Stat
      label="Answered"
      value={shown(progress.progressPct)}
      note={`${progress.answered} of ${progress.total} questions`}
    />
    <Stat
      label="Compliance posture"
      value={shown(progress.compliancePct)}
      note="Yes plus half of Partial, over answered questions in scope"
    />
    <Stat
      label="Gaps"
      value={progress.gap + progress.potentialGap}
      note={`${progress.gap} gaps, ${progress.potentialGap} potential`}
      tone={progress.gap > 0 ? 'danger' : 'default'}
    />
    <Stat
      label="Reviewed"
      value={shown(progress.reviewedPct)}
      note={`${progress.accepted} accepted, ${progress.returned} sent back`}
      tone={progress.returned > 0 ? 'warning' : 'default'}
    />
  </StatGrid>
)
