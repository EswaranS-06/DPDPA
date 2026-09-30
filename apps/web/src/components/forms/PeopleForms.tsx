'use client'

import {
  FormAlert,
  SelectField,
  SubmitButton,
  TextField,
  TextAreaField,
  type SelectOption,
} from '@duatf/core-ui'
import { useActionState, useState, type MouseEvent } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** Success or error line, plus a one-time secret when the action returned one. */
export const Feedback = ({ state }: { state: FormState }) => {
  if (state.status === 'idle') return null
  if (state.status === 'error') return <FormAlert>{state.message}</FormAlert>
  return (
    <FormAlert tone="success">
      <div className={styles.secret}>
        <span>{state.message}</span>
        {state.secret ? (
          <>
            <span>
              {state.secret.label}: <code className={styles.secretValue}>{state.secret.value}</code>
            </span>
            <span className={styles.small}>
              This is shown once and is not stored by DUATF. Copy it now.
            </span>
          </>
        ) : null}
      </div>
    </FormAlert>
  )
}

const useForm = (action: Action) => {
  const [state, formAction] = useActionState(action, IDLE)
  const value = (name: string) => (state.status === 'error' ? (state.values?.[name] ?? '') : '')
  const error = (name: string) => state.fieldErrors?.[name]
  return { state, formAction, value, error }
}

export const DepartmentForm = ({ action }: { action: Action }) => {
  const { state, formAction, value, error } = useForm(action)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Code"
          name="code"
          required
          maxLength={10}
          defaultValue={value('code')}
          error={error('code')}
          hint="e.g. HR, FIN, IT"
        />
        <TextField
          label="Department name"
          name="name"
          required
          defaultValue={value('name')}
          error={error('name')}
        />
        <TextField
          label="Head of department"
          name="headName"
          defaultValue={value('headName')}
          error={error('headName')}
        />
        <TextField
          label="Head's email"
          name="headEmail"
          type="email"
          defaultValue={value('headEmail')}
          error={error('headEmail')}
        />
      </div>
      <TextAreaField
        label="What the department does with personal data"
        name="description"
        rows={2}
        defaultValue={value('description')}
        error={error('description')}
      />
      <div>
        <SubmitButton pendingText="Adding…">Add department</SubmitButton>
      </div>
    </form>
  )
}

type InviteUserFormProps = {
  action: Action
  roles: SelectOption[]
  departments: SelectOption[]
}

export const InviteUserForm = ({ action, roles, departments }: InviteUserFormProps) => {
  const { state, formAction, value, error } = useForm(action)
  const [role, setRole] = useState(value('role') || 'client_viewer')
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Name"
          name="displayName"
          required
          defaultValue={value('displayName')}
          error={error('displayName')}
        />
        <TextField
          label="Work email"
          name="email"
          type="email"
          required
          defaultValue={value('email')}
          error={error('email')}
        />
        <SelectField
          label="Role"
          name="role"
          required
          options={roles}
          defaultValue={role}
          error={error('role')}
          onChange={setRole}
        />
        {role === 'department_owner' ? (
          <SelectField
            label="Department"
            name="departmentId"
            required
            placeholder="Choose…"
            options={departments}
            defaultValue={value('departmentId')}
            error={error('departmentId')}
          />
        ) : null}
      </div>
      <div>
        <SubmitButton pendingText="Inviting…">Invite</SubmitButton>
      </div>
    </form>
  )
}

export const AssignStaffForm = ({ action, staff }: { action: Action; staff: SelectOption[] }) => {
  const { state, formAction, value, error } = useForm(action)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <SelectField
          label="ComplyX staff member"
          name="userId"
          required
          placeholder="Choose…"
          options={staff}
          defaultValue={value('userId')}
          error={error('userId')}
        />
        <SelectField
          label="Role on this client"
          name="role"
          required
          options={[
            { value: 'auditor', label: 'Auditor' },
            { value: 'lead_auditor', label: 'Lead auditor' },
          ]}
          defaultValue={value('role') || 'auditor'}
          error={error('role')}
        />
      </div>
      <div>
        <SubmitButton pendingText="Adding…">Add to team</SubmitButton>
      </div>
    </form>
  )
}

type InviteStaffFormProps = { action: Action; clients: SelectOption[] }

export const InviteStaffForm = ({ action, clients }: InviteStaffFormProps) => {
  const { state, formAction, value, error } = useForm(action)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Name"
          name="displayName"
          required
          defaultValue={value('displayName')}
          error={error('displayName')}
        />
        <TextField
          label="Work email"
          name="email"
          type="email"
          required
          defaultValue={value('email')}
          error={error('email')}
        />
        <SelectField
          label="Role"
          name="role"
          required
          options={[
            { value: 'auditor', label: 'Auditor' },
            { value: 'lead_auditor', label: 'Lead auditor' },
            { value: 'firm_admin', label: 'Firm administrator' },
          ]}
          defaultValue={value('role') || 'auditor'}
          error={error('role')}
        />
        <SelectField
          label="Client"
          name="clientId"
          placeholder="All clients"
          options={clients}
          defaultValue={value('clientId')}
          error={error('clientId')}
          hint="Leave as All clients for firm-wide access."
        />
      </div>
      <div>
        <SubmitButton pendingText="Inviting…">Invite staff member</SubmitButton>
      </div>
    </form>
  )
}

const confirmFirst = (message: string) => (event: MouseEvent<HTMLButtonElement>) => {
  if (!window.confirm(message)) event.preventDefault()
}

type AccountControlsProps = {
  action: Action
  userId: string
  name: string
  status: 'invited' | 'active' | 'disabled'
  assignments: { assignmentId: string; label: string }[]
  canManageAccount: boolean
}

/** Per-person buttons: remove a role, issue a new one-time password, disable or enable. */
export const AccountControls = ({
  action,
  userId,
  name,
  status,
  assignments,
  canManageAccount,
}: AccountControlsProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <div className={styles.secret}>
      <div className={styles.rowActions}>
        {assignments.map((assignment) => (
          <form key={assignment.assignmentId} action={formAction}>
            <input type="hidden" name="intent" value="remove" />
            <input type="hidden" name="assignmentId" value={assignment.assignmentId} />
            <button
              type="submit"
              className={`${styles.linkish} ${styles.danger}`}
              onClick={confirmFirst(`Remove the role "${assignment.label}" from ${name}?`)}
            >
              Remove {assignment.label}
            </button>
          </form>
        ))}
        {canManageAccount ? (
          <form action={formAction} className={styles.rowActions}>
            <input type="hidden" name="userId" value={userId} />
            {status !== 'disabled' ? (
              <button
                type="submit"
                name="intent"
                value="reset"
                className={styles.linkish}
                onClick={confirmFirst(
                  `Issue a new one-time password for ${name}? Their current password stops working.`,
                )}
              >
                New one-time password
              </button>
            ) : null}
            {status === 'disabled' ? (
              <button type="submit" name="intent" value="enable" className={styles.linkish}>
                Enable
              </button>
            ) : (
              <button
                type="submit"
                name="intent"
                value="disable"
                className={`${styles.linkish} ${styles.danger}`}
                onClick={confirmFirst(`Disable ${name}? They are signed out at once.`)}
              >
                Disable
              </button>
            )}
          </form>
        ) : null}
      </div>
      <Feedback state={state} />
    </div>
  )
}
