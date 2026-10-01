import { can } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Callout, Chip, Disclosure, EmptyState, PageHeader, Panel, Timeline } from '@duatf/core-ui'
import {
  ANSWER_LABEL,
  getItem,
  NotFoundError,
  listDepartments,
  listEvidence,
  listItemEvidence,
} from '@duatf/feature-compliance-api'
import { LegalReference } from '@duatf/feature-framework-library'
import { describeApplicability, kbHref } from '@duatf/feature-framework-library-api'
import {
  ArrowLeft,
  ArrowRight,
  FileCheck,
  FilePlus,
  RotateCcw,
  Network,
  PencilLine,
  ShieldQuestionMark,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ComplianceChip, ReviewChip } from '@/components/assessment/AssessmentBits'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { LinkEvidenceForm, UploadEvidenceForm } from '@/components/forms/EvidenceForms'
import formStyles from '@/components/forms/forms.module.css'
import { AnswerForm, AssignForm, ReviewForm } from '@/components/forms/AssessmentForms'
import { Status } from '@/components/status'
import { libraryApi, today } from '@/server/api'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../../../clients.module.css'
import {
  linkEvidenceAction,
  unlinkEvidenceAction,
  uploadEvidenceAction,
} from '../../../../evidence/actions'
import { answerItemAction, assignItemsAction, reviewItemAction } from '../../../actions'
import local from './item.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string; q: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).q),
})

const EvidenceList = ({ items, empty }: { items: string[]; empty: string }) =>
  items.length ? (
    <ul className={styles.bullets}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className={`${styles.flush} ${styles.muted}`}>{empty}</p>
  )

const HOW_ANSWERS_COUNT = [
  { answer: 'Yes', outcome: 'Compliant, once the required evidence is accepted.' },
  {
    answer: 'Partial',
    outcome: 'A potential gap: a finding is raised and the answer counts half.',
  },
  { answer: 'No', outcome: 'A gap: a finding is raised with the recommended action.' },
  { answer: 'Not applicable', outcome: 'Left out of the score; a reason is required.' },
]

type TrailEntry = { at: Date; text: string }

