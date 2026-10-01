import { can } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import {
  buttonClass,
  Callout,
  Chip,
  DataTable,
  Disclosure,
  EmptyState,
  PageHeader,
  Panel,
  SectionHeader,
  Stat,
  StatGrid,
} from '@duatf/core-ui'
import {
  draftEntryHref,
  draftProblems,
  ENTRY_NOUN,
  isEditableSection,
  KB_SECTION_LABEL,
  nextVersion,
  releaseChanges,
  releaseOverview,
  releaseReviews,
  type DraftChange,
} from '@duatf/feature-framework-library-api'
import { ReviewChip } from '@duatf/feature-framework-library'
import { Archive, FilePen, ScrollText, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  DiscardDraftForm,
  MarkReviewedForm,
  PublishForm,
  StartDraftForm,
} from '@/components/forms/KbForms'
import { PermissionNotice } from '@/components/PermissionNotice'
import { permissionFor } from '@/server/auth'
import { database } from '@/server/runtime'
import { firstValue, type SearchParams } from '@/server/searchParams'
import {
  discardDraftAction,
  markReviewedAction,
  publishDraftAction,
  setKbViewAction,
  startDraftAction,
} from './actions'
import styles from './draft.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Knowledge base releases' }

const CHANGE_LABEL: Record<DraftChange['change'], string> = {
  added: 'Added',
  edited: 'Edited',
  removed: 'Removed',
  reviewed: 'Reviewed',
}

