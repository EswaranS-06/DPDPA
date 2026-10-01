import { can } from '@duatf/core-access'
import { formatIst, NotFoundError } from '@duatf/core-utils'
import { Callout, DescriptionList, Disclosure, PageHeader, Panel } from '@duatf/core-ui'
import { ReviewChip } from '@duatf/feature-framework-library'
import {
  ENTRY_NOUN,
  entryForm,
  isEditableSection,
  kbHref,
  openDraft,
} from '@duatf/feature-framework-library-api'
import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EntryEditor, MarkReviewedForm, RemoveEntryForm } from '@/components/forms/KbForms'
import { NoDraft, SECTION_GUIDE } from '@/components/kb/EntryParts'
import { PermissionNotice } from '@/components/PermissionNotice'
import { permissionFor } from '@/server/auth'
import { authoringContext } from '@/server/knowledgeBase'
import { markReviewedAction, removeEntryAction, saveEntryAction } from '../../actions'
import styles from '../../draft.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ section: string; code: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Edit ${decodeURIComponent((await params).code)}`,
})

export default async function Page({ params }: Props) {
  const { section, code: rawCode } = await params
  if (!isEditableSection(section)) notFound()
  const code = decodeURIComponent(rawCode)
  const { session, denial } = await permissionFor('kb.edit')
  if (denial) {
    return (
      <PermissionNotice
        denial={denial}
        back={{ href: kbHref(section), label: 'Back to the knowledge base' }}
      />
    )
  }
  const ctx = await authoringContext()
  const draft = await openDraft(ctx.db)
  if (!draft) {
    return (
      <>
        <PageHeader title={`Edit ${code}`} lede={SECTION_GUIDE[section]} />
        <NoDraft />
      </>
    )
  }
  const form = await entryForm(ctx, section, { code }).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const review = form.review
  const canReview = can(session.principal, 'kb.publish')

  return (
    <>
      <PageHeader
        kicker={
          <span>
            <span className="code">{code}</span>, {ENTRY_NOUN[section]} in draft {draft.version}
          </span>
        }
        title={form.heading}
        lede={SECTION_GUIDE[section]}
      >
        <ReviewChip review={review} />
      </PageHeader>

      <div className={styles.editorLayout}>
        <EntryEditor
          form={form}
          action={saveEntryAction.bind(null, section, code)}
          cancelHref={
            section === 'bases' || section === 'data-elements'
              ? kbHref(section)
              : kbHref(section, code)
          }
        />

        <aside className={styles.side} aria-label="Review and removal">
          <Panel title="Legal review" titleId="review-title">
            {review ? (
              <>
                <DescriptionList
                  columns={1}
                  items={[
                    {
                      label: 'Last changed',
                      value: `${formatIst(review.changedAt)} by ${review.changedBy}`,
                    },
                    {
                      label: 'Status',
                      value:
                        review.status === 'reviewed'
                          ? `Reviewed${review.reviewedBy ? ` by ${review.reviewedBy}` : ''}${review.reviewedAt ? `, ${formatIst(review.reviewedAt)}` : ''}`
                          : 'Awaiting legal review',
                    },
                    ...(review.reviewNote ? [{ label: 'Note', value: review.reviewNote }] : []),
                  ]}
                />
                {review.status === 'awaiting_review' ? (
                  canReview ? (
                    <MarkReviewedForm
                      action={markReviewedAction.bind(null, section, code)}
                      withNote
                    />
                  ) : (
                    <Callout tone="locked">
                      <p>A firm administrator marks it reviewed.</p>
                    </Callout>
                  )
                ) : null}
              </>
            ) : (
              <p className={styles.intro}>
                Imported from the vault and not changed in the editor. Saving a change marks it as
                awaiting legal review.
              </p>
            )}
          </Panel>

          <Disclosure summary="Remove from the draft" icon={Trash2}>
            {form.removeBlockers.length ? (
              <Callout tone="locked" title="It cannot be removed yet">
                {form.removeBlockers.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </Callout>
            ) : (
              <>
                <p className={styles.intro}>
                  It disappears from the draft. Published releases keep it.
                </p>
                <RemoveEntryForm
                  action={removeEntryAction.bind(null, section, code)}
                  label={code}
                />
              </>
            )}
          </Disclosure>
        </aside>
      </div>
    </>
  )
}
