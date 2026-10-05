import { can } from '@duatf/core-access'
import { DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import { assignablePeople, listClientControls } from '@duatf/feature-compliance-api'
import { kbHref } from '@duatf/feature-framework-library-api'
import { SlidersHorizontal } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { OwnerSelectForm } from '@/components/forms/AssignForms'
import { libraryApi } from '@/server/api'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { setControlOwnerAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Control owners' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const api = await libraryApi()
  const [rows, people, controls] = await Promise.all([
    listClientControls(ctx, client.id),
    assignablePeople(ctx, client.id),
    api.controls(),
  ])
  const titles = new Map(controls.map((row) => [row.code, row.title]))
  const canAssign = can(ctx.principal, 'assessment.assign', { clientId: client.id })
  const save = setControlOwnerAction.bind(null, client.id, client.code)

  return (
    <>
      <PageHeader
        title="Control owners"
        lede="The knowledge-base controls behind the questions you gave the departments, and who owns each one at the client. Owners see their controls under Your work when they sign in."
      />
      {rows.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="No controls yet">
          Controls appear once departments have questions.
        </EmptyState>
      ) : (
        <DataTable
          rows={rows}
          rowKey={(row) => row.code}
          columns={[
            {
              key: 'control',
              header: 'Control',
              render: (row) => (
                <span className={styles.personCell}>
                  <Link href={kbHref('controls', row.code)} className={styles.clientName}>
                    {titles.get(row.code) ?? row.code}
                  </Link>
                  <span className={`code ${styles.muted}`}>{row.code}</span>
                </span>
              ),
            },
            {
              key: 'questions',
              header: 'Questions',
              align: 'end',
              render: (row) => `${row.answered} of ${row.questions} answered`,
            },
            { key: 'gaps', header: 'Gaps', align: 'end', render: (row) => row.gaps },
            {
              key: 'owner',
              header: 'Owner',
              width: '32%',
              render: (row) =>
                canAssign ? (
                  <OwnerSelectForm
                    action={save}
                    hidden={{ controlCode: row.code }}
                    name="userId"
                    label={`Owner of ${row.code}`}
                    options={people}
                    current={row.ownerUserId}
                  />
                ) : (
                  (row.ownerName ?? <span className={styles.muted}>No owner</span>)
                ),
            },
          ]}
        />
      )}
    </>
  )
}
