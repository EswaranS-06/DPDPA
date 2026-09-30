import { can, CLIENT_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Chip, DataTable, EmptyState } from '@duatf/core-ui'
import {
  listClientPeople,
  listDepartments,
  listFirmStaff,
  type Person,
} from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { AccountControls, AssignStaffForm, InviteUserForm } from '@/components/forms/PeopleForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { accountAction, assignStaffAction, inviteClientUserAction } from '../../actions'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'People' }

const STATUS_CHIP = {
  active: <Chip tone="live">Active</Chip>,
  invited: <Chip tone="pending">Invited, not signed in yet</Chip>,
  disabled: <Chip tone="severe">Disabled</Chip>,
} as const

const roleText = (assignment: Person['assignments'][number]) =>
  `${ROLE_LABEL[assignment.role]}${assignment.departmentName ? `, ${assignment.departmentName}` : ''}`

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const scope = { clientId: client.id }
  const canInvite = can(ctx.principal, 'user.invite', scope)
  const canAssign = can(ctx.principal, 'client.assign_staff', scope)
  const [people, departments, staff] = await Promise.all([
    listClientPeople(ctx, client.id),
    listDepartments(ctx, client.id),
    canAssign ? listFirmStaff(ctx) : Promise.resolve([]),
  ])
  const account = accountAction.bind(null, `/clients/${client.code}/people`)

  const table = (rows: Person[], canRemove: boolean, canManageAccount: boolean) => (
    <DataTable
      rows={rows}
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
          header: 'Role',
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
        ...(canRemove || canManageAccount
          ? [
              {
                key: 'actions',
                header: <span className="visually-hidden">Actions</span>,
                render: (row: Person) => (
                  <AccountControls
                    action={account}
                    userId={row.userId}
                    name={row.displayName}
                    status={row.status}
                    canManageAccount={canManageAccount && row.userId !== ctx.principal.userId}
                    assignments={
                      canRemove
                        ? row.assignments.map((assignment) => ({
                            assignmentId: assignment.assignmentId,
                            label: roleText(assignment),
                          }))
                        : []
                    }
                  />
                ),
              },
            ]
          : []),
      ]}
    />
  )

  return (
    <>
      <section className={styles.section} aria-labelledby="client-people">
        <h2 id="client-people" className={styles.sectionTitle}>
          {client.name} people
        </h2>
        <p className={styles.sectionIntro}>
          {CLIENT_ROLES.map((role) => `${ROLE_LABEL[role]}: ${ROLE_DESCRIPTION[role]}`).join(' ')}
        </p>
        {people.clientUsers.length === 0 ? (
          <EmptyState title="Nobody from the client has access yet." />
        ) : (
          table(people.clientUsers, canInvite, canInvite)
        )}
      </section>

      {canInvite ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="invite">
          <h2 id="invite" className={styles.sectionTitle}>
            Invite someone from {client.name}
          </h2>
          <p className={styles.sectionIntro}>
            DUATF creates their sign-in and shows a one-time password once. At first sign-in they
            choose their own password and set up an authenticator app.
          </p>
          <InviteUserForm
            action={inviteClientUserAction.bind(null, client.id, client.code)}
            roles={CLIENT_ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }))}
            departments={departments
              .filter((row) => row.active)
              .map((row) => ({ value: row.id, label: `${row.name} (${row.code})` }))}
          />
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="firm-team">
        <h2 id="firm-team" className={styles.sectionTitle}>
          ComplyX team
        </h2>
        {people.firmTeam.length === 0 ? (
          <EmptyState title="No auditor is assigned to this client yet.">
            Firm-wide staff can already see it.
          </EmptyState>
        ) : (
          table(people.firmTeam, canAssign, false)
        )}
      </section>

      {canAssign ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="assign">
          <h2 id="assign" className={styles.sectionTitle}>
            Add a staff member to this client
          </h2>
          <AssignStaffForm
            action={assignStaffAction.bind(null, client.id, client.code)}
            staff={staff
              .filter((person) => person.status !== 'disabled')
              .map((person) => ({
                value: person.userId,
                label: `${person.displayName} (${person.email})`,
              }))}
          />
        </section>
      ) : null}
    </>
  )
}
