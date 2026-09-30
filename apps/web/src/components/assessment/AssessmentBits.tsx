import { Chip, type ChipTone } from '@duatf/core-ui'
import {
  ASSESSMENT_STATUS_LABEL,
  COMPLIANCE_LABEL,
  REVIEW_LABEL,
  type Progress,
} from '@duatf/feature-compliance-api'
import type { AssessmentStatus, ComplianceState, ReviewState } from '@duatf/platform-db'
import styles from './AssessmentBits.module.css'

const STATUS_TONE: Record<AssessmentStatus, ChipTone> = {
  draft: 'neutral',
  in_progress: 'accent',
  in_review: 'pending',
  completed: 'live',
}

const STATE_TONE: Record<ComplianceState, ChipTone> = {
  compliant: 'live',
  potential_gap: 'pending',
  gap: 'severe',
  excluded: 'neutral',
  pending: 'neutral',
}

const REVIEW_TONE: Record<ReviewState, ChipTone> = {
  not_reviewed: 'neutral',
  accepted: 'live',
  returned: 'severe',
}

export const AssessmentStatusChip = ({ status }: { status: AssessmentStatus }) => (
  <Chip tone={STATUS_TONE[status]}>{ASSESSMENT_STATUS_LABEL[status]}</Chip>
)

export const ComplianceChip = ({ state }: { state: ComplianceState }) => (
  <Chip tone={STATE_TONE[state]}>{COMPLIANCE_LABEL[state]}</Chip>
)

export const ReviewChip = ({ review }: { review: ReviewState }) =>
  review === 'not_reviewed' ? null : <Chip tone={REVIEW_TONE[review]}>{REVIEW_LABEL[review]}</Chip>

const SEGMENTS = [
  { key: 'compliant', label: 'Compliant', className: styles.compliant },
  { key: 'potentialGap', label: 'Potential gap', className: styles.potential },
  { key: 'gap', label: 'Gap', className: styles.gap },
  { key: 'excluded', label: 'Not applicable', className: styles.excluded },
] as const

/** One bar per assessment: answered questions coloured by outcome, the rest left empty. */
export const ProgressBar = ({ progress, label }: { progress: Progress; label?: string }) => {
  const summary = SEGMENTS.map(
    (segment) => `${progress[segment.key]} ${segment.label.toLowerCase()}`,
  )
    .concat(`${progress.pending} not assessed`)
    .join(', ')
  return (
    <div className={styles.barWrap}>
      <div className={styles.bar} role="img" aria-label={`${label ? `${label}: ` : ''}${summary}`}>
        {SEGMENTS.map((segment) =>
          progress[segment.key] > 0 ? (
            <span
              key={segment.key}
              className={`${styles.segment} ${segment.className}`}
              style={{ flexGrow: progress[segment.key] }}
              title={`${segment.label}: ${progress[segment.key]}`}
            />
          ) : null,
        )}
        {progress.pending > 0 ? (
          <span
            className={styles.segment}
            style={{ flexGrow: progress.pending }}
            title={`Not assessed: ${progress.pending}`}
          />
        ) : null}
      </div>
    </div>
  )
}

export const Legend = () => (
  <ul className={styles.legend}>
    {SEGMENTS.map((segment) => (
      <li key={segment.key}>
        <span className={`${styles.swatch} ${segment.className}`} aria-hidden="true" />
        {segment.label}
      </li>
    ))}
    <li>
      <span className={styles.swatch} aria-hidden="true" />
      Not assessed
    </li>
  </ul>
)

const shown = (value: number | null) => (value === null ? '—' : `${value}%`)

/** The headline numbers of an assessment. */
export const Metrics = ({ progress }: { progress: Progress }) => (
  <dl className={styles.metrics}>
    <div>
      <dt>Answered</dt>
      <dd>{shown(progress.progressPct)}</dd>
      <span className={styles.metricNote}>
        {progress.answered} of {progress.total} questions
      </span>
    </div>
    <div>
      <dt>Compliance</dt>
      <dd>{shown(progress.compliancePct)}</dd>
      <span className={styles.metricNote}>Yes, plus half of Partial, over answered in scope</span>
    </div>
    <div>
      <dt>Gaps</dt>
      <dd>{progress.gap + progress.potentialGap}</dd>
      <span className={styles.metricNote}>
        {progress.gap} gaps, {progress.potentialGap} potential
      </span>
    </div>
    <div>
      <dt>Reviewed</dt>
      <dd>{shown(progress.reviewedPct)}</dd>
      <span className={styles.metricNote}>
        {progress.accepted} accepted, {progress.returned} sent back
      </span>
    </div>
  </dl>
)
