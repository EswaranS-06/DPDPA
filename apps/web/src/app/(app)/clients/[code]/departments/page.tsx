import { buttonClass, Chip, DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import { listDepartments } from '@duatf/feature-compliance-api'
import { CircleCheck, CircleMinus, Network, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import formStyles from '@/components/forms/forms.module.css'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { setDepartmentActiveAction } from '../../actions'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Departments' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const departments = await listDepartments(ctx, client.id)
  const toggle = setDepartmentActiveAction.bind(null, client.id, client.code)
  const base = `/clients/${client.code}/departments`

  return (
    <>
      <PageHeader
        title="Departments and vendors"
        lede="Each department or vendor gets the questions you choose for it. Open one to answer its questions, attach evidence and tick each answer once checked."
        actions={
          <Link href={`${base}/new`} className={buttonClass('primary')}>
            <Plus size={16} aria-hidden="true" />
            Add department
          </Link>
        }
      />
      {departments.length === 0 ? (
        <EmptyState icon={Network} title="No departments yet">
          Add the departments that hold personal data (HR, IT, customer service) and each vendor
          that processes it. While adding one you choose its questions from the templates.
        </EmptyState>
      ) : (
        <DataTable
          rows={departments}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: 'Department',
              render: (row) => (
                <span className={styles.personCell}>
                  <Link href={`${base}/${row.code}`} className={styles.clientName}>
                    {row.name}
                  </Link>
                  <span className={`code ${styles.muted}`}>{row.fullCode}</span>
                  {row.description ? <span className={styles.muted}>{row.description}</span> : null}
                </span>
              ),
            },
            {
              key: 'head',
              header: 'Contact',
              render: (row) =>
                row.headName || row.headEmail ? (
                  <span className={styles.personCell}>
                    {row.headName}
                    {row.headEmail ? <span className={styles.muted}>{row.headEmail}</span> : null}
                  </span>
                ) : (
                  <span className={styles.muted}>Not recorded</span>
                ),
            },
            {
              key: 'questions',
              header: 'Answered',
              render: (row) =>
                row.questionCount === 0 ? (
                  <Link href={`${base}/${row.code}/edit`}>Choose questions</Link>
                ) : (
                  <span>
                    {row.answeredCount} of {row.questionCount}
                  </span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) =>
                row.active ? (
                  <Chip tone="success" icon={CircleCheck}>
                    Active
                  </Chip>
                ) : (
                  <Chip icon={CircleMinus}>Inactive</Chip>
                ),
            },
            {
              key: 'actions',
              header: <span className="visually-hidden">Actions</span>,
              label: '',
              render: (row) => (
                <span className={formStyles.rowActions}>
                  {row.active ? (
                    <Link href={`${base}/${row.code}/edit`} className={formStyles.linkish}>
                      Edit<span className="visually-hidden"> {row.name}</span>
                    </Link>
                  ) : null}
                  <form action={toggle}>
                    <input type="hidden" name="departmentId" value={row.id} />
                    <input type="hidden" name="active" value={row.active ? 'false' : 'true'} />
                    <button type="submit" className={formStyles.linkish}>
                      {row.active ? 'Deactivate' : 'Reactivate'}
                      <span className="visually-hidden"> {row.name}</span>
                    </button>
                  </form>
                </span>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
