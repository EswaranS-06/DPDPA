import { can } from '@duatf/core-access'
import { buttonClass, EmptyState, SelectField, TextField } from '@duatf/core-ui'
import {
  evidenceStatusCounts,
  listDepartments,
  listEvidence,
  type EvidenceFilters,
} from '@duatf/feature-compliance-api'
import { EVIDENCE_STATUSES, type EvidenceStatus } from '@duatf/platform-db'
import type { Metadata } from 'next'
import Link from 'next/link'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { UploadEvidenceForm } from '@/components/forms/EvidenceForms'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { uploadEvidenceAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Evidence' }

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  pending_review: 'Awaiting review',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const filters: EvidenceFilters = {
    status: EVIDENCE_STATUSES.find((status) => status === firstValue(query.status)),
    text: firstValue(query.q)?.slice(0, 100),
  }
  const [rows, counts] = await Promise.all([
    listEvidence(ctx, client.id, filters),
    evidenceStatusCounts(ctx, client.id),
  ])
  const firmUploader = can(ctx.principal, 'evidence.upload', {
    clientId: client.id,
    departmentId: null,
  })
  const departments = firmUploader ? await listDepartments(ctx, client.id) : []
  const base = `/clients/${client.code}/evidence`

  return (
    <>
      <section className={styles.section} aria-labelledby="evidence-title">
        <h2 id="evidence-title" className={styles.sectionTitle}>
          Evidence repository
        </h2>
        <p className={styles.sectionIntro}>
          Every file is stored with its SHA-256 fingerprint. Downloads use a link that stops working
          after five minutes, and every download is recorded. {counts.pending_review} awaiting
          review, {counts.accepted} accepted, {counts.rejected} rejected.
        </p>
        <form method="get" action={base} className={styles.filters}>
          <TextField
            label="Search"
            name="q"
            type="search"
            defaultValue={filters.text}
            placeholder="Title, file name or code"
          />
          <SelectField
            label="Status"
            name="status"
            placeholder="Any status"
            options={EVIDENCE_STATUSES.map((status) => ({
              value: status,
              label: STATUS_LABEL[status],
            }))}
            defaultValue={filters.status}
          />
          <button type="submit" className={buttonClass('secondary')}>
            Filter
          </button>
          {filters.status || filters.text ? (
            <Link href={base} className={styles.muted}>
              Show all
            </Link>
          ) : null}
        </form>
        {rows.length === 0 ? (
          <EmptyState
            title={filters.status || filters.text ? 'No evidence matches.' : 'No evidence yet.'}
          >
            Evidence is usually uploaded from a question, so it is linked to it straight away.
          </EmptyState>
        ) : (
          <EvidenceTable rows={rows} clientCode={client.code} />
        )}
      </section>
      {firmUploader ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="upload-title">
          <h2 id="upload-title" className={styles.sectionTitle}>
            Upload evidence
          </h2>
          <UploadEvidenceForm
            action={uploadEvidenceAction.bind(null, {
              clientId: client.id,
              clientCode: client.code,
              returnPath: base,
            })}
            departments={departments
              .filter((row) => row.active)
              .map((row) => ({ value: row.id, label: row.name }))}
          />
        </section>
      ) : null}
    </>
  )
}
