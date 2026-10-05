'use client'

import {
  FormActions,
  FormAlert,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from '@duatf/core-ui'
import { useActionState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

const scale = (labels: string[]) =>
  labels.map((label, index) => ({ value: String(index + 1), label: `${index + 1} ${label}` }))
const LIKELIHOOD = scale(['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'])
const IMPACT = scale(['Minimal', 'Minor', 'Moderate', 'Major', 'Severe'])

type RiskFormProps = {
  action: Action
  current: {
    likelihood: number
    impact: number
    treatment: string
    status: string
    ownerName: string | null
    description: string | null
  }
}

export const RiskRatingForm = ({ action, current }: RiskFormProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  const value = (name: string, fallback: string) => state.values?.[name] ?? fallback
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <SelectField
          label="Likelihood"
          name="likelihood"
          options={LIKELIHOOD}
          defaultValue={value('likelihood', String(current.likelihood))}
          error={error('likelihood')}
        />
        <SelectField
          label="Impact"
          name="impact"
          options={IMPACT}
          defaultValue={value('impact', String(current.impact))}
          error={error('impact')}
        />
        <SelectField
          label="Treatment"
          name="treatment"
          options={[
            { value: 'mitigate', label: 'Mitigate' },
            { value: 'transfer', label: 'Transfer' },
            { value: 'avoid', label: 'Avoid' },
          ]}
          defaultValue={value(
            'treatment',
            current.treatment === 'accept' ? 'mitigate' : current.treatment,
          )}
          error={error('treatment')}
        />
        <SelectField
          label="Status"
          name="status"
          options={[
            { value: 'open', label: 'Open' },
            { value: 'treated', label: 'Treated' },
            { value: 'closed', label: 'Closed' },
          ]}
          defaultValue={value('status', current.status === 'accepted' ? 'open' : current.status)}
          error={error('status')}
        />
        <TextField
          label="Risk owner"
          name="ownerName"
          defaultValue={value('ownerName', current.ownerName ?? '')}
          error={error('ownerName')}
        />
      </div>
      <TextAreaField
        label="Risk description"
        name="description"
        rows={2}
        defaultValue={value('description', current.description ?? '')}
        error={error('description')}
        hint="What could happen to data principals or the organisation if the gap stays open."
      />
      <FormActions>
        <SubmitButton pendingText="Saving…">Save rating</SubmitButton>
      </FormActions>
    </form>
  )
}

export const AcceptRiskForm = ({ action }: { action: Action }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="Why the organisation accepts this risk"
        name="note"
        required
        rows={3}
        defaultValue={state.values?.note}
        error={state.fieldErrors?.note}
        hint="Recorded with your name and the date. Accepted risks stay in the register and in reports."
      />
      <FormActions>
        <SubmitButton variant="danger" pendingText="Recording…">
          Accept the risk
        </SubmitButton>
      </FormActions>
    </form>
  )
}

type BandRow = { name: string; minScore: number; maxScore: number; tone: string }

const TONES = [
  { value: 'live', label: 'Green' },
  { value: 'accent', label: 'Violet' },
  { value: 'pending', label: 'Amber' },
  { value: 'severe', label: 'Red' },
  { value: 'neutral', label: 'Grey' },
]

export const RiskBandsForm = ({ action, bands }: { action: Action; bands: BandRow[] }) => {
  const [state, formAction] = useActionState(action, IDLE)
  const rows = Array.from({ length: 6 }, (_, index) => bands[index] ?? null)
  const value = (name: string, fallback: string) => state.values?.[name] ?? fallback
  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.status === 'error' ? (
        <FormAlert>{state.fieldErrors?.bands ?? state.message}</FormAlert>
      ) : (
        <Feedback state={state} />
      )}
      {rows.map((row, index) => (
        <div key={index} className={styles.inline}>
          <TextField
            label={`Band ${index + 1}`}
            name={`name_${index}`}
            defaultValue={value(`name_${index}`, row?.name ?? '')}
            placeholder={index >= bands.length ? 'Unused' : undefined}
          />
          <TextField
            label="From score"
            name={`min_${index}`}
            type="number"
            min={1}
            defaultValue={value(`min_${index}`, row ? String(row.minScore) : '')}
          />
          <TextField
            label="To score"
            name={`max_${index}`}
            type="number"
            min={1}
            defaultValue={value(`max_${index}`, row ? String(row.maxScore) : '')}
          />
          <SelectField
            label="Colour"
            name={`tone_${index}`}
            options={TONES}
            defaultValue={value(`tone_${index}`, row?.tone ?? 'neutral')}
          />
        </div>
      ))}
      <FormActions>
        <SubmitButton pendingText="Saving…">Save bands</SubmitButton>
      </FormActions>
    </form>
  )
}
