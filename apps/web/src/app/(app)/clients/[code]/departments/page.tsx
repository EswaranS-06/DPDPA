import { can } from '@duatf/core-access'
import { Chip, DataTable, EmptyState } from '@duatf/core-ui'
import { listDepartments } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
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
      <section className={styles.section} aria-labelledby="departments-title">
        <h2 id="departments-title" className={styles.sectionTitle}>
          Departments
        </h2>
        <p className={styles.sectionIntro}>
          Assessment questions are assigned to departments, and department owners answer for their
          own department only.
        </p>
        {departments.length === 0 ? (
          <EmptyState title="No departments yet.">
            {canManage ? 'Add the first department below.' : null}
          </EmptyState>
        ) : (
          <DataTable
            rows={departments}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'code',
                header: 'Code',
                render: (row) => <span className={styles.code}>{row.fullCode}</span>,
              },
              {
                key: 'name',
                header: 'Department',
                render: (row) => (
                  <span className={styles.personCell}>
                    <strong>{row.name}</strong>
                    {row.description ? (
                      <span className={styles.muted}>{row.description}</span>
                    ) : null}
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
                    '—'
                  ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) =>
                  row.active ? <Chip tone="live">Active</Chip> : <Chip>Inactive</Chip>,
              },
              ...(canManage
                ? [
                    {
                      key: 'actions',
                      header: <span className="visually-hidden">Actions</span>,
                      render: (row: (typeof departments)[number]) => (
                        <form action={toggle}>
                          <input type="hidden" name="departmentId" value={row.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={row.active ? 'false' : 'true'}
                          />
                          <button type="submit" className={formStyles.linkish}>
                            {row.active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </form>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </section>
      {canManage ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="add-department">
          <h2 id="add-department" className={styles.sectionTitle}>
            Add a department
          </h2>
          <DepartmentForm action={createDepartmentAction.bind(null, client.id, client.code)} />
        </section>
      ) : null}
    </>
  )
}
