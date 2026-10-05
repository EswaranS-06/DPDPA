'use client'

import { FormActions, SubmitButton, TextField } from '@duatf/core-ui'
import { useActionState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** Username and password, one button. */
export const SignInForm = ({ action, next }: { action: Action; next: string }) => {
  const [state, formAction] = useActionState(action, IDLE)
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <input type="hidden" name="next" value={next} />
      <TextField
        label="Username"
        name="username"
        required
        autoComplete="username"
        defaultValue={state.values?.username}
        error={error('username')}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        error={error('password')}
      />
      <FormActions>
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </FormActions>
    </form>
  )
}

/** Current password, then the new one twice. */
export const ChangePasswordForm = ({
  action,
  minLength,
}: {
  action: Action
  minLength: number
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextField
        label="Current password"
        name="current"
        type="password"
        required
        autoComplete="current-password"
        error={error('current')}
        hint="The one-time password, if this is your first sign-in."
      />
      <TextField
        label="New password"
        name="next"
        type="password"
        required
        autoComplete="new-password"
        error={error('next')}
        hint={`At least ${minLength} characters, without your username.`}
      />
      <TextField
        label="New password again"
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
        error={error('confirm')}
      />
      <FormActions>
        <SubmitButton pendingText="Saving…">Change password</SubmitButton>
      </FormActions>
    </form>
  )
}
