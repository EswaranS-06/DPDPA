'use client'

import type { PickerQuestionnaire } from '@duatf/feature-compliance-api'
import type { ProcessHint } from '@duatf/feature-compliance-api/personal-data'
import { buttonClass, FormActions, TextAreaField, TextField } from '@duatf/core-ui'
import { useState } from 'react'
import type { PickerElement } from '@/components/data/ElementPicker'
import { PersonalDataStep } from '@/components/data/PersonalDataStep'
import type { FormState } from '@/lib/formState'
import { useSubmit } from '@/lib/useSubmit'
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
 * A department, the personal data it handles (new departments) and the questions it answers.
 * New departments choose their code; existing ones keep it. Everything is saved in one go.
 */
export const DepartmentForm = ({
  action,
  questionnaires,
  closed,
  defaults = {},
  editing = false,
  personalData,
}: {
  action: Action
  questionnaires: PickerQuestionnaire[]
  closed?: string | null
  defaults?: DepartmentDefaults
  editing?: boolean
  /** The data elements and process hints the personal data question suggests from. */
  personalData?: { elements: PickerElement[]; processes: ProcessHint[] }
}) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const value = (name: keyof DepartmentDefaults) =>
    state.status === 'error' ? (state.values?.[name] ?? '') : (defaults[name] ?? '')
  const error = (name: string) => state.fieldErrors?.[name]
  // The name and code drive the personal data suggestions as they are typed.
  const [typed, setTyped] = useState({ name: value('name') ?? '', code: value('code') ?? '' })
  return (
    <form
      onSubmit={onSubmit}
      className={styles.form}
      noValidate
      onInput={(event) => {
        const field = event.target
        if (field instanceof HTMLInputElement && (field.name === 'name' || field.name === 'code')) {
          setTyped((current) => ({ ...current, [field.name]: field.value }))
        }
      }}
    >
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
      {personalData ? (
        <PersonalDataStep
          name={typed.name}
          code={typed.code}
          elements={personalData.elements}
          processes={personalData.processes}
          initial={state.status === 'error' ? state.values?.personalData : undefined}
        />
      ) : null}
      {error('form') ? <p className={styles.fieldError}>{error('form')}</p> : null}
      <QuestionPicker questionnaires={questionnaires} disabled={closed} />
      {error('questions') ? <p className={styles.fieldError}>{error('questions')}</p> : null}
      <FormActions>
        <button
          type="submit"
          className={buttonClass('primary')}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Saving…' : editing ? 'Save department and questions' : 'Add department'}
        </button>
      </FormActions>
    </form>
  )
}
