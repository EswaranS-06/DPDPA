'use client'

import {
  CheckboxGroup,
  Fieldset,
  FormActions,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  buttonClass,
} from '@duatf/core-ui'
import type { EntryField, EntryForm } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { useActionState, type MouseEvent } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'
import kb from './KbForms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

const confirmFirst = (message: string) => (event: MouseEvent<HTMLButtonElement>) => {
  if (!window.confirm(message)) event.preventDefault()
}

export const StartDraftForm = ({
  action,
  defaultVersion,
}: {
  action: Action
  defaultVersion: string
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Version"
          name="version"
          required
          maxLength={12}
          defaultValue={state.values?.version ?? defaultVersion}
          error={state.fieldErrors?.version}
          hint="Raise the middle number for added or changed entries, e.g. 1.2.0."
        />
      </div>
      <TextAreaField
        label="What this release is for"
        name="notes"
        rows={2}
        defaultValue={state.values?.notes}
        error={state.fieldErrors?.notes}
        hint="Kept with the release, e.g. new healthcare processes and notice languages."
      />
      <FormActions>
        <SubmitButton pendingText="Starting…">Start the draft</SubmitButton>
      </FormActions>
    </form>
  )
}

export const PublishForm = ({
  action,
  version,
  awaitingReview,
}: {
  action: Action
  version: string
  awaitingReview: number
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  const acknowledgeError = state.fieldErrors?.acknowledge
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="Release notes"
        name="notes"
        rows={3}
        defaultValue={state.values?.notes}
        error={state.fieldErrors?.notes}
        hint="Added to the notes given when the draft was started."
      />
      {awaitingReview > 0 ? (
        <div className={kb.acknowledge}>
          <label className={kb.check}>
            <input
              type="checkbox"
              name="acknowledge"
              aria-invalid={acknowledgeError ? true : undefined}
              aria-describedby={acknowledgeError ? 'acknowledge-error' : undefined}
            />
            <span>
              Publish the {awaitingReview} {awaitingReview === 1 ? 'entry' : 'entries'} still
              awaiting legal review. They keep the label until a later release marks them reviewed.
            </span>
          </label>
          {acknowledgeError ? (
            <p id="acknowledge-error" className={kb.error}>
              {acknowledgeError}
            </p>
          ) : null}
        </div>
      ) : null}
      <FormActions>
        <SubmitButton pendingText="Publishing…">Publish release {version}</SubmitButton>
      </FormActions>
    </form>
  )
}

export const DiscardDraftForm = ({ action, version }: { action: Action; version: string }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <Feedback state={state} />
      <div>
        <button
          type="submit"
          className={buttonClass('danger')}
          onClick={confirmFirst(
            `Discard draft ${version}? Every change in it is lost, and this cannot be undone.`,
          )}
        >
          Discard draft {version}
        </button>
      </div>
    </form>
  )
}

export const MarkReviewedForm = ({
  action,
  withNote = false,
}: {
  action: Action
  withNote?: boolean
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      {withNote ? (
        <TextAreaField
          label="Review note"
          name="note"
          rows={2}
          defaultValue={state.values?.note}
          error={state.fieldErrors?.note}
          hint="Optional: what was checked, against which text."
        />
      ) : null}
      <div>
        <SubmitButton
          variant={withNote ? 'primary' : 'secondary'}
          size={withNote ? 'md' : 'sm'}
          pendingText="Saving…"
        >
          Mark as reviewed
        </SubmitButton>
      </div>
    </form>
  )
}

export const RemoveEntryForm = ({ action, label }: { action: Action; label: string }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <Feedback state={state} />
      <div>
        <button
          type="submit"
          className={buttonClass('danger')}
          onClick={confirmFirst(`Remove ${label} from the draft?`)}
        >
          Remove from the draft
        </button>
      </div>
    </form>
  )
}

/** Form values arrive as text; checkbox groups are stored one value per line. */
const listOf = (value: string | string[] | undefined): string[] =>
  Array.isArray(value) ? value : value ? value.split('\n').filter(Boolean) : []
const textOf = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value.join('\n') : (value ?? '')

const Field = ({
  field,
  value,
  error,
}: {
  field: EntryField
  value: string | string[] | undefined
  error?: string
}) => {
  if (field.readOnly) {
    return (
      <div className={kb.readOnly}>
        <span className={kb.readOnlyLabel}>{field.label}</span>
        <span className="code">{textOf(value)}</span>
        {field.hint ? <span className={kb.readOnlyHint}>{field.hint}</span> : null}
      </div>
    )
  }
  switch (field.kind) {
    case 'select':
      return (
        <SelectField
          label={field.label}
          name={field.name}
          required={field.required}
          options={field.options ?? []}
          placeholder={field.placeholder ?? (field.required ? undefined : 'None')}
          defaultValue={textOf(value)}
          error={error}
          hint={field.hint}
          wide={field.wide}
        />
      )
    case 'checkboxes':
      return (
        <CheckboxGroup
          legend={field.label}
          name={field.name}
          options={field.options ?? []}
          defaultValue={listOf(value)}
          error={error}
          hint={field.hint}
          wide={field.wide}
        />
      )
    case 'textarea':
    case 'lines':
    case 'markdown':
      return (
        <TextAreaField
          label={field.label}
          name={field.name}
          required={field.required}
          rows={field.rows ?? 4}
          defaultValue={textOf(value)}
          error={error}
          hint={field.hint}
          wide={field.wide}
        />
      )
    default:
      return (
        <TextField
          label={field.label}
          name={field.name}
          required={field.required}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          defaultValue={textOf(value)}
          error={error}
          hint={field.hint}
          wide={field.wide}
        />
      )
  }
}

/** Add or edit form for any editable section, built from the section's field list. */
export const EntryEditor = ({
  form,
  action,
  cancelHref,
}: {
  form: EntryForm
  action: Action
  cancelHref: string
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  // After an error or a suggestion the submitted values win, including emptied checkbox groups.
  const values = state.values ?? form.values
  return (
    <form action={formAction} className={`${styles.form} ${kb.editor}`} noValidate>
      <Feedback state={state} />
      {form.groups.map((group) => (
        <Fieldset key={group.legend} legend={group.legend} note={group.note}>
          {group.fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              value={values[field.name]}
              error={state.fieldErrors?.[field.name]}
            />
          ))}
        </Fieldset>
      ))}
      <FormActions>
        <SubmitButton pendingText="Saving…">
          {form.mode === 'create' ? 'Add to the draft' : 'Save changes'}
        </SubmitButton>
        {form.suggestsObligations ? (
          <SubmitButton name="intent" value="suggest" variant="secondary" pendingText="Working…">
            Suggest obligations
          </SubmitButton>
        ) : null}
        <Link href={cancelHref} className={buttonClass('ghost')}>
          Cancel
        </Link>
      </FormActions>
    </form>
  )
}
