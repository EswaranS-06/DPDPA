import { can } from '@duatf/core-access'
import {
  buttonClass,
  Disclosure,
  EmptyState,
  PageHeader,
  SectionHeader,
  TextField,
} from '@duatf/core-ui'
import {
  evidenceStatusCounts,
  listDepartments,
  listEvidence,
  listEvidenceRequests,
  type EvidenceFilters,
} from '@duatf/feature-compliance-api'
import { EVIDENCE_STATUSES } from '@duatf/platform-db'
import { FileCheck, FilePlus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { RequestTable } from '@/components/evidence/RequestTable'
import { FilterTabs } from '@/components/FilterTabs'
import { UploadEvidenceForm } from '@/components/forms/EvidenceForms'
import { STATUS } from '@/components/status'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { uploadEvidenceAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Evidence' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const filters: EvidenceFilters = {
    status: EVIDENCE_STATUSES.find((status) => status === firstValue(query.status)),
    text: firstValue(query.q)?.trim().slice(0, 100) || undefined,
  }
  const [rows, counts, requests] = await Promise.all([
    listEvidence(ctx, client.id, filters),
    evidenceStatusCounts(ctx, client.id),
    listEvidenceRequests(ctx, client.id, { open: true }),
  ])
  const firmUploader = can(ctx.principal, 'evidence.upload', {
    clientId: client.id,
    departmentId: null,
  })
  const departments = firmUploader ? await listDepartments(ctx, client.id) : []
  const base = `/clients/${client.code}/evidence`
  const total = EVIDENCE_STATUSES.reduce((sum, status) => sum + counts[status], 0)
  const withText = (href: string) =>
    filters.text
      ? `${href}${href.includes('?') ? '&' : '?'}q=${encodeURIComponent(filters.text)}`
      : href

  return (
    <>
      <PageHeader
        title="Evidence"
        lede="Every file is stored with its SHA-256 fingerprint. Downloads use a link that stops working after five minutes, and every download is recorded in the audit log."
      />
      {requests.length ? (
        <section className={styles.section} id="requests" aria-labelledby="requests-title">
          <SectionHeader id="requests-title" title="Requested evidence" count={requests.length} />
          <RequestTable rows={requests} clientCode={client.code} />
        </section>
      ) : null}
      <section className={styles.section} aria-label="Evidence files">
        <FilterTabs
          label="Evidence by status"
          tabs={[
            { href: withText(base), label: 'All', count: total, current: !filters.status },
            ...EVIDENCE_STATUSES.map((status) => ({
              href: withText(`${base}?status=${status}`),
              label: STATUS.evidence[status].label,
              count: counts[status],
              current: filters.status === status,
            })),
          ]}
        />
        <form method="get" action={base} className={styles.filters} role="search">
          {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
          <TextField
            label="Search evidence"
            name="q"
            type="search"
            defaultValue={filters.text}
            placeholder="Title, file name or code"
          />
          <button type="submit" className={buttonClass('secondary')}>
            Search
          </button>
          {filters.text ? (
            <Link
              href={filters.status ? `${base}?status=${filters.status}` : base}
              className={buttonClass('ghost')}
            >
              Clear search
            </Link>
          ) : null}
        </form>
        {rows.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title={filters.status || filters.text ? 'No evidence matches' : 'No evidence yet'}
          >
            Evidence is usually uploaded from a question or a remediation action, so it is linked to
            it straight away and reviewed by an auditor.
          </EmptyState>
        ) : (
          <EvidenceTable rows={rows} clientCode={client.code} />
        )}
      </section>
      {firmUploader ? (
        <Disclosure summary="Upload evidence without a question" icon={FilePlus}>
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
        </Disclosure>
      ) : null}
    </>
  )
}
