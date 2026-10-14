import { formatIst } from '@duatf/core-utils'
import { DataTable, Disclosure, EmptyState, PageHeader, SectionHeader } from '@duatf/core-ui'
import {
  BREACH_NATURES,
  breachFormOptions,
  listBreaches,
  toLocalInput,
} from '@duatf/feature-compliance-api'
import { ShieldAlert, Siren } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BreachForm } from '@/components/forms/RegisterForms'
import { BreachStatusChip, PendingClocks, SeverityTag } from '@/components/registers/RegisterBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { recordBreachAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Breaches' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const list = await listBreaches(ctx, client.id)
  const options = list.canEdit ? await breachFormOptions(ctx, client.id) : null
  const base = `/clients/${client.code}/breaches`

  return (
    <>
      <PageHeader
        title="Breaches"
        lede="Every personal data breach is intimated to the Data Protection Board and to each affected Data Principal (s.8(6)); the Act sets no threshold of risk. The clocks run from the time the organisation became aware: the detailed report to the Board within 72 hours (R7(2)(b)), and the CERT-In report within 6 hours when it is a cyber incident."
      />
      <section className={styles.section} aria-labelledby="register-title">
        <SectionHeader id="register-title" title="Register" count={list.breaches.length} />
        {list.breaches.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No breach recorded">
            Record a breach as soon as the organisation becomes aware of it. The record keeps the
            times, drafts the notices with what Rule 7 asks for and shows which intimation is next.
          </EmptyState>
        ) : (
          <DataTable
            rows={list.breaches}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'breach',
                header: 'Breach',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`${base}/${row.code}`} className={styles.clientName}>
                      {row.title}
                    </Link>
                    <span className={styles.muted}>
                      <span className="code">{row.code}</span>, aware {formatIst(row.awareAt)}
                      {row.departmentName ? `, ${row.departmentName}` : ''}
                      {row.processorName ? `, at ${row.processorName}` : ''}
                    </span>
                  </span>
                ),
              },
              {
                key: 'clocks',
                header: 'Intimations',
                render: (row) => (
                  <PendingClocks clocks={row.clocks} closed={row.status === 'closed'} />
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span className={styles.roles}>
                    <BreachStatusChip status={row.status} />
                    <SeverityTag severity={row.severity} />
                  </span>
                ),
              },
            ]}
          />
        )}
      </section>
      {options ? (
        <Disclosure summary="Record a breach" icon={Siren} defaultOpen={!list.breaches.length}>
          <BreachForm
            action={recordBreachAction.bind(null, { clientId: client.id, clientCode: client.code })}
            initial={{ awareAt: toLocalInput(new Date()), contact: options.contact ?? '' }}
            initialNatures={[]}
            initialActivities={[]}
            natures={BREACH_NATURES.map((nature) => ({ value: nature.code, label: nature.label }))}
            activities={options.activities.map((activity) => ({
              value: String(activity.ref),
              label: `${activity.refLabel} ${activity.name}`,
            }))}
            departments={options.departments.map((row) => ({ value: row.id, label: row.name }))}
            processors={options.processors.map((row) => ({ value: row.id, label: row.name }))}
            submitLabel="Record the breach"
          />
        </Disclosure>
      ) : null}
    </>
  )
}
