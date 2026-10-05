import { can } from '@duatf/core-access'
import { formatDay, formatIst } from '@duatf/core-utils'
import { Callout, Chip, Disclosure, EmptyState, PageHeader, Panel, Timeline } from '@duatf/core-ui'
import {
  ANSWER_TYPE_LABEL,
  assignablePeople,
  describeResponse,
  getItem,
  listEvidence,
  listEvidenceRequests,
  listItemEvidence,
  NotFoundError,
  verdict,
} from '@duatf/feature-compliance-api'
import { LegalReference } from '@duatf/feature-framework-library'
import { describeApplicability, kbHref } from '@duatf/feature-framework-library-api'
import {
  ArrowLeft,
  ArrowRight,
  FileCheck,
  FilePlus,
  Gavel,
  Link2,
  Network,
  PencilLine,
  RotateCcw,
  ShieldQuestionMark,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ComplianceChip, ReviewChip } from '@/components/assessment/AssessmentBits'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { AnswerForm, CheckForm } from '@/components/forms/AssessmentForms'
import { EvidenceRequestForm, OwnerSelectForm } from '@/components/forms/AssignForms'
import { SmallActionForm } from '@/components/forms/PeopleForms'
import { LinkEvidenceForm, UploadEvidenceForm } from '@/components/forms/EvidenceForms'
import formStyles from '@/components/forms/forms.module.css'
import { libraryApi, today } from '@/server/api'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../../../../clients.module.css'
import {
  linkEvidenceAction,
  unlinkEvidenceAction,
  uploadEvidenceAction,
} from '../../../../../evidence/actions'
import {
  answerItemAction,
  assignItemAction,
  cancelRequestAction,
  checkItemAction,
  requestEvidenceAction,
} from '../../../../actions'
import local from './item.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string; dep: string; q: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { dep, q } = await params
  return { title: `${decodeURIComponent(q)}, ${decodeURIComponent(dep).toUpperCase()}` }
}

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

const RISK_TONE = {
  critical: 'danger',
  high: 'warning',
  medium: 'neutral',
  low: 'neutral',
} as const
const RISK_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' } as const

const OUTCOME_LABEL = {
  compliant: 'compliant',
  potential_gap: 'a potential gap (counts half)',
  gap: 'a gap',
  informational: 'recorded, not scored',
} as const

type TrailEntry = { at: Date; text: string }

const REQUEST_STATUS = {
  requested: { label: 'Requested', tone: 'warning' },
  received: { label: 'Received, to review', tone: 'pending' },
  accepted: { label: 'Accepted', tone: 'success' },
  cancelled: { label: 'Withdrawn', tone: 'neutral' },
} as const

