'use client'

import {
  FormActions,
  SelectField,
  SubmitButton,
  TextField,
  type SelectOption,
} from '@duatf/core-ui'
import { useActionState, useState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'
import answerStyles from './AssessmentForms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

const useForm = (action: Action) => {
  const [state, formAction] = useActionState(action, IDLE)
  const value = (name: string) => (state.status === 'error' ? (state.values?.[name] ?? '') : '')
  const error = (name: string) => state.fieldErrors?.[name]
  return { state, formAction, value, error }
}

/** Name, job title and contact of a person, shared by the people and team forms. */
const PersonFields = ({
  value,
  error,
}: {
  value: (name: string) => string
  error: (name: string) => string | undefined
}) => (
  <div className={styles.inline}>
    <TextField
      label="Name"
      name="displayName"
      required
      defaultValue={value('displayName')}
      error={error('displayName')}
      hint="A person (Ravi Kumar) or a role (IT Head)"
    />
    <TextField
      label="Job title"
      name="jobTitle"
      defaultValue={value('jobTitle')}
      error={error('jobTitle')}
    />
    <TextField
      label="Email"
      name="email"
      type="email"
      defaultValue={value('email')}
      error={error('email')}
    />
  </div>
)

/**
 * Adds a person at a client with a role. Sign-in is optional: without it the person can still
 * be given questions, evidence requests, actions and controls.
 */
export const AddPersonForm = ({
  action,
  roles,
  departments,
}: {
  action: Action
  roles: SelectOption[]
  departments: SelectOption[]
}) => {
  const { state, formAction, value, error } = useForm(action)
  const [role, setRole] = useState(value('role') || 'department_owner')
  const [login, setLogin] = useState(value('allowLogin') === 'on')
  // React clears the form after a person is added; the remembered choices follow it.
  const [seen, setSeen] = useState(state)
  if (seen !== state) {
    setSeen(state)
    if (state.status === 'success') {
      setRole('department_owner')
      setLogin(false)
    }
  }
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <PersonFields value={value} error={error} />
      <div className={styles.inline}>
        <SelectField
          label="Role"
          name="role"
          required
          options={roles}
          defaultValue={role}
          onChange={setRole}
          error={error('role')}
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
      <label className={answerStyles.inlineCheck}>
        <input
          type="checkbox"
          name="allowLogin"
          checked={login}
          onChange={(event) => setLogin(event.target.checked)}
        />
        Let this person sign in to review their work and upload evidence
      </label>
      {login ? (
        <TextField
          label="Username"
          name="username"
          required
          defaultValue={value('username')}
          error={error('username')}
          hint="Letters, digits, dots or dashes, e.g. it-head. A one-time password is shown once."
        />
      ) : null}
      <FormActions>
        <SubmitButton pendingText="Adding…">Add person</SubmitButton>
      </FormActions>
    </form>
  )
}

/** Adds a member of the ComplyX team with a login. */
export const AddStaffForm = ({ action, roles }: { action: Action; roles: SelectOption[] }) => {
  const { state, formAction, value, error } = useForm(action)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <PersonFields value={value} error={error} />
      <div className={styles.inline}>
        <SelectField
          label="Role"
          name="role"
          required
          options={roles}
          defaultValue={value('role') || 'auditor'}
          error={error('role')}
        />
        <TextField
          label="Username"
          name="username"
          required
          defaultValue={value('username')}
          error={error('username')}
        />
      </div>
      <FormActions>
        <SubmitButton pendingText="Adding…">Add to the team</SubmitButton>
      </FormActions>
    </form>
  )
}

/** Login controls of one person: a username to switch it on, a new password, or switch off. */
export const LoginControls = ({
  action,
  userId,
  username,
  loginEnabled,
}: {
  action: Action
  userId: string
  username: string | null
  loginEnabled: boolean
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.secret}>
      <Feedback state={state} />
      <input type="hidden" name="userId" value={userId} />
      {loginEnabled ? (
        <span className={styles.rowActions}>
          <button type="submit" name="intent" value="reset" className={styles.linkish}>
            New one-time password
          </button>
          <button
            type="submit"
            name="intent"
            value="revoke"
            className={`${styles.linkish} ${styles.danger}`}
          >
            Switch login off
          </button>
        </span>
      ) : (
        <span className={styles.rowActions}>
          <label className="visually-hidden" htmlFor={`username-${userId}`}>
            Username
          </label>
          <input
            id={`username-${userId}`}
            name="username"
            defaultValue={username ?? ''}
            placeholder="username, e.g. it-head"
            className={styles.compactInput}
          />
          <button type="submit" name="intent" value="issue" className={styles.linkish}>
            Allow sign-in
          </button>
        </span>
      )}
      {state.status === 'error' && state.fieldErrors?.username ? (
        <span className={styles.fieldError}>{state.fieldErrors.username}</span>
      ) : null}
    </form>
  )
}

/** A small one-button form (remove a role, and similar). */
export const SmallActionForm = ({
  action,
  fields,
  label,
  danger = false,
}: {
  action: Action
  fields: Record<string, string>
  label: string
  danger?: boolean
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.secret}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className={danger ? `${styles.linkish} ${styles.danger}` : styles.linkish}
      >
        {label}
      </button>
      {state.status === 'error' ? <Feedback state={state} /> : null}
    </form>
  )
}

/** Gives a person at the client another role. */
export const AddRoleForm = ({
  action,
  userId,
  roles,
  departments,
}: {
  action: Action
  userId: string
  roles: SelectOption[]
  departments: SelectOption[]
}) => {
  const { state, formAction, error } = useForm(action)
  const [role, setRole] = useState('department_owner')
  const [seen, setSeen] = useState(state)
  if (seen !== state) {
    setSeen(state)
    if (state.status === 'success') setRole('department_owner')
  }
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <input type="hidden" name="intent" value="add-role" />
      <input type="hidden" name="userId" value={userId} />
      <div className={styles.inline}>
        <SelectField
          label="Role"
          name="role"
          options={roles}
          defaultValue={role}
          onChange={setRole}
          error={error('role')}
        />
        {role === 'department_owner' ? (
          <SelectField
            label="Department"
            name="departmentId"
            placeholder="Choose…"
            options={departments}
            error={error('departmentId')}
          />
        ) : null}
      </div>
      <FormActions>
        <SubmitButton variant="secondary" pendingText="Adding…">
          Add role
        </SubmitButton>
      </FormActions>
    </form>
  )
}
