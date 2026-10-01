import { can, CLIENT_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import {
  Chip,
  DataTable,
  DescriptionList,
  Disclosure,
  EmptyState,
  PageHeader,
  Panel,
  SectionHeader,
} from '@duatf/core-ui'
import {
  listClientPeople,
  listDepartments,
  listFirmStaff,
  type Person,
} from '@duatf/feature-compliance-api'
import { KeyRound, UserPlus, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { AccountControls, AssignStaffForm, InviteUserForm } from '@/components/forms/PeopleForms'
import { Status } from '@/components/status'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { accountAction, assignStaffAction, inviteClientUserAction } from '../../actions'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'People' }

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
        ...(canRemove || canManageAccount
          ? [
              {
                key: 'actions',
                header: <span className="visually-hidden">Actions</span>,
                label: '',
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
      <PageHeader
        title="People"
        lede={`Who can sign in for ${client.name}, and the ComplyX team on this engagement. Everyone signs in with a password and an authenticator app.`}
      />

      <section className={styles.section} aria-labelledby="client-people">
        <SectionHeader
          id="client-people"
          title={`${client.name} people`}
          count={people.clientUsers.length}
        />
        <Disclosure summary="What each client role can do" icon={KeyRound}>
          <DescriptionList
            columns={3}
            items={CLIENT_ROLES.map((role) => ({
              label: ROLE_LABEL[role],
              value: ROLE_DESCRIPTION[role],
            }))}
          />
        </Disclosure>
        {people.clientUsers.length === 0 ? (
          <EmptyState icon={Users} title="Nobody from the client has access yet" size="quiet">
            {canInvite
              ? 'Invite the DPO first; they can then invite department owners.'
              : 'The audit team invites the client DPO.'}
          </EmptyState>
        ) : (
          table(people.clientUsers, canInvite, canInvite)
        )}
      </section>

      {canInvite ? (
        <Panel title={`Invite someone from ${client.name}`} titleId="invite">
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
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
        </Panel>
      ) : null}

      <section className={styles.section} aria-labelledby="firm-team">
        <SectionHeader id="firm-team" title="ComplyX team" count={people.firmTeam.length} />
        {people.firmTeam.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No auditor is assigned to this client yet"
            size="quiet"
          >
            Firm-wide staff can already see it.
          </EmptyState>
        ) : (
          table(people.firmTeam, canAssign, false)
        )}
      </section>

      {canAssign ? (
        <Panel title="Add a staff member to this client" titleId="assign">
          <AssignStaffForm
            action={assignStaffAction.bind(null, client.id, client.code)}
            staff={staff
              .filter((person) => person.status !== 'disabled')
              .map((person) => ({
                value: person.userId,
                label: `${person.displayName} (${person.email})`,
              }))}
          />
        </Panel>
      ) : null}
    </>
  )
}
