import { ROLE_LABEL } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Chip, DataTable, EmptyState, PageHeader, Panel } from '@duatf/core-ui'
import { listClients, listFirmStaff, type Person } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { AccountControls, InviteStaffForm } from '@/components/forms/PeopleForms'
import { PermissionNotice } from '@/components/PermissionNotice'
import { Status } from '@/components/status'
import { permissionFor } from '@/server/auth'
import { serviceContext } from '@/server/services'
import { accountAction, inviteStaffAction } from '../../clients/actions'
import styles from '../../clients/clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Staff' }

const roleText = (assignment: Person['assignments'][number]) =>
  `${ROLE_LABEL[assignment.role]}, ${assignment.clientCode ?? 'all clients'}`

export default async function Page() {
  const { denial } = await permissionFor('platform.admin')
  if (denial)
    return <PermissionNotice denial={denial} back={{ href: '/', label: 'Back to the overview' }} />
  const ctx = await serviceContext()
  const [staff, clients] = await Promise.all([listFirmStaff(ctx), listClients(ctx)])
  const account = accountAction.bind(null, '/admin/staff')
  return (
    <div className={styles.page}>
      <PageHeader
        title="ComplyX staff"
        lede="Firm administrators manage staff and every client. Lead auditors run engagements; auditors work on the clients they are assigned to, or on all clients when given a firm-wide role."
      />
      {staff.length === 0 ? (
        <EmptyState title="No staff yet">Invite the first staff member below.</EmptyState>
      ) : (
        <DataTable
          rows={staff}
          rowKey={(row) => row.userId}
          columns={[
            {
              key: 'person',
              header: 'Person',
              render: (row) => (
                <span className={styles.personCell}>
                  <strong>{row.displayName}</strong>
                  <span className={styles.muted}>{row.email}</span>
                </span>
              ),
            },
            {
              key: 'roles',
              header: 'Roles',
              render: (row) => (
                <span className={styles.roles}>
                  {row.assignments.map((assignment) => (
                    <Chip key={assignment.assignmentId} tone="brand">
                      {roleText(assignment)}
                    </Chip>
                  ))}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Account',
              render: (row) => <Status kind="user" value={row.status} />,
            },
            {
              key: 'last',
              header: 'Last sign-in',
              priority: 'low',
              render: (row) =>
                row.lastLoginAt ? (
                  formatIst(row.lastLoginAt)
                ) : (
                  <span className={styles.muted}>Never</span>
                ),
            },
            {
              key: 'actions',
              header: <span className="visually-hidden">Actions</span>,
              label: '',
              render: (row) => (
                <AccountControls
                  action={account}
                  userId={row.userId}
                  name={row.displayName}
                  status={row.status}
                  canManageAccount={row.userId !== ctx.principal.userId}
                  assignments={row.assignments.map((assignment) => ({
                    assignmentId: assignment.assignmentId,
                    label: roleText(assignment),
                  }))}
                />
              ),
            },
          ]}
        />
      )}
      <Panel title="Invite a staff member" titleId="invite-staff">
        <p className={`${styles.flush} ${styles.sectionIntro}`}>
          DUATF creates their sign-in and shows a one-time password once. At first sign-in they
          choose their own password and set up an authenticator app.
        </p>
        <InviteStaffForm
          action={inviteStaffAction}
          clients={clients.map((client) => ({
            value: client.id,
            label: `${client.name} (${client.code})`,
          }))}
        />
      </Panel>
    </div>
  )
}
