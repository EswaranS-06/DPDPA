'use client'

import type { PickerQuestionnaire } from '@duatf/feature-compliance-api'
import { FormActions, SubmitButton, TextAreaField, TextField } from '@duatf/core-ui'
import { useActionState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import { QuestionPicker } from './QuestionPicker'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

type DepartmentDefaults = {
  code?: string
  name?: string
  headName?: string | null
  headEmail?: string | null
  description?: string | null
}

/**
 * A department and the questions it answers. New departments choose their code; existing ones
 * keep it. The question list is saved with the details, in one go.
 */
export const DepartmentForm = ({
  action,
  questionnaires,
  closed,
  defaults = {},
  editing = false,
}: {
  action: Action
  questionnaires: PickerQuestionnaire[]
  closed?: string | null
  defaults?: DepartmentDefaults
  editing?: boolean
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  const value = (name: keyof DepartmentDefaults) =>
    state.status === 'error' ? (state.values?.[name] ?? '') : (defaults[name] ?? '')
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        {editing ? null : (
          <TextField
            label="Code"
            name="code"
            required
            maxLength={10}
            defaultValue={value('code')}
            error={error('code')}
            hint="2 to 10 capitals or digits, e.g. HR, FIN, IT, or VNDPAY for a vendor"
          />
        )}
        <TextField
          label="Department or vendor name"
          name="name"
          required
          defaultValue={value('name')}
          error={error('name')}
        />
        <TextField
          label="Head or contact person"
          name="headName"
          defaultValue={value('headName')}
          error={error('headName')}
        />
        <TextField
          label="Their email"
          name="headEmail"
          type="email"
          defaultValue={value('headEmail')}
          error={error('headEmail')}
        />
      </div>
      <TextAreaField
        label="What it does with personal data"
        name="description"
        rows={2}
        defaultValue={value('description')}
        error={error('description')}
      />
      <QuestionPicker questionnaires={questionnaires} disabled={closed} />
      {error('questions') ? <p className={styles.fieldError}>{error('questions')}</p> : null}
      <FormActions>
        <SubmitButton pendingText="Saving…">
          {editing ? 'Save department and questions' : 'Add department'}
        </SubmitButton>
      </FormActions>
    </form>
  )
}
