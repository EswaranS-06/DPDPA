import { can } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import {
  buttonClass,
  Callout,
  DescriptionList,
  EmptyState,
  PageHeader,
  Panel,
} from '@duatf/core-ui'
import { getEvidence, NotFoundError } from '@duatf/feature-compliance-api'
import { Download, Link2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EvidenceStatusChip, fileSize, Freshness } from '@/components/evidence/EvidenceTable'
import { EvidenceReviewForm } from '@/components/forms/EvidenceForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { reviewEvidenceAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; evd: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).evd),
})

export default async function Page({ params }: Props) {
  const { code, evd } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const item = await getEvidence(ctx, client.id, decodeURIComponent(evd)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError) notFound()
      throw error
    },
  )
  const base = `/clients/${client.code}/evidence`
  const reviewer = can(ctx.principal, 'evidence.review', { clientId: client.id })
  const ownUpload = item.uploadedBy === ctx.principal.userId
  const uses = item.links.length

  return (
    <>
      <PageHeader
        kicker={<span className="code">{item.code}</span>}
        title={item.title}
        actions={
          <a href={`${base}/${item.code}/download`} className={buttonClass()} rel="nofollow">
            <Download size={16} aria-hidden="true" />
            Download
          </a>
        }
      >
        <EvidenceStatusChip status={item.status} expired={false} />
        <Freshness validUntil={item.validUntil} />
      </PageHeader>

      <div className={styles.twoColumn}>
        <Panel title="File" titleId="file-title">
          <DescriptionList
            columns={2}
            items={[
              { label: 'File', value: `${item.fileName} (${fileSize(item.sizeBytes)})` },
              {
                label: 'Uploaded',
                value: `${formatIst(item.uploadedAt)} by ${item.uploadedByName ?? 'unknown'}`,
              },
              { label: 'Department', value: item.departmentName },
              { label: 'Used for', value: `${uses} ${uses === 1 ? 'question' : 'questions'}` },
              {
                label: 'SHA-256 fingerprint',
                value: <span className={`code ${styles.hash}`}>{item.sha256}</span>,
                wide: true,
              },
              ...(item.description
                ? [{ label: 'Description', value: item.description, wide: true }]
                : []),
            ]}
          />
        </Panel>

        <div className={styles.section}>
          {item.reviewNote ? (
            <Callout
              tone={item.status === 'rejected' ? 'danger' : 'neutral'}
              title={item.status === 'rejected' ? 'Rejected by the reviewer' : 'Review note'}
            >
              <p>{item.reviewNote}</p>
            </Callout>
          ) : null}
          {reviewer && !ownUpload ? (
            <Panel title="Review this evidence" titleId="review-evidence">
              <p className={`${styles.flush} ${styles.muted}`}>
                Accept when the file shows what the question or action asks for. Reject with a note
                saying what is missing.
              </p>
              <EvidenceReviewForm
                action={reviewEvidenceAction.bind(null, {
                  clientId: client.id,
                  clientCode: client.code,
                  returnPath: `${base}/${item.code}`,
                  evidenceId: item.id,
                })}
              />
            </Panel>
          ) : null}
          {reviewer && ownUpload ? (
            <Callout tone="locked" title="Another auditor reviews this file">
              <p>You uploaded it, so someone else accepts or rejects it.</p>
            </Callout>
          ) : null}
          <Panel title="Used for" titleId="used-for">
            {uses === 0 ? (
              <EmptyState icon={Link2} title="Not linked to a question yet" size="quiet">
                Link it from a question page, under Add evidence.
              </EmptyState>
            ) : (
              <ul className={styles.bullets}>
                {item.links.map((link) => (
                  <li key={link.itemId}>
                    <Link
                      href={`/clients/${client.code}/assessments/${link.assessmentCode}/items/${link.questionCode}`}
                      className="code"
                    >
                      {link.questionCode}
                    </Link>{' '}
                    <span className={styles.muted}>in {link.assessmentTitle}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
