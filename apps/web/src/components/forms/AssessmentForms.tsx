'use client'

import {
  FormActions,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  type SelectOption,
} from '@duatf/core-ui'
import { CircleAlert, CircleCheck, CircleX, Minus } from 'lucide-react'
import { useActionState, useState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './PeopleForms'
import styles from './forms.module.css'
import answerStyles from './AssessmentForms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

export const NewAssessmentForm = ({
  action,
  defaults,
}: {
  action: Action
  defaults: Record<string, string>
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  const value = (name: string) => state.values?.[name] ?? defaults[name] ?? ''
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Title"
          name="title"
          required
          defaultValue={value('title')}
          error={error('title')}
        />
        <TextField
          label="Period starts"
          name="periodStart"
          type="date"
          defaultValue={value('periodStart')}
          error={error('periodStart')}
        />
        <TextField
          label="Period ends"
          name="periodEnd"
          type="date"
          defaultValue={value('periodEnd')}
          error={error('periodEnd')}
        />
        <TextField
          label="Due"
          name="dueDate"
          type="date"
          defaultValue={value('dueDate')}
          error={error('dueDate')}
        />
      </div>
      <div>
        <SubmitButton pendingText="Creating…">Start assessment</SubmitButton>
      </div>
    </form>
  )
}

const ANSWERS = [
  { value: 'yes', label: 'Yes', note: 'In place, with evidence', icon: CircleCheck, tone: 'yes' },
  {
    value: 'partial',
    label: 'Partial',
    note: 'Partly in place',
    icon: CircleAlert,
    tone: 'partial',
  },
  { value: 'no', label: 'No', note: 'Not in place', icon: CircleX, tone: 'no' },
  {
    value: 'not_applicable',
    label: 'Not applicable',
    note: 'Give the reason',
    icon: Minus,
    tone: 'na',
  },
] as const

type AnswerFormProps = {
  action: Action
  current: { answer: string; naReason: string | null; comment: string | null }
  disabled?: string
}

export const AnswerForm = ({ action, current, disabled }: AnswerFormProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  const initial = state.values?.answer ?? (current.answer === 'not_assessed' ? '' : current.answer)
  const [answer, setAnswer] = useState(initial)
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <fieldset
        className={answerStyles.answers}
        disabled={Boolean(disabled)}
        aria-describedby={error('answer') ? 'answer-error' : undefined}
      >
        <legend className={answerStyles.legend}>Answer</legend>
        {ANSWERS.map((option) => (
          <label
            key={option.value}
            className={
              answer === option.value
                ? `${answerStyles.option} ${answerStyles.chosen}`
                : answerStyles.option
            }
          >
            <input
              type="radio"
              name="answer"
              value={option.value}
              checked={answer === option.value}
              onChange={() => setAnswer(option.value)}
            />
            <span className={answerStyles.optionLabel}>
              <option.icon
                className={answerStyles[option.tone]}
                size={16}
                strokeWidth={2.25}
                aria-hidden="true"
              />
              {option.label}
            </span>
            <span className={answerStyles.optionNote}>{option.note}</span>
          </label>
        ))}
      </fieldset>
      {error('answer') ? (
        <p id="answer-error" className={answerStyles.error}>
          {error('answer')}
        </p>
      ) : null}
      {answer === 'not_applicable' ? (
        <TextAreaField
          label="Why it does not apply"
          name="naReason"
          required
          rows={3}
          defaultValue={state.values?.naReason ?? current.naReason}
          error={error('naReason')}
          hint="Recorded with the answer and shown to the reviewer."
        />
      ) : null}
      <TextAreaField
        label="Notes for the reviewer"
        name="comment"
        rows={3}
        defaultValue={state.values?.comment ?? current.comment}
        error={error('comment')}
        hint="What is in place, where the evidence is, and anything still missing."
      />
      {disabled ? (
        <p className={styles.small}>{disabled}</p>
      ) : (
        <FormActions>
          <SubmitButton pendingText="Saving…">Save answer</SubmitButton>
        </FormActions>
      )}
    </form>
  )
}

export const ReviewForm = ({ action }: { action: Action }) => {
  const [state, formAction] = useActionState(action, IDLE)
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="Review note"
        name="note"
        rows={2}
        defaultValue={state.values?.note}
        error={error('note')}
        hint="Required when sending an answer back."
      />
      <FormActions>
        <SubmitButton name="decision" value="accepted" pendingText="Saving…">
          Accept
        </SubmitButton>
        <SubmitButton name="decision" value="returned" variant="secondary" pendingText="Saving…">
          Send back
        </SubmitButton>
      </FormActions>
    </form>
  )
}

type AssignFormProps = {
  action: Action
  departments: SelectOption[]
  domains?: SelectOption[]
  itemId?: string
  currentDepartmentId?: string | null
}

/** Assigns a whole domain (or one question when itemId is given) to a department. */
export const AssignForm = ({
  action,
  departments,
  domains,
  itemId,
  currentDepartmentId,
}: AssignFormProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        {itemId ? <input type="hidden" name="itemIds" value={itemId} /> : null}
        {domains ? (
          <SelectField
            label="Domain"
            name="domainCode"
            required
            placeholder="Choose…"
            options={domains}
            error={error('domainCode')}
          />
        ) : null}
        <SelectField
          label="Department"
          name="departmentId"
          placeholder="Not assigned"
          options={departments}
          defaultValue={currentDepartmentId ?? ''}
          error={error('departmentId')}
        />
      </div>
      <div>
        <SubmitButton variant="secondary" pendingText="Assigning…">
          {itemId ? 'Assign question' : 'Assign domain'}
        </SubmitButton>
      </div>
    </form>
  )
}

export const StatusButtons = ({
  action,
  transitions,
}: {
  action: Action
  transitions: { to: string; label: string }[]
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  if (transitions.length === 0) return null
  return (
    <form action={formAction} className={styles.secret}>
      <FormActions>
        {transitions.map((transition, index) => (
          <SubmitButton
            key={transition.to}
            name="to"
            value={transition.to}
            variant={index === 0 ? 'primary' : 'secondary'}
            pendingText="Updating…"
          >
            {transition.label}
          </SubmitButton>
        ))}
      </FormActions>
      {state.status === 'error' ? <Feedback state={state} /> : null}
    </form>
  )
}
