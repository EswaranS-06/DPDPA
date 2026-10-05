import { can, CLIENT_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Chip, DataTable, Disclosure, EmptyState, PageHeader, Panel } from '@duatf/core-ui'
import { listClientPeople, listDepartments } from '@duatf/feature-compliance-api'
import { KeyRound, Users } from 'lucide-react'
import type { Metadata } from 'next'
import {
  AddPersonForm,
  AddRoleForm,
  LoginControls,
  SmallActionForm,
} from '@/components/forms/PeopleForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { createPersonAction, personAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'People' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const [people, departments] = await Promise.all([
    listClientPeople(ctx, client.id),
    listDepartments(ctx, client.id),
  ])
  const canManage = can(ctx.principal, 'user.invite', { clientId: client.id })
  const roles = CLIENT_ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }))
  const departmentOptions = departments
    .filter((row) => row.active)
    .map((row) => ({ value: row.id, label: row.name }))
  const act = personAction.bind(null, client.id, client.code)
  const clientPeople = people.filter((person) => person.kind === 'client')

  return (
    <>
      <PageHeader
        title="People"
        lede={
          canManage
            ? `People at ${client.name} whom you give questions, evidence requests, actions and controls, such as an IT Head. Sign-in is optional: with a login they can review what you filled in and upload evidence; everything stays visible to you.`
            : `The people at ${client.name} who look after questions, evidence, actions and controls in this assessment.`
        }
      />
      {clientPeople.length === 0 ? (
        <EmptyState icon={Users} title="No people yet">
          Add the heads of departments and other contacts you work with. They need no login to be
          given work.
        </EmptyState>
      ) : (
        <DataTable
          rows={clientPeople}
          rowKey={(row) => row.userId}
          columns={[
            {
              key: 'name',
              header: 'Person',
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
              header: 'Roles',
              render: (row) => (
                <span className={styles.roles}>
                  {row.roles
                    .filter((item) => item.clientId === client.id)
                    .map((item) => (
                      <span key={item.id} className={styles.roles}>
                        <Chip title={ROLE_DESCRIPTION[item.role]}>
                          {ROLE_LABEL[item.role]}
                          {item.departmentName ? `, ${item.departmentName}` : ''}
                        </Chip>
                        {canManage && row.roles.length > 1 ? (
                          <SmallActionForm
                            action={act}
                            fields={{
                              intent: 'remove-role',
                              userId: row.userId,
                              assignmentId: item.id,
                            }}
                            label="Remove"
                            danger
                          />
                        ) : null}
                      </span>
                    ))}
                </span>
              ),
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
                      {row.mustChangePassword
                        ? 'One-time password not used yet'
                        : row.lastLoginAt
                          ? `Last signed in ${formatIst(row.lastLoginAt)}`
                          : 'Not signed in yet'}
                    </span>
                  </span>
                ) : (
                  <span className={styles.muted}>No login</span>
                ),
            },
            ...(canManage
              ? [
                  {
                    key: 'manage',
                    header: <span className="visually-hidden">Manage</span>,
                    label: '',
                    render: (row: (typeof clientPeople)[number]) => (
                      <span className={styles.personCell}>
                        <LoginControls
                          action={act}
                          userId={row.userId}
                          username={row.username}
                          loginEnabled={row.loginEnabled}
                        />
                        <Disclosure summary="Add a role">
                          <AddRoleForm
                            action={act}
                            userId={row.userId}
                            roles={roles}
                            departments={departmentOptions}
                          />
                        </Disclosure>
                      </span>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
      {canManage ? (
        <Panel title="Add a person" titleId="add-person">
          <AddPersonForm
            action={createPersonAction.bind(null, client.id, client.code)}
            roles={roles}
            departments={departmentOptions}
          />
        </Panel>
      ) : null}
    </>
  )
}
