import { formatDay, formatIst } from '@duatf/core-utils'
import { buttonClass, Callout, Chip, Disclosure, Panel, Timeline } from '@duatf/core-ui'
import type {
  Progress,
  QualityCounts,
  QualityIssue,
  QualityReport,
  QualitySeverity,
  SignoffRow,
} from '@duatf/feature-compliance-api'
import type { AssessmentStatus, SignoffStatus } from '@duatf/platform-db'
import {
  BadgeCheck,
  CircleAlert,
  CircleCheck,
  Hourglass,
  Info,
  ListChecks,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  DecideSignoffForm,
  RequestSignoffForm,
  SignOffNowForm,
  WithdrawSignoffForm,
} from '@/components/forms/SignoffForms'
import type { FormState } from '@/lib/formState'
import styles from './Assurance.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

const SEVERITY: Record<
  QualitySeverity,
  { one: string; many: string; tone: 'danger' | 'warning' | 'info'; icon: LucideIcon }
> = {
  error: { one: 'error', many: 'errors', tone: 'danger', icon: CircleAlert },
  warning: { one: 'warning', many: 'warnings', tone: 'warning', icon: TriangleAlert },
  note: { one: 'note', many: 'notes', tone: 'info', icon: Info },
}
const SEVERITIES: QualitySeverity[] = ['error', 'warning', 'note']

/** "3 errors", as a chip in the severity's tone. */
export const SeverityChip = ({ severity, count }: { severity: QualitySeverity; count: number }) => {
  const look = SEVERITY[severity]
  return (
    <Chip tone={count === 0 ? 'neutral' : look.tone} icon={look.icon}>
      {count} {count === 1 ? look.one : look.many}
    </Chip>
  )
}

export const QualityCountChips = ({ counts }: { counts: QualityCounts }) => (
  <span className={styles.counts}>
    {SEVERITIES.map((severity) => (
      <SeverityChip key={severity} severity={severity} count={counts[severity]} />
    ))}
  </span>
)

/** The quality check in brief, on the assessment page. */
export const QualitySummary = ({ report, href }: { report: QualityReport; href: string }) => {
  const total = report.issues.length
  return (
    <Panel
      title="Quality check"
      titleId="quality-title"
      actions={
        total ? (
          <Link href={href} className={buttonClass('secondary', 'sm')}>
            <ListChecks size={14} aria-hidden="true" />
            Open the quality check
          </Link>
        ) : null
      }
    >
      {total === 0 ? (
        <p className={styles.clean}>
          <CircleCheck size={16} aria-hidden="true" />
          Nothing is flagged: every answer that claims compliance has current evidence, gaps have
          notes, findings have actions and no acceptance has lapsed.
        </p>
      ) : (
        <>
          <QualityCountChips counts={report.counts} />
          <ul className={styles.rules}>
            {report.groups.slice(0, 5).map((group) => (
              <li key={group.rule}>
                <span className={styles.ruleCount}>{group.issues.length}</span>
                {group.title}
              </li>
            ))}
            {report.groups.length > 5 ? (
              <li className={styles.more}>and {report.groups.length - 5} more kinds</li>
            ) : null}
          </ul>
        </>
      )}
    </Panel>
  )
}

const issueHref = (issue: QualityIssue, clientCode: string, assessmentCode: string): string => {
  const base = `/clients/${clientCode}`
  const subject = issue.subject
  switch (subject.kind) {
    case 'item':
      return `${base}/assessments/${assessmentCode}/items/${subject.departmentCode ?? '-'}/${subject.questionCode}`
    case 'finding':
      return `${base}/findings/${subject.code}`
    case 'action':
      return `${base}/actions/${subject.code}`
    case 'risk':
      return subject.findingCode ? `${base}/findings/${subject.findingCode}` : `${base}/risks`
  }
}

