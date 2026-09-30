import { can } from '@duatf/core-access'
import { formatDay, formatIst } from '@duatf/core-utils'
import { buttonClass } from '@duatf/core-ui'
import { getEvidence, NotFoundError } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EvidenceStatusChip, fileSize } from '@/components/evidence/EvidenceTable'
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
  const canReview =
    can(ctx.principal, 'evidence.review', { clientId: client.id }) &&
    item.uploadedBy !== ctx.principal.userId

  return (
    <article className={styles.section} aria-labelledby="evidence-title">
      <nav aria-label="Breadcrumb" className={styles.muted}>
        <Link href={base}>Evidence repository</Link> / {item.code}
      </nav>
      <div className={styles.headerTop}>
        <div className={styles.header}>
          <span className={styles.code}>{item.code}</span>
          <h2 id="evidence-title" className={styles.sectionTitle}>
            {item.title}
          </h2>
          <EvidenceStatusChip status={item.status} expired={item.expired} />
        </div>
        <a href={`${base}/${item.code}/download`} className={buttonClass()} rel="nofollow">
          Download
        </a>
      </div>
      <dl className={`${styles.profile} ${styles.panel}`}>
        <div>
          <dt>File</dt>
          <dd>
            {item.fileName} ({fileSize(item.sizeBytes)})
          </dd>
        </div>
        <div>
          <dt>Uploaded</dt>
          <dd>
            {formatIst(item.uploadedAt)} by {item.uploadedByName ?? 'unknown'}
          </dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>{item.departmentName ?? '—'}</dd>
        </div>
        <div>
          <dt>Valid until</dt>
          <dd>{item.validUntil ? formatDay(item.validUntil) : '—'}</dd>
        </div>
        <div className={styles.wide}>
          <dt>SHA-256</dt>
          <dd className={styles.code}>{item.sha256}</dd>
        </div>
        {item.description ? (
          <div className={styles.wide}>
            <dt>Description</dt>
            <dd>{item.description}</dd>
          </div>
        ) : null}
        {item.reviewNote ? (
          <div className={styles.wide}>
            <dt>Review note</dt>
            <dd>{item.reviewNote}</dd>
          </div>
        ) : null}
      </dl>

      <section className={styles.section} aria-labelledby="used-for">
        <h3 id="used-for" className={styles.subTitle}>
          Used for
        </h3>
        {item.links.length === 0 ? (
          <p className={styles.muted}>Not linked to any question yet.</p>
        ) : (
          <ul className={styles.bullets}>
            {item.links.map((link) => (
              <li key={link.itemId}>
                <Link
                  href={`/clients/${client.code}/assessments/${link.assessmentCode}/items/${link.questionCode}`}
                >
                  {link.questionCode}
                </Link>{' '}
                <span className={styles.muted}>in {link.assessmentTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canReview ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="review-evidence">
          <h3 id="review-evidence" className={styles.subTitle}>
            Review this evidence
          </h3>
          <EvidenceReviewForm
            action={reviewEvidenceAction.bind(null, {
              clientId: client.id,
              clientCode: client.code,
              returnPath: `${base}/${item.code}`,
              evidenceId: item.id,
            })}
          />
        </section>
      ) : null}
    </article>
  )
}
