'use client'

import {
  FormActions,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  type SelectOption,
} from '@duatf/core-ui'
import { useActionState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

type PlanFormProps = {
  action: Action
  owners: SelectOption[]
  departments: SelectOption[]
  initial: Record<string, string>
  submitLabel: string
}

/** Title, owner, department and due date of a remediation action. */
export const ActionPlanForm = ({
  action,
  owners,
  departments,
  initial,
  submitLabel,
}: PlanFormProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  const value = (name: string) => state.values?.[name] ?? initial[name] ?? ''
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextField
        label="Action"
        name="title"
        required
        wide
        defaultValue={value('title')}
        error={error('title')}
      />
      <div className={styles.inline}>
        <SelectField
          label="Owner"
          name="ownerUserId"
          placeholder="Not assigned yet"
          options={owners}
          defaultValue={value('ownerUserId')}
          error={error('ownerUserId')}
          hint="Add people such as IT Head under People."
        />
        <SelectField
          label="Department"
          name="departmentId"
          placeholder="None"
          options={departments}
          defaultValue={value('departmentId')}
          error={error('departmentId')}
        />
        <TextField
          label="Due"
          name="dueDate"
          type="date"
          defaultValue={value('dueDate')}
          error={error('dueDate')}
        />
      </div>
      <TextAreaField
        label="What needs to be done"
        name="description"
        rows={4}
        defaultValue={value('description')}
        error={error('description')}
      />
      <FormActions>
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </FormActions>
    </form>
  )
}

type StepsProps = { action: Action; steps: { to: string; label: string }[] }

/** The next workflow steps this user may take, with an optional note (required to reject). */
export const ActionSteps = ({ action, steps }: StepsProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  if (steps.length === 0) return null
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="Note"
        name="note"
        rows={2}
        defaultValue={state.values?.note}
        error={state.fieldErrors?.note}
        hint="Recorded in the history. Required when rejecting."
      />
      <FormActions>
        {steps.map((step, index) => (
          <SubmitButton
            key={step.to}
            name="to"
            value={step.to}
            variant={step.to === 'rejected' ? 'danger' : index === 0 ? 'primary' : 'secondary'}
            pendingText="Updating…"
          >
            {step.label}
          </SubmitButton>
        ))}
      </FormActions>
    </form>
  )
}

export const ReassessForm = ({
  action,
  defaultTitle,
}: {
  action: Action
  defaultTitle: string
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Title of the next cycle"
          name="title"
          required
          defaultValue={state.values?.title ?? defaultTitle}
          error={state.fieldErrors?.title}
        />
        <TextField
          label="Due"
          name="dueDate"
          type="date"
          defaultValue={state.values?.dueDate}
          error={state.fieldErrors?.dueDate}
        />
      </div>
      <FormActions>
        <SubmitButton pendingText="Starting…">Start next cycle</SubmitButton>
      </FormActions>
    </form>
  )
}
