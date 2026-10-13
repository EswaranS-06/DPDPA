'use client'

import {
  FormActions,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  type SelectOption,
} from '@duatf/core-ui'
import { BadgeCheck, Send, Undo2 } from 'lucide-react'
import { useActionState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** The tick that confirms the approver has read the open errors of the quality check. */
const Acknowledge = ({ errors, error }: { errors: number; error?: string }) =>
  errors > 0 ? (
    <div className={styles.checkList}>
      <label className={styles.checkItem}>
        <input type="checkbox" name="acknowledge" />I have read the {errors} open{' '}
        {errors === 1 ? 'error' : 'errors'} of the quality check and sign off with{' '}
        {errors === 1 ? 'it' : 'them'} recorded.
      </label>
      {error ? <p className={styles.fieldError}>{error}</p> : null}
    </div>
  ) : null

/** Sends the cycle to a named approver, with a deadline. */
export const RequestSignoffForm = ({
  action,
  approvers,
}: {
  action: Action
  approvers: SelectOption[]
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <SelectField
          label="Who signs off"
          name="approverUserId"
          required
          placeholder="Choose…"
          options={approvers}
          defaultValue={state.values?.approverUserId}
          error={state.fieldErrors?.approverUserId}
        />
        <TextField
          label="Decide by"
          name="dueDate"
          type="date"
          defaultValue={state.values?.dueDate}
          error={state.fieldErrors?.dueDate}
        />
      </div>
      <TextAreaField
        label="Note for the approver"
        name="note"
        rows={2}
        defaultValue={state.values?.note}
        error={state.fieldErrors?.note}
      />
      <FormActions>
        <SubmitButton pendingText="Sending…">
          <Send size={16} aria-hidden="true" /> Send for sign-off
        </SubmitButton>
      </FormActions>
    </form>
  )
}

/** Signs the cycle off directly, for a person who may sign off. */
export const SignOffNowForm = ({ action, errors }: { action: Action; errors: number }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="Sign-off note"
        name="note"
        rows={2}
        defaultValue={state.values?.note}
        error={state.fieldErrors?.note}
        hint="Kept with the sign-off and shown on the assessment statement."
      />
      <Acknowledge errors={errors} error={state.fieldErrors?.acknowledge} />
      <FormActions>
        <SubmitButton pendingText="Signing off…">
          <BadgeCheck size={16} aria-hidden="true" /> Sign off and complete
        </SubmitButton>
      </FormActions>
    </form>
  )
}

/** The approver's decision on a cycle sent to them. */
export const DecideSignoffForm = ({ action, errors }: { action: Action; errors: number }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="Decision note"
        name="note"
        rows={2}
        defaultValue={state.values?.note}
        error={state.fieldErrors?.note}
        hint="Required when asking for changes."
      />
      <Acknowledge errors={errors} error={state.fieldErrors?.acknowledge} />
      <FormActions>
        <SubmitButton name="decision" value="approve" pendingText="Saving…">
          <BadgeCheck size={16} aria-hidden="true" /> Approve and complete
        </SubmitButton>
        <SubmitButton name="decision" value="changes" variant="secondary" pendingText="Saving…">
          Ask for changes
        </SubmitButton>
      </FormActions>
    </form>
  )
}

/** Takes the request back, so answers can change. */
export const WithdrawSignoffForm = ({ action }: { action: Action }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <Feedback state={state} />
      <FormActions>
        <SubmitButton variant="secondary" pendingText="Withdrawing…">
          <Undo2 size={16} aria-hidden="true" /> Withdraw the request
        </SubmitButton>
      </FormActions>
    </form>
  )
}
