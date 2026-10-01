import { can } from '@duatf/core-access'
import { Chip, DataTable, EmptyState, PageHeader, Panel } from '@duatf/core-ui'
import { listDepartments } from '@duatf/feature-compliance-api'
import { CircleCheck, CircleMinus, Network } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DepartmentForm } from '@/components/forms/PeopleForms'
import formStyles from '@/components/forms/forms.module.css'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { createDepartmentAction, setDepartmentActiveAction } from '../../actions'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Departments' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const departments = await listDepartments(ctx, client.id)
  const canManage = can(ctx.principal, 'department.manage', { clientId: client.id })
  const toggle = setDepartmentActiveAction.bind(null, client.id, client.code)

  return (
    <>
      <PageHeader
        title="Departments"
        lede="Assessment questions are assigned to departments, and department owners answer for their own department only. Open a department for its dashboard."
      />
      {departments.length === 0 ? (
        <EmptyState icon={Network} title="No departments yet">
          {canManage
            ? 'Add the departments that hold personal data: HR, IT, customer service and so on. Questions are then assigned to them.'
            : 'The audit team or the DPO adds departments.'}
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
                  <Link
                    href={`/clients/${client.code}/departments/${row.code}`}
                    className={styles.clientName}
                  >
                    {row.name}
                  </Link>
                  <span className={`code ${styles.muted}`}>{row.fullCode}</span>
                  {row.description ? <span className={styles.muted}>{row.description}</span> : null}
                </span>
              ),
            },
            {
              key: 'head',
              header: 'Head',
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
            ...(canManage
              ? [
                  {
                    key: 'actions',
                    header: <span className="visually-hidden">Actions</span>,
                    label: '',
                    render: (row: (typeof departments)[number]) => (
                      <form action={toggle}>
                        <input type="hidden" name="departmentId" value={row.id} />
                        <input type="hidden" name="active" value={row.active ? 'false' : 'true'} />
                        <button type="submit" className={formStyles.linkish}>
                          {row.active ? 'Deactivate' : 'Reactivate'}
                          <span className="visually-hidden"> {row.name}</span>
                        </button>
                      </form>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
      {canManage ? (
        <Panel title="Add a department" titleId="add-department">
          <DepartmentForm action={createDepartmentAction.bind(null, client.id, client.code)} />
        </Panel>
      ) : null}
    </>
  )
}
