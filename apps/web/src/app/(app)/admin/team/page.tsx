import { FIRM_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Chip, DataTable, PageHeader, Panel } from '@duatf/core-ui'
import { listStaff } from '@duatf/feature-compliance-api'
import { KeyRound } from 'lucide-react'
import type { Metadata } from 'next'
import { OwnerSelectForm } from '@/components/forms/AssignForms'
import { AddStaffForm, LoginControls } from '@/components/forms/PeopleForms'
import { requireCapability } from '@/server/auth'
import { serviceContext } from '@/server/services'
import styles from '../../clients/clients.module.css'
import { createStaffAction, staffLoginAction, staffRoleAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Team' }

export default async function Page() {
  await requireCapability('platform.admin')
  const ctx = await serviceContext()
  const staff = await listStaff(ctx)
  const roles = FIRM_ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }))

  return (
    <>
      <PageHeader
        title="Team"
        lede="The ComplyX team: administrators, senior auditors and auditors. They work across every client. Administrators and senior auditors add the people at each client under that client's People; change a team member's role here to let them do so."
      />
      <DataTable
        rows={staff}
        rowKey={(row) => row.userId}
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (row) => (
              <span className={styles.personCell}>
                <span className={styles.clientName}>{row.displayName}</span>
                {row.jobTitle ? <span className={styles.muted}>{row.jobTitle}</span> : null}
                {row.email ? <span className={styles.muted}>{row.email}</span> : null}
              </span>
            ),
          },
          {
            key: 'roles',
            header: 'Role',
            render: (row) => {
              const firm = row.roles.filter((item) => item.clientId === null)
              return row.userId === ctx.principal.userId || firm.length !== 1 ? (
                <span className={styles.roles}>
                  {firm.map((item) => (
                    <Chip key={item.id} title={ROLE_DESCRIPTION[item.role]}>
                      {ROLE_LABEL[item.role]}
                    </Chip>
                  ))}
                </span>
              ) : (
                <OwnerSelectForm
                  action={staffRoleAction}
                  hidden={{ userId: row.userId }}
                  name="role"
                  label={`Role of ${row.displayName}`}
                  options={roles}
                  current={firm[0]?.role ?? null}
                  placeholder={null}
                  confirm={{
                    firm_admin: `Make ${row.displayName} an Administrator? Administrators manage the team, risk bands and the knowledge base.`,
                  }}
                />
              )
            },
          },
          {
            key: 'login',
            header: 'Sign-in',
            render: (row) =>
              row.loginEnabled ? (
                <span className={styles.personCell}>
                  <Chip tone="success" icon={KeyRound}>
                    {row.username}
                  </Chip>
                  <span className={styles.muted}>
                    {row.lastLoginAt
                      ? `Last signed in ${formatIst(row.lastLoginAt)}`
                      : 'Not signed in yet'}
                  </span>
                </span>
              ) : (
                <span className={styles.muted}>Login switched off</span>
              ),
          },
          {
            key: 'manage',
            header: <span className="visually-hidden">Manage</span>,
            label: '',
            render: (row) =>
              row.userId === ctx.principal.userId ? (
                <span className={styles.muted}>You</span>
              ) : row.username ? (
                <LoginControls
                  action={staffLoginAction}
                  userId={row.userId}
                  username={row.username}
                  loginEnabled={row.loginEnabled}
                />
              ) : null,
          },
        ]}
      />
      <Panel title="Add a team member" titleId="add-staff">
        <AddStaffForm action={createStaffAction} roles={roles} />
      </Panel>
    </>
  )
}