export default async function Page({ params }: Props) {
  const { code, asm, dep, q } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const detail = await getItem(
    ctx,
    client.id,
    decodeURIComponent(asm),
    decodeURIComponent(dep),
    decodeURIComponent(q),
  ).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const { item, question, assessment, department } = detail
  const api = await libraryApi()
  const [law, release] = await Promise.all([
    api.question({ code: question.code }).catch(() => null),
    api.release(),
  ])
  const base = `/clients/${client.code}/assessments/${assessment.code}`
  const itemPath = `${base}/items/${department.code}/${question.code}`
  const target = {
    clientId: client.id,
    clientCode: client.code,
    assessmentCode: assessment.code,
    itemId: item.id,
  }
  const completed = assessment.status === 'completed'
  const locked = completed
    ? 'This assessment is completed, so its answers are locked. Reopen it, or start the next cycle.'
    : undefined
  const scope = { clientId: client.id, departmentId: item.departmentId }
  const [attached, repository, requests] = await Promise.all([
    listItemEvidence(ctx, client.id, item.id),
    listEvidence(ctx, client.id),
    listEvidenceRequests(ctx, client.id, { itemId: item.id }),
  ])
  const me = ctx.principal.userId
  const canAnswer = can(ctx.principal, 'assessment.answer', scope)
  const canCheck = can(ctx.principal, 'assessment.review', scope)
  const canAssign = can(ctx.principal, 'assessment.assign', scope)
  const openRequests = requests.filter(
    (row) => row.status === 'requested' || row.status === 'received',
  )
  // People at the client may upload for questions given to them or evidence asked of them.
  const canUpload =
    can(ctx.principal, 'evidence.upload', scope) ||
    item.assigneeUserId === me ||
    openRequests.some((row) => row.assigneeUserId === me)
  const people = canAssign ? await assignablePeople(ctx, client.id) : []
  const { blocking, applying } = verdict(detail.gates)
  const evidenceTarget = { clientId: client.id, clientCode: client.code, returnPath: itemPath }
  const unlink = unlinkEvidenceAction.bind(null, evidenceTarget)
  const shape = { answerType: question.answerType, options: question.options }
  const answered = item.answer !== 'not_assessed'

  const trail: TrailEntry[] = [
    ...(item.answeredAt
      ? [
          {
            at: item.answeredAt,
            text: `Answered "${describeResponse(shape, item)}" by ${item.answeredByName ?? 'you'}`,
          },
        ]
      : []),
    ...attached.map((row) => ({
      at: row.uploadedAt,
      text: `${row.title} uploaded by ${row.uploadedByName ?? 'you'}`,
    })),
    ...(item.reviewedAt && item.reviewState === 'accepted'
      ? [{ at: item.reviewedAt, text: `Ticked as checked by ${item.reviewedByName ?? 'you'}` }]
      : []),
  ].sort((a, b) => a.at.getTime() - b.at.getTime())

  return (
    <>
      <PageHeader
        kicker={
          <span className={local.kicker}>
            <span className="code">{question.code}</span>
            <span>{detail.questionnaire.title}</span>
            <span>{question.section}</span>
            <span>{law?.domain.title ?? question.domainCode}</span>
          </span>
        }
        title={question.text}
        lede={question.title}
      >
        <ComplianceChip state={item.complianceState} />
        <ReviewChip review={item.reviewState} />
        <Chip icon={Network}>{department.name}</Chip>
        {item.assigneeName ? <Chip>Given to {item.assigneeName}</Chip> : null}
        <Chip tone={RISK_TONE[question.riskLevel]} title="Risk weight from the template">
          {RISK_LABEL[question.riskLevel]} risk
        </Chip>
        <Chip>{ANSWER_TYPE_LABEL[question.answerType]}</Chip>
        {question.reviewStatus === 'draft' ? (
          <Chip tone="pending" icon={ShieldQuestionMark} title="KB mapping by ComplyX">
            Mapping awaiting legal review
          </Chip>
        ) : null}
      </PageHeader>

      <div className={styles.twoColumn}>
        <div className={local.work}>
          <Panel
            title={answered ? `Answer: ${describeResponse(shape, item)}` : 'Answer'}
            titleId="answer-title"
          >
            {blocking ? (
              <Callout tone="neutral" icon={Link2} title="Not applicable, from another answer">
                <p>
                  {blocking.gate.reason} Change{' '}
                  <span className="code">{blocking.gate.question}</span> if that is wrong; this
                  question then needs an answer again.
                </p>
              </Callout>
            ) : applying ? (
              <Callout tone="neutral" icon={Link2} title="This question applies">
                <p>
                  <span className="code">{applying.gate.question}</span> is answered{' '}
                  {applying.values.map((value) => `"${value}"`).join(', ')}, so it cannot be Not
                  applicable.
                </p>
              </Callout>
            ) : null}
            {detail.previousCycle && detail.previousCycle.answer !== 'not_assessed' ? (
              <Callout tone="neutral" icon={RotateCcw} title="Last cycle">
                <p>{describeResponse(shape, detail.previousCycle)}</p>
                {detail.previousCycle.comment ? <p>{detail.previousCycle.comment}</p> : null}
              </Callout>
            ) : null}
            {canAnswer ? (
              <AnswerForm
                action={answerItemAction.bind(null, target)}
                shape={shape}
                current={{
                  answer: item.answer,
                  response: item.response,
                  naReason: item.naReason,
                  comment: item.comment,
                }}
                disabled={locked}
                gate={blocking ? 'ruled_out' : applying ? 'applies' : undefined}
              />
            ) : (
              <>
                <p className={styles.flush}>
                  {answered ? describeResponse(shape, item) : 'Not answered yet.'}
                </p>
                {item.naReason ? (
                  <p className={styles.flush}>Why not applicable: {item.naReason}</p>
                ) : null}
                {item.comment ? <p className={styles.flush}>Notes: {item.comment}</p> : null}
                <Callout tone="locked">
                  <p>
                    The ComplyX audit team fills in the answers. You can review them here and upload
                    evidence below.
                  </p>
                </Callout>
              </>
            )}
          </Panel>

          {canAssign && !completed ? (
            <Panel title="Given to" titleId="assignee-title">
              <p className={`${styles.flush} ${styles.muted}`}>
                The person at the client who owns this question. With a login they see it under Your
                work and can upload evidence for it.
              </p>
              <OwnerSelectForm
                action={assignItemAction.bind(null, target)}
                name="assigneeUserId"
                label="Given to"
                options={people}
                current={item.assigneeUserId}
              />
            </Panel>
          ) : null}

          {answered && !completed && canCheck ? (
            <Panel title="Self-check" titleId="check-title">
              <p className={`${styles.flush} ${styles.muted}`}>
                {item.reviewState === 'accepted'
                  ? 'You ticked this answer as checked. Changing the answer removes the tick.'
                  : 'Tick the answer once you have looked at its evidence. A cycle completes when every answer is ticked.'}
              </p>
              <CheckForm
                action={checkItemAction.bind(null, target)}
                checked={item.reviewState === 'accepted'}
              />
            </Panel>
          ) : null}

          <Panel title={`Evidence requests (${openRequests.length} open)`} titleId="requests-title">
            {requests.length === 0 ? (
              <p className={`${styles.flush} ${styles.muted}`}>
                Nothing requested yet.
                {canAssign
                  ? ' Ask for the files you need below; each request shows who and by when.'
                  : ''}
              </p>
            ) : (
              <ul className={local.requests}>
                {requests.map((row) => (
                  <li key={row.id} className={local.request}>
                    <span className={styles.personCell}>
                      <span>{row.title}</span>
                      <span className={styles.muted}>
                        {row.assigneeName ? `From ${row.assigneeName}` : 'From anyone'}
                        {row.dueDate ? `, by ${formatDay(row.dueDate)}` : ''}
                        {row.evidenceCode ? `, answered by ${row.evidenceCode}` : ''}
                        {row.note ? `. ${row.note}` : ''}
                      </span>
                    </span>
                    <span className={styles.roles}>
                      <Chip tone={row.overdue ? 'danger' : REQUEST_STATUS[row.status].tone}>
                        {row.overdue ? 'Overdue' : REQUEST_STATUS[row.status].label}
                      </Chip>
                      {canAssign && (row.status === 'requested' || row.status === 'received') ? (
                        <SmallActionForm
                          action={cancelRequestAction.bind(null, {
                            clientId: client.id,
                            clientCode: client.code,
                          })}
                          fields={{ requestId: row.id }}
                          label="Withdraw"
                        />
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {canAssign && !completed ? (
              <Disclosure
                summary="Request evidence"
                icon={FilePlus}
                defaultOpen={requests.length === 0}
              >
                <EvidenceRequestForm
                  action={requestEvidenceAction.bind(null, target)}
                  suggestions={[
                    ...question.evidenceRequired,
                    ...question.evidenceRecommended,
                  ].filter((title) => !requests.some((row) => row.title === title))}
                  people={people}
                />
              </Disclosure>
            ) : null}
          </Panel>

          <Panel title={`Evidence (${attached.length})`} titleId="evidence-title" padding="flush">
            <div className={local.panelBody}>
              {attached.length === 0 ? (
                <EmptyState icon={FileCheck} title="No evidence attached yet" size="quiet">
                  Upload the documents that support the answer; the list beside this panel says what
                  to look for.
                </EmptyState>
              ) : (
                <EvidenceTable
                  rows={attached}
                  clientCode={client.code}
                  action={(row) =>
                    !canUpload ? null : (
                      <form action={unlink}>
                        <input type="hidden" name="evidenceId" value={row.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <button type="submit" className={formStyles.linkish}>
                          Unlink<span className="visually-hidden"> {row.title}</span>
                        </button>
                      </form>
                    )
                  }
                />
              )}
              {completed || !canUpload ? null : (
                <Disclosure
                  summary="Add evidence"
                  icon={FilePlus}
                  defaultOpen={attached.length === 0}
                >
                  <UploadEvidenceForm
                    action={uploadEvidenceAction.bind(null, evidenceTarget)}
                    itemId={item.id}
                    requests={openRequests.map((row) => ({ id: row.id, title: row.title }))}
                  />
                  <LinkEvidenceForm
                    action={linkEvidenceAction.bind(null, evidenceTarget)}
                    itemId={item.id}
                    options={repository
                      .filter((row) => !attached.some((linked) => linked.id === row.id))
                      .map((row) => ({ value: row.id, label: `${row.code} ${row.title}` }))}
                  />
                </Disclosure>
              )}
            </div>
          </Panel>

          <Panel title="Trail" titleId="trail-title">
            {trail.length === 0 ? (
              <p className={`${styles.flush} ${styles.muted}`}>
                Nothing recorded yet. The answer, each file and the tick appear here with the time.
              </p>
            ) : (
              <Timeline
                label="Trail"
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
          {law?.penalty ? (
            <section className={local.guideSection} aria-labelledby="penalty-title">
              <h2 id="penalty-title" className={local.guideTitle}>
                <Gavel size={16} aria-hidden="true" /> Highest penalty at stake
              </h2>
              <p className={styles.flush}>
                {law.penalty.text} <span className="code">({law.penalty.tier})</span>
              </p>
              <p className={`${styles.flush} ${styles.muted}`}>
                Schedule to the DPDP Act, 2023, via the obligations below. The Board decides the
                amount case by case (s.33).
              </p>
            </section>
          ) : null}
          <LegalReference
            obligations={law?.obligations ?? []}
            references={question.references}
            today={today()}
            release={release.version}
            defaultOpen
          />
          <section className={local.guideSection} aria-labelledby="why-title">
            <h2 id="why-title" className={local.guideTitle}>
              What this checks
            </h2>
            {(law?.controls ?? []).map((row) => (
              <p key={row.code} className={styles.flush}>
                <Link href={kbHref('controls', row.code)} className="code">
                  {row.code}
                </Link>{' '}
                <strong>{row.title}.</strong> {row.description}
              </p>
            ))}
            <p className={`${styles.flush} ${styles.muted}`}>
              {describeApplicability(question.applicability)}
            </p>
          </section>
          <section className={local.guideSection} aria-labelledby="test-title">
            <h2 id="test-title" className={local.guideTitle}>
              How to test it
            </h2>
            {question.guidance.split('\n').map((line) => (
              <p key={line} className={styles.flush}>
                {line}
              </p>
            ))}
          </section>
          <section className={local.guideSection} aria-labelledby="evidence-guide-title">
            <h2 id="evidence-guide-title" className={local.guideTitle}>
              Evidence to look for
            </h2>
            <EvidenceList items={question.evidenceRequired} empty="None listed." />
            {question.evidenceRecommended.length ? (
              <>
                <h3 className={local.guideSub}>Also expected</h3>
                <EvidenceList items={question.evidenceRecommended} empty="" />
              </>
            ) : null}
            {question.evidenceSupporting.length ? (
              <Disclosure summary="Standard document requests">
                <EvidenceList items={question.evidenceSupporting} empty="" />
              </Disclosure>
            ) : null}
          </section>
          <section className={local.guideSection} aria-labelledby="fix-title">
            <h2 id="fix-title" className={local.guideTitle}>
              If there is a gap
            </h2>
            {question.recommendation.split('\n').map((line) => (
              <p key={line} className={styles.flush}>
                {line}
              </p>
            ))}
          </section>
          <section className={local.guideSection} aria-labelledby="template-title">
            <h2 id="template-title" className={local.guideTitle}>
              From the template
            </h2>
            <p className={styles.flush}>
              Reference in {detail.questionnaire.code}: {question.sourceRef ?? 'none given'}.
            </p>
            {question.mappingNote ? (
              <Callout tone="neutral" title="ComplyX note">
                <p>{question.mappingNote}</p>
              </Callout>
            ) : null}
          </section>
          <Disclosure summary="How answers count" icon={PencilLine}>
            <ul className={styles.bullets}>
              {question.options.map((option) => (
                <li key={option.value}>
                  <strong>{option.label}</strong>: {OUTCOME_LABEL[option.outcome]}.
                </li>
              ))}
              <li>
                <strong>Not applicable</strong>: left out of the score; a reason is required.
              </li>
              {question.answerType === 'text' || question.answerType === 'multi_choice' ? (
                <li>The answer is recorded for the profile; it is not scored.</li>
              ) : null}
            </ul>
          </Disclosure>
          <p className={`${styles.flush} ${styles.muted}`}>
            <Link href={kbHref('questions', question.code)}>
              Open {question.code} in the knowledge base
            </Link>
          </p>
        </aside>
      </div>

      <nav aria-label="Other questions of this department" className={styles.pager}>
        {detail.previousCode ? (
          <Link href={`${base}/items/${department.code}/${detail.previousCode}`}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="code">{detail.previousCode}</span>
          </Link>
        ) : (
          <span />
        )}
        <Link href={`/clients/${client.code}/departments/${department.code}`}>
          All {department.name} questions
        </Link>
        {detail.nextCode ? (
          <Link href={`${base}/items/${department.code}/${detail.nextCode}`}>
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
