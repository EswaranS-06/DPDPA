'use client'

import {
  FormActions,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  type SelectOption,
} from '@duatf/core-ui'
import { useActionState, useState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'
import answerStyles from './AssessmentForms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** One person picker with a save button: question assignee, control owner. */
export const OwnerSelectForm = ({
  action,
  hidden = {},
  name,
  label,
  options,
  current,
  placeholder = 'No one',
}: {
  action: Action
  hidden?: Record<string, string>
  name: string
  label: string
  options: SelectOption[]
  current: string | null
  /** The empty choice; null when a value is required. */
  placeholder?: string | null
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  // Controlled, so the choice stays shown after saving (React resets uncontrolled fields).
  const [chosen, setChosen] = useState(current ?? '')
  // A new value from the server (saved here or elsewhere) replaces the shown choice.
  const [shown, setShown] = useState(current)
  if (shown !== current) {
    setShown(current)
    setChosen(current ?? '')
  }
  return (
    <form action={formAction} className={styles.secret}>
      {Object.entries(hidden).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <span className={styles.rowActions}>
        <label className="visually-hidden" htmlFor={`${name}-${Object.values(hidden).join('-')}`}>
          {label}
        </label>
        <select
          id={`${name}-${Object.values(hidden).join('-')}`}
          name={name}
          value={chosen}
          onChange={(event) => setChosen(event.target.value)}
          className={styles.compactInput}
        >
          {placeholder === null ? null : <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.linkish}>
          Save
        </button>
      </span>
      {state.status === 'idle' ? null : <Feedback state={state} />}
    </form>
  )
}

/**
 * Asks someone for evidence for a question: tick the suggested items from the knowledge base or
 * write one, choose who provides it and by when.
 */
export const EvidenceRequestForm = ({
  action,
  suggestions,
  people,
}: {
  action: Action
  suggestions: string[]
  people: SelectOption[]
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      {suggestions.length ? (
        <fieldset className={`${answerStyles.answers} ${answerStyles.list}`}>
          <legend className={answerStyles.legend}>Suggested by the knowledge base</legend>
          {suggestions.map((title) => (
            <label key={title} className={answerStyles.inlineCheck}>
              <input type="checkbox" name="titles" value={title} />
              {title}
            </label>
          ))}
        </fieldset>
      ) : null}
      <TextField
        label="Or name what you need"
        name="title"
        defaultValue={state.values?.title}
        error={error('title')}
        hint="e.g. Signed DPA with PayRight, 2026"
      />
      <div className={styles.inline}>
        <SelectField
          label="From"
          name="assigneeUserId"
          placeholder="Anyone"
          options={people}
          defaultValue={state.values?.assigneeUserId}
          error={error('assigneeUserId')}
        />
        <TextField
          label="Needed by"
          name="dueDate"
          type="date"
          defaultValue={state.values?.dueDate}
          error={error('dueDate')}
        />
      </div>
      <TextAreaField
        label="Note"
        name="note"
        rows={2}
        defaultValue={state.values?.note}
        error={error('note')}
      />
      <FormActions>
        <SubmitButton variant="secondary" pendingText="Requesting…">
          Request evidence
        </SubmitButton>
      </FormActions>
    </form>
  )
}

/** Gives all questions of a department (or only the unassigned ones) to one person. */
export const BulkAssignForm = ({ action, people }: { action: Action; people: SelectOption[] }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <SelectField
          label="Give the questions to"
          name="assigneeUserId"
          placeholder="No one (take them back)"
          options={people}
          error={state.fieldErrors?.assigneeUserId}
        />
      </div>
      <label className={answerStyles.inlineCheck}>
        <input type="checkbox" name="onlyUnassigned" defaultChecked />
        Only questions not given to anyone yet
      </label>
      <FormActions>
        <SubmitButton variant="secondary" pendingText="Assigning…">
          Assign questions
        </SubmitButton>
      </FormActions>
    </form>
  )
}
