import { ROLE_LABEL } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Chip, DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import { listClients, listFirmStaff, type Person } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { AccountControls, InviteStaffForm } from '@/components/forms/PeopleForms'
import { requireCapability } from '@/server/auth'
import { serviceContext } from '@/server/services'
import { accountAction, inviteStaffAction } from '../../clients/actions'
import styles from '../../clients/clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Staff' }

const STATUS_CHIP = {
  active: <Chip tone="live">Active</Chip>,
  invited: <Chip tone="pending">Invited</Chip>,
  disabled: <Chip tone="severe">Disabled</Chip>,
} as const

const roleText = (assignment: Person['assignments'][number]) =>
  `${ROLE_LABEL[assignment.role]}, ${assignment.clientCode ?? 'all clients'}`

export default async function Page() {
  await requireCapability('platform.admin')
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
        <EmptyState title="No staff yet." />
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
                    <Chip key={assignment.assignmentId} tone="accent">
                      {roleText(assignment)}
                    </Chip>
                  ))}
                </span>
              ),
            },
            { key: 'status', header: 'Account', render: (row) => STATUS_CHIP[row.status] },
            {
              key: 'last',
              header: 'Last sign-in',
              render: (row) => (row.lastLoginAt ? formatIst(row.lastLoginAt) : '—'),
            },
            {
              key: 'actions',
              header: <span className="visually-hidden">Actions</span>,
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
      <section className={`${styles.section} ${styles.panel}`} aria-labelledby="invite-staff">
        <h2 id="invite-staff" className={styles.sectionTitle}>
          Invite a staff member
        </h2>
        <p className={styles.sectionIntro}>
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
      </section>
    </div>
  )
}
