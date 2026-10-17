'use client'

import { buttonClass, FormActions, SelectField, TextAreaField, TextField } from '@duatf/core-ui'
import type { FormState } from '@/lib/formState'
import { useSubmit } from '@/lib/useSubmit'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

type FlagQuestion = {
  name: string
  type: 'bool' | 'enum'
  options: string[]
  question: string
  value: boolean | string
  /** Where the current answer comes from, such as "From the RoPA: 2 activities transfer data abroad". */
  source: string
}

/** The library's applicability questions, each with its current answer and where it came from. */
export const ApplicabilityForm = ({
  action,
  questions,
}: {
  action: Action
  questions: FlagQuestion[]
}) => {
  // Kept after saving, so each select shows the answer that was saved.
  const { state, onSubmit, pending } = useSubmit(action)
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.questionList}>
        {questions.map((question) => (
          <div key={question.name} className={styles.question}>
            <SelectField
              label={question.question}
              name={`flag_${question.name}`}
              options={
                question.type === 'bool'
                  ? [
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]
                  : question.options.map((option) => ({
                      value: option,
                      label: option.replace(/-/g, ' '),
                    }))
              }
              defaultValue={state.values?.[`flag_${question.name}`] ?? String(question.value)}
              error={state.fieldErrors?.[`flag_${question.name}`]}
              hint={`${question.name}. ${question.source}`}
            />
          </div>
        ))}
      </div>
      <FormActions>
        <button type="submit" className={buttonClass()} disabled={pending} aria-busy={pending}>
          {pending ? 'Saving…' : 'Save the answers'}
        </button>
      </FormActions>
    </form>
  )
}

type Field = {
  name: string
  type: string
  description: string
  value: string
  source: string
  required: boolean
}

const inputType = (type: string) =>
  type === 'email'
    ? 'email'
    : type === 'url'
      ? 'url'
      : type === 'date'
        ? 'date'
        : type === 'phone'
          ? 'tel'
          : 'text'

/** The common details of one group: each value is entered once and used in every document. */
export const ValuesForm = ({ action, fields }: { action: Action; fields: Field[] }) => {
  const { state, onSubmit, pending } = useSubmit(action)
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        {fields.map((field) =>
          field.type === 'longtext' || field.type === 'address' || field.type === 'list' ? (
            <TextAreaField
              key={field.name}
              label={field.description}
              name={`value_${field.name}`}
              rows={2}
              defaultValue={state.values?.[`value_${field.name}`] ?? field.value}
              error={state.fieldErrors?.[`value_${field.name}`]}
              hint={`[${field.name}]${field.source ? `. ${field.source}` : ''}`}
            />
          ) : (
            <TextField
              key={field.name}
              label={field.description}
              name={`value_${field.name}`}
              type={inputType(field.type)}
              defaultValue={state.values?.[`value_${field.name}`] ?? field.value}
              error={state.fieldErrors?.[`value_${field.name}`]}
              hint={`[${field.name}]${field.source ? `. ${field.source}` : ''}`}
            />
          ),
        )}
      </div>
      <FormActions>
        <button
          type="submit"
          className={buttonClass('secondary')}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Saving…' : 'Save these details'}
        </button>
      </FormActions>
    </form>
  )
}

/**
 * One of the library's tables as tab-separated text, the way it pastes from Excel: the first line
 * is the columns, one line per row.
 */
export const CollectionForm = ({
  action,
  clear,
  name,
  fields,
  rows,
  saved,
}: {
  action: Action
  clear: Action
  name: string
  fields: string[]
  rows: Record<string, string>[]
  saved: boolean
}) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const reset = useSubmit(clear)
  const initial = [
    fields.join('\t'),
    ...rows.map((row) =>
      fields.map((field) => (row[field] ?? '').replace(/\s*\n\s*/g, ' ')).join('\t'),
    ),
  ].join('\n')
  // Named by the table, so several editors on one page keep distinct ids.
  const field = `rows_${name}`
  return (
    <div className={styles.stacked}>
      <form onSubmit={onSubmit} className={styles.form} noValidate>
        <Feedback state={state} />
        <input type="hidden" name="collection" value={name} />
        <TextAreaField
          label={`${name}: columns on the first line, one row per line, separated by tabs`}
          name={field}
          rows={Math.min(Math.max(rows.length + 2, 4), 14)}
          defaultValue={state.values?.[field] ?? initial}
          error={state.fieldErrors?.[`collection_${name}`]}
          hint="Paste from Excel or edit here. The columns must be the library’s."
        />
        <FormActions>
          <button
            type="submit"
            className={buttonClass('secondary')}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'Saving…' : 'Save this table'}
          </button>
        </FormActions>
      </form>
      {saved ? (
        <form onSubmit={reset.onSubmit} className={styles.form} noValidate>
          <Feedback state={reset.state} />
          <input type="hidden" name="collection" value={name} />
          <FormActions>
            <button type="submit" className={buttonClass('ghost', 'sm')} disabled={reset.pending}>
              Use DUATF’s records for this table again
            </button>
          </FormActions>
        </form>
      ) : null}
    </div>
  )
}

/** The consultant's statutory checklist of one document: tick each item, then sign it off. */
export const ChecklistForm = ({
  action,
  groups,
  ticked,
}: {
  action: Action
  groups: { title: string; items: string[] }[]
  ticked: string[]
}) => {
  const { state, onSubmit, pending } = useSubmit(action)
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      {groups.map((group) => (
        <fieldset key={group.title} className={styles.checkGroup}>
          <legend>{group.title}</legend>
          {group.items.map((item) => (
            <label key={item} className={styles.checkRow}>
              <input
                type="checkbox"
                name="items"
                value={item}
                defaultChecked={ticked.includes(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {state.fieldErrors?.items ? (
        <p className={styles.fieldError}>{state.fieldErrors.items}</p>
      ) : null}
      <FormActions>
        <button
          type="submit"
          name="intent"
          value="save"
          className={buttonClass('secondary')}
          disabled={pending}
        >
          Save the checklist
        </button>
        <button
          type="submit"
          name="intent"
          value="sign"
          className={buttonClass()}
          disabled={pending}
        >
          Sign it off
        </button>
      </FormActions>
    </form>
  )
}