const sectionName = (section: string) =>
  isEditableSection(section) ? KB_SECTION_LABEL[section] : section

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { session, denial } = await permissionFor('kb.edit')
  if (denial) {
    return (
      <PermissionNotice
        denial={denial}
        back={{ href: '/knowledge-base', label: 'Back to the knowledge base' }}
      />
    )
  }
  const query = await searchParams
  const db = database().db
  const overview = await releaseOverview(db)
  const { published, draft, history } = overview
  const canPublish = can(session.principal, 'kb.publish')
  const [changes, reviews, problems] = draft
    ? await Promise.all([
        releaseChanges(db, draft.id),
        releaseReviews(db, draft.id),
        draftProblems(db),
      ])
    : [[], [], []]
  const awaiting = reviews.filter((row) => row.status === 'awaiting_review')
  const titles = new Map(changes.map((row) => [`${row.section}/${row.code}`, row.title]))
  const justPublished = firstValue(query.published)
  const justDiscarded = firstValue(query.discarded)

  return (
    <>
      <PageHeader
        title="Knowledge base releases"
        lede="The knowledge base changes only through releases. Edits collect in a draft; a firm administrator reviews and publishes it. Assessments keep the release they started on."
        actions={
          draft ? (
            <form action={setKbViewAction}>
              <input type="hidden" name="view" value="draft" />
              <input type="hidden" name="next" value="/knowledge-base" />
              <button type="submit" className={buttonClass()}>
                <FilePen size={16} aria-hidden="true" />
                Edit in the knowledge base
              </button>
            </form>
          ) : undefined
        }
      />

      {justPublished ? (
        <Callout tone="success" title={`Release ${justPublished} is published`} role="status">
          <p>
            New assessments and the knowledge base now use it. The earlier release is kept as
            superseded.
          </p>
        </Callout>
      ) : null}
      {justDiscarded ? (
        <Callout tone="neutral" title={`Draft ${justDiscarded} was discarded`} role="status">
          <p>Nothing in it was published.</p>
        </Callout>
      ) : null}

      {draft ? (
        <>
          <section className={styles.section} aria-labelledby="draft-title">
            <SectionHeader
              id="draft-title"
              title={`Draft ${draft.version}`}
              description={`Started ${formatIst(draft.createdAt)} by ${draft.createdBy}, as a copy of release ${published?.version ?? 'none'}.${draft.notes ? ` ${draft.notes}` : ''}`}
            />
            <StatGrid>
              <Stat label="Changes" value={draft.changes} />
              <Stat
                label="Awaiting legal review"
                value={draft.awaitingReview}
                tone={draft.awaitingReview ? 'warning' : 'default'}
              />
              <Stat
                label="Problems to fix"
                value={problems.length}
                tone={problems.length ? 'danger' : 'default'}
              />
            </StatGrid>
            {problems.length ? (
              <Callout tone="danger" title="These stop the draft from being published">
                <ul className={styles.list}>
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </Callout>
            ) : null}
          </section>

          <section className={styles.section} aria-labelledby="review-title">
            <SectionHeader
              id="review-title"
              title="Awaiting legal review"
              count={awaiting.length}
              description="Entries added or changed in this draft. Open one to check it against the Act and Rules; a firm administrator marks it reviewed."
            />
            {awaiting.length === 0 ? (
              <EmptyState title="Nothing is waiting for review" size="quiet">
                Every entry changed in this draft has been reviewed.
              </EmptyState>
            ) : (
              <DataTable
                rows={awaiting}
                rowKey={(row) => `${row.section}/${row.code}`}
                columns={[
                  {
                    key: 'entry',
                    header: 'Entry',
                    render: (row) => (
                      <span className={styles.entry}>
                        {isEditableSection(row.section) ? (
                          <Link href={draftEntryHref(row.section, row.code)}>
                            <span className="code">{row.code}</span>{' '}
                            {titles.get(`${row.section}/${row.code}`) ?? ''}
                          </Link>
                        ) : (
                          <span className="code">{row.code}</span>
                        )}
                        <span className={styles.muted}>{sectionName(row.section)}</span>
                      </span>
                    ),
                  },
                  {
                    key: 'origin',
                    header: 'Written by',
                    render: (row) => (
                      <span className={styles.entry}>
                        <ReviewChip review={{ status: row.status, origin: row.origin }} />
                        <span className={styles.muted}>
                          {row.changedBy}, {formatIst(row.changedAt)}
                        </span>
                      </span>
                    ),
                  },
                  ...(canPublish
                    ? [
                        {
                          key: 'review',
                          header: <span className="visually-hidden">Review</span>,
                          label: '',
                          render: (row: (typeof awaiting)[number]) =>
                            isEditableSection(row.section) ? (
                              <MarkReviewedForm
                                action={markReviewedAction.bind(null, row.section, row.code)}
                              />
                            ) : null,
                        },
                      ]
                    : []),
                ]}
              />
            )}
          </section>

          <Disclosure
            summary="Change log"
            hint={`${changes.length} ${changes.length === 1 ? 'entry' : 'entries'}, newest first`}
            icon={ScrollText}
            defaultOpen={changes.length <= 8}
          >
            {changes.length === 0 ? (
              <EmptyState title="No changes yet" size="quiet">
                Switch to the draft in the knowledge base, then use Add or Edit in lawful bases,
                data elements, vocabularies, the process catalogue, sector overlays or playbooks.
              </EmptyState>
            ) : (
              <DataTable
                rows={[...changes].reverse()}
                rowKey={(row) => row.id}
                columns={[
                  {
                    key: 'when',
                    header: 'When',
                    width: '11rem',
                    render: (row) => formatIst(row.at),
                  },
                  {
                    key: 'entry',
                    header: 'Entry',
                    render: (row) => (
                      <span className={styles.entry}>
                        {row.change !== 'removed' && isEditableSection(row.section) ? (
                          <Link href={draftEntryHref(row.section, row.code)}>
                            <span className="code">{row.code}</span> {row.title}
                          </Link>
                        ) : (
                          <span>
                            <span className="code">{row.code}</span> {row.title}
                          </span>
                        )}
                        <span className={styles.muted}>
                          {isEditableSection(row.section) ? ENTRY_NOUN[row.section] : row.section}
                        </span>
                      </span>
                    ),
                  },
                  {
                    key: 'change',
                    header: 'Change',
                    render: (row) => (
                      <span className={styles.entry}>
                        <Chip
                          tone={
                            row.change === 'removed'
                              ? 'danger'
                              : row.change === 'reviewed'
                                ? 'success'
                                : row.change === 'added'
                                  ? 'brand'
                                  : 'info'
                          }
                        >
                          {CHANGE_LABEL[row.change]}
                        </Chip>
                        {row.detail ? <span className={styles.muted}>{row.detail}</span> : null}
                      </span>
                    ),
                  },
                  { key: 'who', header: 'By', priority: 'low', render: (row) => row.actorName },
                ]}
              />
            )}
          </Disclosure>

          {canPublish ? (
            <Panel title={`Publish release ${draft.version}`} titleId="publish-title">
              <p className={styles.intro}>
                Publishing makes {draft.version} the release every new assessment and the knowledge
                base use. Release {published?.version ?? 'none'} is kept as superseded, and running
                assessments stay on the release they started on.
              </p>
              <PublishForm
                action={publishDraftAction}
                version={draft.version}
                awaitingReview={draft.awaitingReview}
              />
            </Panel>
          ) : (
            <Callout tone="locked" title="A firm administrator publishes the draft">
              <p>Your changes stay in the draft until then. Tell them when it is ready.</p>
            </Callout>
          )}

          {canPublish ? (
            <Disclosure summary={`Discard draft ${draft.version}`} icon={Trash2}>
              <p className={styles.intro}>
                Throws away every change in the draft. The published release is not affected.
              </p>
              <DiscardDraftForm action={discardDraftAction} version={draft.version} />
            </Disclosure>
          ) : null}
        </>
      ) : (
        <Panel title="Start a draft release" titleId="start-title">
          <p className={styles.intro}>
            A draft starts as an exact copy of release {published?.version ?? 'none'}. Add and edit
            lawful bases, data elements, vocabularies, process templates, sector overlays and
            playbooks in it; nothing changes for clients until it is published.
          </p>
          <StartDraftForm
            action={startDraftAction}
            defaultVersion={published ? nextVersion(published.version) : '1.0.0'}
          />
        </Panel>
      )}

      <section className={styles.section} aria-labelledby="history-title">
        <SectionHeader id="history-title" title="Published releases" count={history.length} />
        <DataTable
          rows={history}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'version',
              header: 'Release',
              render: (row) => (
                <span className={styles.entry}>
                  <strong>{row.version}</strong>
                  <span className={styles.muted}>{row.source}</span>
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) =>
                row.status === 'published' ? (
                  <Chip tone="success">In use</Chip>
                ) : (
                  <Chip icon={Archive}>Superseded</Chip>
                ),
            },
            {
              key: 'published',
              header: 'Published',
              render: (row) =>
                row.publishedAt
                  ? `${formatIst(row.publishedAt)}${row.publishedBy ? `, ${row.publishedBy}` : ''}`
                  : '',
            },
            {
              key: 'notes',
              header: 'Notes',
              priority: 'low',
              render: (row) => <span className={styles.notes}>{row.notes ?? ''}</span>,
            },
          ]}
        />
      </section>
    </>
  )
}
