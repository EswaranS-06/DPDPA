import { can } from '@duatf/core-access'
import { formatDay, isoDate } from '@duatf/core-utils'
import { buttonClass, Callout, Disclosure, PageHeader, Panel } from '@duatf/core-ui'
import {
  documentChecklistOf,
  NotFoundError,
  RECORD_DOCUMENTS,
  renderClientDocument,
  type RecordKind,
} from '@duatf/feature-compliance-api'
import { Download, Eye, EyeOff } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckList, ReviewChip } from '@/components/documents/DocumentBits'
import { ChecklistForm } from '@/components/forms/DocumentForms'
import { ActionButton } from '@/components/forms/RegisterForms'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import page from '../../../clients.module.css'
import { reviewTemplateAction, saveChecklistAction } from '../actions'
import styles from '../documents.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; tpl: string }>; searchParams: SearchParams }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: (await params).tpl.toUpperCase(),
})

const RECORD_PAGE: Record<RecordKind, string> = {
  breach: 'breaches',
  rights: 'rights',
  dpia: 'dpia',
  processor: 'processors',
}

export default async function Page({ params, searchParams }: Props) {
  const { code, tpl } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const query = await searchParams
  const kind = (RECORD_DOCUMENTS as Record<string, RecordKind | undefined>)[tpl.toUpperCase()]
  const recordCode = firstValue(query.record)
  const showNotes = firstValue(query.notes) === '1'
  const document = await renderClientDocument(ctx, client.id, tpl, {
    record: kind && recordCode ? { kind, code: recordCode } : undefined,
    showNotes,
  }).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const checklist = await documentChecklistOf(ctx, client.id, document.template.id)
  const base = `/clients/${client.code}/documents`
  const here = `${base}/${document.template.id}`
  const recordQuery = document.record ? `record=${document.record.code}&` : ''
  const canEdit = can(ctx.principal, 'document.manage', { clientId: client.id })
  const canReview = can(ctx.principal, 'template.review', {})
  const download = (format: string, draft: boolean) =>
    `${here}/download?${recordQuery}format=${format}${draft ? '&draft=1' : ''}`
  const target = { clientId: client.id, clientCode: client.code, templateId: document.template.id }

  return (
    <>
      <PageHeader
        kicker={<span className="code">{document.template.id}</span>}
        title={document.template.title}
        lede={`${document.template.audience}. ${document.template.legalBasis ? `Basis: ${document.template.legalBasis}.` : ''}`}
        actions={
          <Link
            href={`${here}?${recordQuery}${showNotes ? '' : 'notes=1'}`}
            className={buttonClass('secondary')}
          >
            {showNotes ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
            {showNotes ? 'Hide the drafting notes' : 'Show the drafting notes'}
          </Link>
        }
      >
        <ReviewChip review={document.review} />
        <span>{document.template.publish}</span>
        <span>Version {document.template.version}</span>
      </PageHeader>

      {kind && !document.record ? (
        <Callout
          tone="info"
          title={`Built from a ${kind === 'rights' ? 'rights request' : kind === 'dpia' ? 'DPIA' : kind}`}
        >
          <p>
            Open this document from the record’s page, or add <span className="code">?record=</span>{' '}
            and its ID, to fill it from that record. Below, it is filled from the client’s details
            only.{' '}
            <Link href={`/clients/${client.code}/${RECORD_PAGE[kind]}`}>Go to the register</Link>
          </p>
        </Callout>
      ) : null}
      {document.record ? (
        <Callout tone="neutral" title={`Filled from ${document.record.label}`}>
          <p>
            <Link
              href={`/clients/${client.code}/${RECORD_PAGE[document.record.kind]}/${document.record.code}`}
            >
              Open the record
            </Link>
          </p>
        </Callout>
      ) : null}

      <div className={styles.layout}>
        <Panel title="The document" titleId="preview-title">
          {/* The library's wording with the client's values; every value is escaped by the template grammar. */}
          <div className={styles.preview} dangerouslySetInnerHTML={{ __html: document.html }} />
        </Panel>

        <div className={styles.side}>
          <Panel title="Release checks" titleId="checks-title">
            <CheckList checks={document.checks} />
            {document.missing.length ? (
              <Disclosure summary="Values still to fill" hint={String(document.missing.length)}>
                <ul className={styles.fields}>
                  {document.missing.map((name) => (
                    <li key={name}>[{name}]</li>
                  ))}
                </ul>
                <p className={page.muted}>
                  <Link href={`${base}/profile`}>Fill them under Answers and details</Link>.
                </p>
              </Disclosure>
            ) : null}
          </Panel>

          {canEdit ? (
            <Panel title="Download" titleId="download-title">
              <div className={styles.downloads}>
                {document.blocked ? null : (
                  <a href={download('docx', false)} className={buttonClass()} rel="nofollow">
                    <Download size={16} aria-hidden="true" />
                    Word
                  </a>
                )}
                <a
                  href={download('docx', true)}
                  className={buttonClass(document.blocked ? 'primary' : 'secondary')}
                  rel="nofollow"
                >
                  <Download size={16} aria-hidden="true" />
                  Word, as a draft
                </a>
                <a
                  href={download('md', document.blocked)}
                  className={buttonClass('ghost', 'sm')}
                  rel="nofollow"
                >
                  Markdown
                </a>
                <a
                  href={download('html', document.blocked)}
                  className={buttonClass('ghost', 'sm')}
                  rel="nofollow"
                >
                  HTML
                </a>
                <Link
                  href={`${base}/clauses?doc=${document.template.id}`}
                  className={buttonClass('ghost', 'sm')}
                >
                  As one clause
                </Link>
              </div>
              <p className={page.muted}>
                {document.blocked
                  ? 'A draft keeps the blanks as [Name] and says “Draft” in its page header. The release download opens once no blocking check is left.'
                  : document.review.reviewed
                    ? 'Ready for release.'
                    : 'Ready, but the template awaits legal review: the Word file says so in its page header.'}
              </p>
            </Panel>
          ) : null}

          <Panel title="Legal review" titleId="review-title">
            <p className={page.muted}>
              {document.review.reviewed
                ? `This version of ${document.template.id} was marked reviewed${document.review.reviewerName ? ` by ${document.review.reviewerName}` : ''}${document.review.reviewedAt ? ` on ${formatDay(isoDate(document.review.reviewedAt))}` : ''}.`
                : 'This version of the template has not been marked as legally reviewed. A change to the template file asks for review again.'}
            </p>
            {canReview && !document.review.reviewed ? (
              <ActionButton action={reviewTemplateAction.bind(null, target)} pendingText="Marking…">
                Mark this version reviewed
              </ActionButton>
            ) : null}
          </Panel>

          {checklist.groups.length ? (
            <Panel title="Statutory checklist" titleId="checklist-title">
              <p className={page.muted}>
                {checklist.signedAt
                  ? `Signed off by ${checklist.signerName ?? 'the consultant'} on ${formatDay(isoDate(checklist.signedAt))}.`
                  : `The library’s Part B checklist for this kind of document. ${checklist.ticked.length} ticked.`}
              </p>
              {canEdit ? (
                <ChecklistForm
                  action={saveChecklistAction.bind(null, target)}
                  groups={checklist.groups}
                  ticked={checklist.ticked}
                />
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  )
}
