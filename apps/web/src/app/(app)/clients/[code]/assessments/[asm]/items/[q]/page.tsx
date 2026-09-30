import { can } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Chip, Citation, MarginRow } from '@duatf/core-ui'
import {
  ANSWER_LABEL,
  getItem,
  NotFoundError,
  listDepartments,
  listEvidence,
  listItemEvidence,
} from '@duatf/feature-compliance-api'
import { describeApplicability, kbHref } from '@duatf/feature-framework-library-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ComplianceChip, ReviewChip } from '@/components/assessment/AssessmentBits'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { LinkEvidenceForm, UploadEvidenceForm } from '@/components/forms/EvidenceForms'
import formStyles from '@/components/forms/forms.module.css'
import { AnswerForm, AssignForm, ReviewForm } from '@/components/forms/AssessmentForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../../../clients.module.css'
import {
  linkEvidenceAction,
  unlinkEvidenceAction,
  uploadEvidenceAction,
} from '../../../../evidence/actions'
import { answerItemAction, assignItemsAction, reviewItemAction } from '../../../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string; q: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).q),
})

const EvidenceList = ({ items }: { items: string[] }) =>
  items.length ? (
    <ul className={styles.bullets}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : (
    <span className={styles.muted}>None</span>
  )

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
      ? 'This assessment is completed; answers are locked.'
      : assessment.status === 'in_review' && item.reviewState !== 'returned'
        ? 'This assessment is under review; only answers sent back can be changed.'
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

  return (
    <article className={styles.section} aria-labelledby="question-text">
      <nav aria-label="Breadcrumb" className={styles.muted}>
        <Link href={base}>{assessment.title}</Link> / {question.domainCode} / {question.code}
      </nav>
      <header className={styles.header}>
        <span className={styles.code}>
          {question.code} ·{' '}
          <Link href={kbHref('controls', question.controlCode)}>{question.controlCode}</Link>
        </span>
        <h2 id="question-text" className={styles.questionTitle}>
          {question.text}
        </h2>
        <div className={styles.chips}>
          <ComplianceChip state={item.complianceState} />
          <ReviewChip review={item.reviewState} />
          <Chip>{item.departmentName ?? 'Not assigned to a department'}</Chip>
          <Chip
            tone={
              question.riskWeight >= 5 ? 'severe' : question.riskWeight >= 4 ? 'pending' : 'neutral'
            }
          >
            Impact {question.riskWeight}/5
          </Chip>
        </div>
        <p className={styles.sectionIntro}>{describeApplicability(question.applicability)}</p>
      </header>

      <div className={styles.twoColumn}>
        <div className={styles.section}>
          <section className={`${styles.section} ${styles.panel}`} aria-labelledby="answer-title">
            <h3 id="answer-title" className={styles.subTitle}>
              {item.answer === 'not_assessed' ? 'Answer' : `Answer: ${ANSWER_LABEL[item.answer]}`}
            </h3>
            {detail.previousCycle && detail.previousCycle.answer !== 'not_assessed' ? (
              <p className={styles.muted}>
                Last cycle: {ANSWER_LABEL[detail.previousCycle.answer]}
                {detail.previousCycle.comment ? ` — ${detail.previousCycle.comment}` : ''}
              </p>
            ) : null}
            {item.answeredAt ? (
              <p className={styles.muted}>
                By {item.answeredByName ?? 'someone'}, {formatIst(item.answeredAt)}
              </p>
            ) : null}
            {canAnswer ? (
              <AnswerForm
                action={answerItemAction.bind(null, target)}
                current={{ answer: item.answer, naReason: item.naReason, comment: item.comment }}
                disabled={locked}
              />
            ) : (
              <>
                {item.naReason ? <p>Why not applicable: {item.naReason}</p> : null}
                {item.comment ? <p>{item.comment}</p> : null}
                <p className={styles.muted}>
                  {item.departmentId
                    ? `Answered by the ${item.departmentName ?? ''} department or the audit team.`
                    : 'Not yet assigned to a department.'}
                </p>
              </>
            )}
          </section>

          <section className={styles.section} aria-labelledby="evidence-title">
            <h3 id="evidence-title" className={styles.subTitle}>
              Evidence
            </h3>
            {attached.length === 0 ? (
              <p className={styles.muted}>No evidence attached yet.</p>
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
                            Unlink
                          </button>
                        </form>
                      )
                    : undefined
                }
              />
            )}
            {canUpload && assessment.status !== 'completed' ? (
              <div className={`${styles.section} ${styles.panel}`}>
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
              </div>
            ) : null}
          </section>

          {item.reviewState !== 'not_reviewed' ? (
            <section className={styles.section} aria-labelledby="review-state">
              <h3 id="review-state" className={styles.subTitle}>
                Review
              </h3>
              <p>
                {item.reviewState === 'accepted' ? 'Accepted' : 'Sent back'}
                {item.reviewedByName ? ` by ${item.reviewedByName}` : ''}
                {item.reviewedAt ? `, ${formatIst(item.reviewedAt)}` : ''}.
              </p>
              {item.reviewNote ? (
                <blockquote className={styles.quote}>{item.reviewNote}</blockquote>
              ) : null}
            </section>
          ) : null}

          {canReview && item.answer !== 'not_assessed' && assessment.status !== 'completed' ? (
            <section className={`${styles.section} ${styles.panel}`} aria-labelledby="review-title">
              <h3 id="review-title" className={styles.subTitle}>
                Review this answer
              </h3>
              <ReviewForm action={reviewItemAction.bind(null, target)} />
            </section>
          ) : null}

          {canAssign && assessment.status !== 'completed' ? (
            <section className={styles.section} aria-labelledby="assign-title">
              <h3 id="assign-title" className={styles.subTitle}>
                Department
              </h3>
              <AssignForm
                action={assignItemsAction.bind(null, { ...target, assessmentId: assessment.id })}
                departments={departments
                  .filter((row) => row.active)
                  .map((row) => ({ value: row.id, label: row.name }))}
                itemId={item.id}
                currentDepartmentId={item.departmentId}
              />
            </section>
          ) : null}
        </div>

        <aside className={styles.section} aria-label="Guidance from the knowledge base">
          <MarginRow margin="Law">
            <span className={styles.roles}>
              {question.references.map((reference) => (
                <Citation key={reference}>{reference}</Citation>
              ))}
            </span>
          </MarginRow>
          <MarginRow margin="How to test it">
            <p className={styles.flush}>{question.guidance}</p>
          </MarginRow>
          <MarginRow margin="Evidence required">
            <EvidenceList items={question.evidenceRequired} />
          </MarginRow>
          <MarginRow margin="Also expected">
            <EvidenceList items={question.evidenceRecommended} />
          </MarginRow>
          <MarginRow margin="Supporting">
            <EvidenceList items={question.evidenceSupporting} />
          </MarginRow>
          <MarginRow margin="If No or Partial">
            <p className={styles.flush}>{question.recommendation}</p>
          </MarginRow>
          <p className={styles.muted}>
            <Link href={kbHref('questions', question.code)}>Open in the knowledge base</Link>
          </p>
        </aside>
      </div>

      <nav aria-label="Other questions" className={styles.pager}>
        {detail.previousCode ? (
          <Link href={`${base}/items/${detail.previousCode}`}>← {detail.previousCode}</Link>
        ) : (
          <span />
        )}
        <Link href={base}>All questions</Link>
        {detail.nextCode ? (
          <Link href={`${base}/items/${detail.nextCode}`}>{detail.nextCode} →</Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