export default async function Page({ params }: Props) {
  const { code, asm, q } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const detail = await getItem(
    ctx,
    client.id,
    decodeURIComponent(asm),
    decodeURIComponent(q),
  ).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const { item, question, assessment } = detail
  const api = await libraryApi()
  const [law, release] = await Promise.all([
    api.question({ code: question.code }).catch(() => null),
    api.release(),
  ])
  const scope = { clientId: client.id, departmentId: item.departmentId }
  const base = `/clients/${client.code}/assessments/${assessment.code}`
  const target = {
    clientId: client.id,
    clientCode: client.code,
    assessmentCode: assessment.code,
    itemId: item.id,
  }
  const canAnswer = can(ctx.principal, 'assessment.answer', scope)
  const canReview = can(ctx.principal, 'assessment.review', { clientId: client.id })
  const canAssign = can(ctx.principal, 'assessment.assign', { clientId: client.id })
  const locked =
    assessment.status === 'completed'
      ? 'This assessment is completed, so its answers are locked. A re-assessment starts a new cycle.'
      : assessment.status === 'in_review' && item.reviewState !== 'returned'
        ? 'This assessment is in review. Only answers sent back can be changed.'
        : undefined
  const departments = canAssign ? await listDepartments(ctx, client.id) : []
  const canUpload = can(ctx.principal, 'evidence.upload', scope)
  const [attached, repository] = await Promise.all([
    listItemEvidence(ctx, client.id, item.id),
    canUpload ? listEvidence(ctx, client.id) : Promise.resolve([]),
  ])
  const evidenceTarget = {
    clientId: client.id,
    clientCode: client.code,
    returnPath: `${base}/items/${question.code}`,
  }
  const unlink = unlinkEvidenceAction.bind(null, evidenceTarget)

  const trail: TrailEntry[] = [
    ...(item.answeredAt
      ? [
          {
            at: item.answeredAt,
            text: `Answered ${ANSWER_LABEL[item.answer]} by ${item.answeredByName ?? 'someone'}`,
          },
        ]
      : []),
    ...attached.map((row) => ({
      at: row.uploadedAt,
      text: `${row.title} uploaded by ${row.uploadedByName ?? 'someone'}`,
    })),
    ...(item.reviewedAt && item.reviewState !== 'not_reviewed'
      ? [
          {
            at: item.reviewedAt,
            text: `${item.reviewState === 'accepted' ? 'Accepted' : 'Sent back'} by ${item.reviewedByName ?? 'a reviewer'}`,
          },
        ]
      : []),
  ].sort((a, b) => a.at.getTime() - b.at.getTime())

  return (
    <>
      <PageHeader
        kicker={
          <span className={local.kicker}>
            <span className="code">{question.code}</span>
            <span>
              Control{' '}
              <Link href={kbHref('controls', question.controlCode)} className="code">
                {question.controlCode}
              </Link>
            </span>
            <span>{law?.domain.title ?? question.domainCode}</span>
          </span>
        }
        title={question.text}
        lede={describeApplicability(question.applicability)}
      >
        <ComplianceChip state={item.complianceState} />
        <ReviewChip review={item.reviewState} />
        <Chip icon={Network}>{item.departmentName ?? 'No department yet'}</Chip>
        <Chip
          tone={
            question.riskWeight >= 5 ? 'danger' : question.riskWeight >= 4 ? 'warning' : 'neutral'
          }
          title="Impact weight, from the penalty tier of the linked obligations"
        >
          Impact {question.riskWeight} of 5
        </Chip>
        {law?.reviewStatus === 'draft' ? (
          <Chip tone="pending" icon={ShieldQuestionMark}>
            Draft wording, awaiting legal review
          </Chip>
        ) : null}
      </PageHeader>

      <div className={styles.twoColumn}>
        <div className={local.work}>
          <Panel
            title={
              item.answer === 'not_assessed' ? 'Answer' : `Answer: ${ANSWER_LABEL[item.answer]}`
            }
            titleId="answer-title"
          >
            {detail.previousCycle && detail.previousCycle.answer !== 'not_assessed' ? (
              <Callout tone="neutral" icon={RotateCcw} title="Last cycle">
                <Status kind="answer" value={detail.previousCycle.answer} />
                {detail.previousCycle.comment ? <p>{detail.previousCycle.comment}</p> : null}
              </Callout>
            ) : null}
            {item.reviewState === 'returned' && item.reviewNote ? (
              <Callout tone="danger" title="Sent back by the reviewer" role="status">
                <p>{item.reviewNote}</p>
              </Callout>
            ) : null}
            {canAnswer ? (
              <AnswerForm
                action={answerItemAction.bind(null, target)}
                current={{ answer: item.answer, naReason: item.naReason, comment: item.comment }}
                disabled={locked}
              />
            ) : (
              <>
                {item.naReason ? (
                  <p className={styles.flush}>Why not applicable: {item.naReason}</p>
                ) : null}
                {item.comment ? <p className={styles.flush}>{item.comment}</p> : null}
                <Callout tone="locked">
                  {item.departmentId
                    ? `The ${item.departmentName ?? ''} department or the audit team answers this question.`
                    : 'This question is not yet assigned to a department. The audit team or the DPO assigns it.'}
                </Callout>
              </>
            )}
          </Panel>

          <Panel title={`Evidence (${attached.length})`} titleId="evidence-title" padding="flush">
            <div className={local.panelBody}>
              {attached.length === 0 ? (
                <EmptyState icon={FileCheck} title="No evidence attached yet" size="quiet">
                  An answer of Yes counts once the required evidence is accepted by an auditor. The
                  list beside this panel says what to provide.
                </EmptyState>
              ) : (
                <EvidenceTable
                  rows={attached}
                  clientCode={client.code}
                  action={
                    canUpload
                      ? (row) => (
                          <form action={unlink}>
                            <input type="hidden" name="evidenceId" value={row.id} />
                            <input type="hidden" name="itemId" value={item.id} />
                            <button type="submit" className={formStyles.linkish}>
                              Unlink<span className="visually-hidden"> {row.title}</span>
                            </button>
                          </form>
                        )
                      : undefined
                  }
                />
              )}
              {canUpload && assessment.status !== 'completed' ? (
                <Disclosure
                  summary="Add evidence"
                  icon={FilePlus}
                  defaultOpen={attached.length === 0}
                >
                  <UploadEvidenceForm
                    action={uploadEvidenceAction.bind(null, evidenceTarget)}
                    itemId={item.id}
                  />
                  <LinkEvidenceForm
                    action={linkEvidenceAction.bind(null, evidenceTarget)}
                    itemId={item.id}
                    options={repository
                      .filter((row) => !attached.some((linked) => linked.id === row.id))
                      .map((row) => ({ value: row.id, label: `${row.code} ${row.title}` }))}
                  />
                </Disclosure>
              ) : null}
            </div>
          </Panel>

          {canReview && item.answer !== 'not_assessed' && assessment.status !== 'completed' ? (
            <Panel title="Review this answer" titleId="review-title">
              <p className={`${styles.flush} ${styles.muted}`}>
                The reviewer must not be the person who answered. Accept when the evidence supports
                the answer; send it back with a note otherwise.
              </p>
              <ReviewForm action={reviewItemAction.bind(null, target)} />
            </Panel>
          ) : null}

          {canAssign && assessment.status !== 'completed' ? (
            <Panel title="Department" titleId="assign-title">
              <AssignForm
                action={assignItemsAction.bind(null, { ...target, assessmentId: assessment.id })}
                departments={departments
                  .filter((row) => row.active)
                  .map((row) => ({ value: row.id, label: row.name }))}
                itemId={item.id}
                currentDepartmentId={item.departmentId}
              />
            </Panel>
          ) : null}

          <Panel title="Evidence trail" titleId="trail-title">
            {trail.length === 0 ? (
              <p className={`${styles.flush} ${styles.muted}`}>
                Nothing recorded yet. The answer, each file and the review appear here with who and
                when.
              </p>
            ) : (
              <Timeline
                label="Evidence trail"
                entries={trail.map((entry) => ({
                  key: `${entry.at.toISOString()}-${entry.text}`,
                  when: formatIst(entry.at),
                  what: entry.text,
                }))}
              />
            )}
          </Panel>
        </div>

        <aside className={local.guide} aria-label="Guidance from the knowledge base">
          <section className={local.guideSection} aria-labelledby="why-title">
            <h2 id="why-title" className={local.guideTitle}>
              What this checks
            </h2>
            {law?.control.description ? (
              <p className={styles.flush}>{law.control.description}</p>
            ) : null}
            <p className={`${styles.flush} ${styles.muted}`}>
              How the audit team tests it: {question.guidance}
            </p>
          </section>
          <section className={local.guideSection} aria-labelledby="evidence-guide-title">
            <h2 id="evidence-guide-title" className={local.guideTitle}>
              Evidence to provide
            </h2>
            <EvidenceList items={question.evidenceRequired} empty="None listed." />
            {question.evidenceRecommended.length ? (
              <>
                <h3 className={local.guideSub}>Also expected</h3>
                <EvidenceList items={question.evidenceRecommended} empty="" />
              </>
            ) : null}
            {question.evidenceSupporting.length ? (
              <>
                <h3 className={local.guideSub}>Supporting</h3>
                <EvidenceList items={question.evidenceSupporting} empty="" />
              </>
            ) : null}
          </section>
          <section className={local.guideSection} aria-labelledby="fix-title">
            <h2 id="fix-title" className={local.guideTitle}>
              If the answer is No or Partial
            </h2>
            <p className={styles.flush}>{question.recommendation}</p>
          </section>
          <LegalReference
            obligations={law?.obligations ?? []}
            references={question.references}
            today={today()}
            release={release.version}
          />
          <Disclosure summary="How answers count" icon={PencilLine}>
            <ul className={styles.bullets}>
              {HOW_ANSWERS_COUNT.map((row) => (
                <li key={row.answer}>
                  <strong>{row.answer}</strong>: {row.outcome}
                </li>
              ))}
            </ul>
          </Disclosure>
          <p className={`${styles.flush} ${styles.muted}`}>
            <Link href={kbHref('questions', question.code)}>
              Open {question.code} in the knowledge base
            </Link>
          </p>
        </aside>
      </div>

      <nav aria-label="Other questions" className={styles.pager}>
        {detail.previousCode ? (
          <Link href={`${base}/items/${detail.previousCode}`}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="code">{detail.previousCode}</span>
          </Link>
        ) : (
          <span />
        )}
        <Link href={base}>All questions</Link>
        {detail.nextCode ? (
          <Link href={`${base}/items/${detail.nextCode}`}>
            <span className="code">{detail.nextCode}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  )
}