/** Every issue, grouped by rule, each linking to the record it is about. */
export const QualityGroups = ({
  report,
  clientCode,
}: {
  report: QualityReport
  clientCode: string
}) => (
  <div className={styles.groups}>
    {report.groups.map((group) => (
      <Panel
        key={group.rule}
        title={group.title}
        titleId={`rule-${group.rule}`}
        actions={<SeverityChip severity={group.severity} count={group.issues.length} />}
      >
        <p className={styles.advice}>{group.advice}</p>
        <ul className={styles.issues}>
          {group.issues.map((issue) => (
            <li key={`${issue.rule}-${issue.label}-${issue.departmentName ?? ''}`}>
              <Link href={issueHref(issue, clientCode, report.assessment.code)}>{issue.label}</Link>
              {issue.departmentName ? (
                <span className={styles.department}>{issue.departmentName}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    ))}
  </div>
)

const SIGNOFF_TEXT: Record<SignoffStatus, string> = {
  requested: 'Sent for sign-off',
  approved: 'Signed off',
  changes_requested: 'Changes asked for',
  withdrawn: 'Request withdrawn',
}

const snapshotText = (row: SignoffRow): string | null => {
  const snapshot = row.snapshot
  if (!snapshot) return null
  const parts = [
    `${snapshot.errors} ${snapshot.errors === 1 ? 'error' : 'errors'}${row.acknowledged ? ' (read and recorded)' : ''}`,
    `${snapshot.warnings} ${snapshot.warnings === 1 ? 'warning' : 'warnings'}`,
    `${snapshot.notes} ${snapshot.notes === 1 ? 'note' : 'notes'}`,
  ]
  const posture =
    snapshot.compliancePct === null ? '' : `, posture ${snapshot.compliancePct}% at that moment`
  return `Quality check at the decision: ${parts.join(', ')}${posture}.`
}

type SignoffPanelProps = {
  status: AssessmentStatus
  progress: Progress
  signoffs: SignoffRow[]
  counts: QualityCounts
  approvers: { value: string; label: string }[]
  can: { request: boolean; signOffNow: boolean; decide: boolean; withdraw: boolean }
  actions: { request: Action; signOffNow: Action; decide: Action; withdraw: Action }
}

/** Where the cycle's sign-off stands, and what the signed-in person can do about it. */
export const SignoffPanel = ({
  status,
  progress,
  signoffs,
  counts,
  approvers,
  can,
  actions,
}: SignoffPanelProps) => {
  if (status === 'draft') return null
  const latest = signoffs[0] ?? null
  const open = signoffs.find((row) => row.status === 'requested') ?? null
  const unchecked = progress.answered - progress.accepted
  const ready = progress.total > 0 && progress.pending === 0 && unchecked === 0
  let body: ReactNode

  if (status === 'completed') {
    body = latest ? (
      <Callout tone="success" icon={BadgeCheck} title={`Signed off by ${latest.approverName}`}>
        <p>
          {latest.decidedAt ? `${formatIst(latest.decidedAt)}. ` : ''}
          {latest.ownDecision ? '' : `Sent by ${latest.requestedByName}. `}
          {latest.decisionNote ?? ''}
        </p>
        {snapshotText(latest) ? <p>{snapshotText(latest)}</p> : null}
      </Callout>
    ) : (
      <p className={styles.plain}>Completed before sign-offs were recorded.</p>
    )
  } else if (status === 'in_review' && open) {
    body = (
      <>
        <Callout
          tone={open.overdue ? 'warning' : 'info'}
          icon={Hourglass}
          title={`Waiting for ${open.approverName} to sign off`}
        >
          <p>
            Sent by {open.requestedByName} on {formatIst(open.requestedAt)}
            {open.dueDate
              ? `, to be decided by ${formatDay(open.dueDate)}${open.overdue ? ' (overdue)' : ''}`
              : ''}
            . Answers are locked until it is decided or withdrawn.
          </p>
          {open.note ? <p>{open.note}</p> : null}
        </Callout>
        {can.decide ? <DecideSignoffForm action={actions.decide} errors={counts.error} /> : null}
        {can.withdraw ? <WithdrawSignoffForm action={actions.withdraw} /> : null}
      </>
    )
  } else {
    body = (
      <>
        {latest?.status === 'changes_requested' ? (
          <Callout tone="warning" title={`${latest.approverName} asked for changes`}>
            <p>
              {latest.decidedAt ? `${formatIst(latest.decidedAt)}. ` : ''}
              {latest.decisionNote}
            </p>
          </Callout>
        ) : null}
        {!ready ? (
          <p className={styles.plain}>
            The cycle can be signed off once every question is answered and every answer is ticked
            as checked. {progress.pending > 0 ? `${progress.pending} not answered. ` : ''}
            {unchecked > 0 ? `${unchecked} not checked.` : ''}
          </p>
        ) : can.signOffNow ? (
          <>
            <SignOffNowForm action={actions.signOffNow} errors={counts.error} />
            {can.request && approvers.length ? (
              <Disclosure summary="Send it to someone else to sign off">
                <RequestSignoffForm action={actions.request} approvers={approvers} />
              </Disclosure>
            ) : null}
          </>
        ) : can.request ? (
          approvers.length ? (
            <RequestSignoffForm action={actions.request} approvers={approvers} />
          ) : (
            <p className={styles.plain}>
              No Senior auditor or Administrator has a login yet, so there is nobody to send the
              cycle to. An Administrator adds one under Team.
            </p>
          )
        ) : (
          <p className={styles.plain}>
            Ready for sign-off by a Senior auditor or an Administrator.
          </p>
        )}
      </>
    )
  }

  return (
    <Panel title="Sign-off" titleId="signoff-title">
      <div className={styles.signoff}>
        {body}
        {signoffs.length > 1 ? (
          <Disclosure summary="Sign-off history" hint={`${signoffs.length} entries`}>
            <Timeline
              label="Sign-off history"
              entries={[...signoffs].reverse().map((row) => ({
                key: row.id,
                when: formatIst(row.decidedAt ?? row.requestedAt),
                what: `${SIGNOFF_TEXT[row.status]}${
                  row.status === 'requested' || row.status === 'withdrawn'
                    ? `, to ${row.approverName}`
                    : ` by ${row.approverName}`
                }${row.decisionNote ? `: ${row.decisionNote}` : ''}`,
              }))}
            />
          </Disclosure>
        ) : null}
      </div>
    </Panel>
  )
}
