'use client'

import { FormActions, SubmitButton, TextAreaField, TextField } from '@duatf/core-ui'
import type { AnswerOption, AnswerType, ItemResponse } from '@duatf/platform-db'
import { BadgeCheck, CircleAlert, CircleCheck, CircleX, Info, Minus, Undo2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
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

const TONE = {
  compliant: { icon: CircleCheck, tone: 'yes' },
  potential_gap: { icon: CircleAlert, tone: 'partial' },
  gap: { icon: CircleX, tone: 'no' },
  informational: { icon: Info, tone: 'na' },
} as const

const NOT_APPLICABLE = 'not_applicable'

type Current = {
  answer: string
  response: ItemResponse | null
  naReason: string | null
  comment: string | null
}

type AnswerFormProps = {
  action: Action
  shape: { answerType: AnswerType; options: AnswerOption[] }
  current: Current
  disabled?: string
  /**
   * From the question's gates: ruled out (only Not applicable can be chosen) or applies (Not
   * applicable cannot be chosen). The server enforces the same.
   */
  gate?: 'ruled_out' | 'applies'
}

const chosenValues = (response: ItemResponse | null) =>
  response && 'values' in response ? response.values : []

/** One option card: a radio (single answers) or a checkbox (several choices). */
const OptionCard = ({
  option,
  name,
  type,
  checked,
  onChange,
  disabled = false,
}: {
  option: AnswerOption
  name: string
  type: 'radio' | 'checkbox'
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) => {
  const { icon: Icon, tone } = TONE[option.outcome]
  return (
    <label
      className={checked ? `${answerStyles.option} ${answerStyles.chosen}` : answerStyles.option}
    >
      <input
        type={type}
        name={name}
        value={option.value}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={answerStyles.optionLabel}>
        <Icon className={answerStyles[tone]} size={16} strokeWidth={2.25} aria-hidden="true" />
        {option.label}
      </span>
      {option.hint ? <span className={answerStyles.optionNote}>{option.hint}</span> : null}
    </label>
  )
}

/**
 * Answers a question the way its template asks: Yes, Partial or No; a maturity level from 0
 * to 4; one or several of the listed choices; or free text. Not applicable needs a reason.
 */
export const AnswerForm = ({ action, shape, current, disabled, gate }: AnswerFormProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  const answered = current.answer !== 'not_assessed'
  const [single, setSingle] = useState(
    current.answer === NOT_APPLICABLE ? NOT_APPLICABLE : (chosenValues(current.response)[0] ?? ''),
  )
  const [several, setSeveral] = useState<string[]>(chosenValues(current.response))
  const [notApplicable, setNotApplicable] = useState(current.answer === NOT_APPLICABLE)
  const error = (name: string) => state.fieldErrors?.[name]
  const singleChoice = shape.answerType !== 'multi_choice' && shape.answerType !== 'text'
  const na = singleChoice ? single === NOT_APPLICABLE : notApplicable
  const columns =
    shape.answerType === 'yes_no'
      ? answerStyles.answers
      : `${answerStyles.answers} ${answerStyles.list}`

  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <fieldset
        className={columns}
        disabled={Boolean(disabled)}
        aria-describedby={error('answer') ? 'answer-error' : undefined}
      >
        <legend className={answerStyles.legend}>
          {shape.answerType === 'maturity'
            ? 'Maturity level'
            : shape.answerType === 'multi_choice'
              ? 'Tick every one that applies'
              : 'Answer'}
        </legend>
        {singleChoice ? (
          <>
            {shape.options.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                name="answer"
                type="radio"
                checked={single === option.value}
                disabled={gate === 'ruled_out'}
                onChange={() => setSingle(option.value)}
              />
            ))}
            <label
              className={na ? `${answerStyles.option} ${answerStyles.chosen}` : answerStyles.option}
            >
              <input
                type="radio"
                name="answer"
                value={NOT_APPLICABLE}
                checked={na}
                disabled={gate === 'applies'}
                onChange={() => setSingle(NOT_APPLICABLE)}
              />
              <span className={answerStyles.optionLabel}>
                <Minus
                  className={answerStyles.na}
                  size={16}
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                Not applicable
              </span>
              <span className={answerStyles.optionNote}>Give the reason.</span>
            </label>
          </>
        ) : null}
        {shape.answerType === 'multi_choice'
          ? shape.options.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                name="choices"
                type="checkbox"
                checked={!na && several.includes(option.value)}
                disabled={gate === 'ruled_out'}
                onChange={(on) =>
                  setSeveral((list) =>
                    on ? [...list, option.value] : list.filter((value) => value !== option.value),
                  )
                }
              />
            ))
          : null}
      </fieldset>
      {shape.answerType === 'text' ? (
        <TextAreaField
          label="Answer"
          name="text"
          rows={4}
          defaultValue={current.response && 'text' in current.response ? current.response.text : ''}
          error={error('answer')}
        />
      ) : null}
      {!singleChoice ? (
        <label className={answerStyles.inlineCheck}>
          <input
            type="checkbox"
            name="answer"
            value={NOT_APPLICABLE}
            checked={notApplicable}
            disabled={Boolean(disabled) || gate === 'applies'}
            onChange={(event) => setNotApplicable(event.target.checked)}
          />
          Not applicable to this department
        </label>
      ) : null}
      {error('answer') && shape.answerType !== 'text' ? (
        <p id="answer-error" className={answerStyles.error}>
          {error('answer')}
        </p>
      ) : null}
      {na ? (
        <TextAreaField
          label="Why it does not apply"
          name="naReason"
          required
          rows={3}
          defaultValue={state.values?.naReason ?? current.naReason}
          error={error('naReason')}
        />
      ) : null}
      <TextAreaField
        label="Notes"
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
          <SubmitButton pendingText="Saving…">
            {answered ? 'Update answer' : 'Save answer'}
          </SubmitButton>
        </FormActions>
      )}
    </form>
  )
}

/** Ticks one answer as checked, or takes the tick away. */
export const CheckForm = ({ action, checked }: { action: Action; checked: boolean }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <Feedback state={state} />
      <input type="hidden" name="checked" value={checked ? 'false' : 'true'} />
      <FormActions>
        <SubmitButton variant={checked ? 'secondary' : 'primary'} pendingText="Saving…">
          {checked ? (
            <>
              <Undo2 size={16} aria-hidden="true" /> Remove the tick
            </>
          ) : (
            <>
              <BadgeCheck size={16} aria-hidden="true" /> Tick as checked
            </>
          )}
        </SubmitButton>
      </FormActions>
    </form>
  )
}

/** Ticks every answered, unchecked question of a department (or a whole cycle). */
export const CheckAllForm = ({ action, count }: { action: Action; count: number }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <Feedback state={state} />
      <FormActions>
        <SubmitButton variant="secondary" pendingText="Ticking…">
          <BadgeCheck size={16} aria-hidden="true" /> Tick all {count} as checked
        </SubmitButton>
      </FormActions>
    </form>
  )
}

/** Moves the open cycle to the newest question bank, once. */
export const MoveReleaseForm = ({ action, version }: { action: Action; version: string }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <Feedback state={state} />
      {state.status === 'success' ? null : (
        <FormActions>
          <SubmitButton pendingText="Moving…">Use release {version}</SubmitButton>
        </FormActions>
      )}
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
