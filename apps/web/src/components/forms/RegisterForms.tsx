'use client'

import {
  buttonClass,
  CheckboxGroup,
  FormActions,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  type CheckboxOption,
  type SelectOption,
} from '@duatf/core-ui'
import { useActionState, useState, type ReactNode } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { useSubmit } from '@/lib/useSubmit'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

const fieldsOf = (state: FormState, initial: Record<string, string>) => ({
  value: (name: string) => state.values?.[name] ?? initial[name] ?? '',
  error: (name: string) => state.fieldErrors?.[name],
})

/** One button that runs an action, with its result shown beside it. */
export const ActionButton = ({
  action,
  children,
  pendingText = 'Working…',
  variant = 'secondary',
}: {
  action: Action
  children: ReactNode
  pendingText?: string
  variant?: 'primary' | 'secondary' | 'danger'
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <Feedback state={state} />
      <FormActions>
        <SubmitButton variant={variant} pendingText={pendingText}>
          {children}
        </SubmitButton>
      </FormActions>
    </form>
  )
}

// --- Processors ---------------------------------------------------------------------------------

type ProcessorFormProps = {
  action: Action
  initial: Record<string, string>
  initialTerms: string[]
  terms: CheckboxOption[]
  evidence: SelectOption[]
  submitLabel: string
}

/** A register entry: who the processor is, its contract and when it was assessed. */
export const ProcessorForm = ({
  action,
  initial,
  initialTerms,
  terms,
  evidence,
  submitLabel,
}: ProcessorFormProps) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const { value, error } = fieldsOf(state, initial)
  const [contract, setContract] = useState(value('contract') || 'unknown')
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Processor"
          name="name"
          required
          defaultValue={value('name')}
          error={error('name')}
          hint="The vendor’s name as the contract gives it."
        />
        <SelectField
          label="Kind"
          name="kind"
          options={[
            { value: 'processor', label: 'Data Processor' },
            { value: 'sub_processor', label: 'Processor’s own processor' },
          ]}
          defaultValue={value('kind') || 'processor'}
          error={error('kind')}
        />
      </div>
      <TextAreaField
        label="Other spellings in the RoPA"
        name="aliases"
        rows={2}
        defaultValue={value('aliases')}
        error={error('aliases')}
        hint="One per line. An activity that names the processor by any of these is counted as its activity."
      />
      <TextField
        label="What it does for the client"
        name="service"
        defaultValue={value('service')}
        error={error('service')}
      />
      <div className={styles.inline}>
        <SelectField
          label="Where it processes the data"
          name="location"
          options={[
            { value: 'india', label: 'In India' },
            { value: 'outside', label: 'Outside India (s.16)' },
            { value: 'unknown', label: 'Not known yet' },
          ]}
          defaultValue={value('location') || 'unknown'}
          error={error('location')}
        />
        <TextField
          label="Countries or regions"
          name="countries"
          defaultValue={value('countries')}
          error={error('countries')}
        />
        <TextField
          label="Contact"
          name="contactName"
          defaultValue={value('contactName')}
          error={error('contactName')}
        />
        <TextField
          label="Contact email"
          name="contactEmail"
          type="email"
          defaultValue={value('contactEmail')}
          error={error('contactEmail')}
        />
      </div>
      <div className={styles.inline}>
        <SelectField
          label="Is there a contract? (s.8(2))"
          name="contract"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unknown', label: 'Not checked yet' },
          ]}
          defaultValue={contract}
          onChange={setContract}
          error={error('contract')}
        />
        {contract === 'yes' ? (
          <>
            <TextField
              label="Contract starts"
              name="contractStart"
              type="date"
              defaultValue={value('contractStart')}
              error={error('contractStart')}
            />
            <TextField
              label="Contract ends"
              name="contractEnd"
              type="date"
              defaultValue={value('contractEnd')}
              error={error('contractEnd')}
              hint="Leave empty for a contract with no end date."
            />
            <SelectField
              label="The contract, in evidence"
              name="contractEvidenceId"
              placeholder="Not uploaded"
              options={evidence}
              defaultValue={value('contractEvidenceId')}
              error={error('contractEvidenceId')}
            />
          </>
        ) : null}
      </div>
      {contract === 'yes' ? (
        <CheckboxGroup
          legend="What the contract covers"
          name="terms"
          options={terms}
          defaultValue={initialTerms}
          error={error('terms')}
          hint="Tick what the signed contract says. Only the security safeguards are named by the Rules as a contract provision (R6(1)(f)); the others let the client meet its own duties."
        />
      ) : null}
      <div className={styles.inline}>
        <SelectField
          label="Risk rating"
          name="rating"
          placeholder="Not rated"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          defaultValue={value('rating')}
          error={error('rating')}
        />
        <TextField
          label="Last assessed"
          name="lastAssessedOn"
          type="date"
          defaultValue={value('lastAssessedOn')}
          error={error('lastAssessedOn')}
        />
        <TextField
          label="Next review"
          name="nextReviewOn"
          type="date"
          defaultValue={value('nextReviewOn')}
          error={error('nextReviewOn')}
        />
        <SelectField
          label="Relationship"
          name="active"
          options={[
            { value: 'true', label: 'In use' },
            { value: 'false', label: 'No longer used' },
          ]}
          defaultValue={value('active') || 'true'}
        />
      </div>
      <TextAreaField
        label="Notes"
        name="notes"
        rows={2}
        defaultValue={value('notes')}
        error={error('notes')}
      />
      <FormActions>
        <button type="submit" className={buttonClass()} disabled={pending} aria-busy={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </FormActions>
    </form>
  )
}

// --- Breaches -----------------------------------------------------------------------------------

type BreachFormProps = {
  action: Action
  initial: Record<string, string>
  initialNatures: string[]
  initialActivities: string[]
  natures: CheckboxOption[]
  activities: CheckboxOption[]
  departments: SelectOption[]
  processors: SelectOption[]
  submitLabel: string
}

/** What happened, when the organisation became aware, and what each notice has to say. */
export const BreachForm = ({
  action,
  initial,
  initialNatures,
  initialActivities,
  natures,
  activities,
  departments,
  processors,
  submitLabel,
}: BreachFormProps) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const { value, error } = fieldsOf(state, initial)
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextField
        label="Title"
        name="title"
        required
        defaultValue={value('title')}
        error={error('title')}
      />
      <TextAreaField
        label="What happened"
        name="description"
        required
        rows={3}
        defaultValue={value('description')}
        error={error('description')}
        hint="The nature and extent of the breach, in plain words. This goes into every notice."
      />
      <div className={styles.inline}>
        <TextField
          label="When the organisation became aware (IST)"
          name="awareAt"
          type="datetime-local"
          required
          defaultValue={value('awareAt')}
          error={error('awareAt')}
          hint="The clocks run from this time."
        />
        <TextField
          label="When it occurred (IST)"
          name="occurredAt"
          type="datetime-local"
          defaultValue={value('occurredAt')}
          error={error('occurredAt')}
        />
        <TextField
          label="Where it occurred"
          name="place"
          defaultValue={value('place')}
          error={error('place')}
          hint="The system, site or processor."
        />
      </div>
      <CheckboxGroup
        legend="What happened to the personal data (s.2(u))"
        name="natures"
        options={natures}
        defaultValue={initialNatures}
        error={error('natures')}
      />
      <div className={styles.inline}>
        <SelectField
          label="Severity"
          name="severity"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]}
          defaultValue={value('severity') || 'medium'}
          error={error('severity')}
          hint="For triage only. Every breach is intimated, whatever its severity."
        />
        <SelectField
          label="A cyber incident?"
          name="cyberIncident"
          options={[
            { value: 'false', label: 'No' },
            { value: 'true', label: 'Yes: CERT-In within 6 hours' },
          ]}
          defaultValue={value('cyberIncident') || 'false'}
        />
        <TextField
          label="Data Principals affected (about)"
          name="affectedPrincipals"
          type="number"
          min={0}
          defaultValue={value('affectedPrincipals')}
          error={error('affectedPrincipals')}
        />
      </div>
      <TextField
        label="Personal data affected"
        name="dataAffected"
        defaultValue={value('dataAffected')}
        error={error('dataAffected')}
      />
      <div className={styles.inline}>
        <SelectField
          label="Department"
          name="departmentId"
          placeholder="None"
          options={departments}
          defaultValue={value('departmentId')}
          error={error('departmentId')}
        />
        <SelectField
          label="Processor it arose at"
          name="processorId"
          placeholder="None"
          options={processors}
          defaultValue={value('processorId')}
          error={error('processorId')}
        />
      </div>
      {activities.length ? (
        <CheckboxGroup
          legend="RoPA activities affected"
          name="activityRefs"
          options={activities}
          defaultValue={initialActivities}
          error={error('activityRefs')}
        />
      ) : null}
      <TextAreaField
        label="Likely consequences for the people affected"
        name="likelyImpact"
        rows={2}
        defaultValue={value('likelyImpact')}
        error={error('likelyImpact')}
      />
      <TextAreaField
        label="Measures taken and being taken to reduce the risk"
        name="measures"
        rows={2}
        defaultValue={value('measures')}
        error={error('measures')}
      />
      <TextAreaField
        label="What the people affected can do to protect themselves"
        name="safetySteps"
        rows={2}
        defaultValue={value('safetySteps')}
        error={error('safetySteps')}
      />
      <TextField
        label="Whom they can contact"
        name="contact"
        defaultValue={value('contact')}
        error={error('contact')}
        hint="The business contact of a person who can answer for the organisation."
      />
      <TextAreaField
        label="Events, circumstances and reasons leading to the breach"
        name="cause"
        rows={2}
        defaultValue={value('cause')}
        error={error('cause')}
      />
      <TextAreaField
        label="Findings about the person who caused it"
        name="personResponsible"
        rows={2}
        defaultValue={value('personResponsible')}
        error={error('personResponsible')}
      />
      <TextAreaField
        label="Remedial measures to prevent it happening again"
        name="remedial"
        rows={2}
        defaultValue={value('remedial')}
        error={error('remedial')}
      />
      <div className={styles.inline}>
        <TextField
          label="Reported by"
          name="reportedBy"
          defaultValue={value('reportedBy')}
          error={error('reportedBy')}
          hint="The person or team who raised it inside the organisation."
        />
        <TextField
          label="How it was reported"
          name="reportChannel"
          defaultValue={value('reportChannel')}
          error={error('reportChannel')}
          placeholder="Security alert, email to the DPO, call…"
        />
        <TextField
          label="Detected"
          name="detectedAt"
          type="datetime-local"
          defaultValue={value('detectedAt')}
          error={error('detectedAt')}
          hint="Indian Standard Time."
        />
      </div>
      <div className={styles.inline}>
        <TextField
          label="Records affected"
          name="recordsAffected"
          type="number"
          defaultValue={value('recordsAffected')}
          error={error('recordsAffected')}
        />
        <TextField
          label="Children among the Data Principals"
          name="childrenAffected"
          type="number"
          defaultValue={value('childrenAffected')}
          error={error('childrenAffected')}
        />
        <TextField
          label="Post-incident review held on"
          name="reviewOn"
          type="date"
          defaultValue={value('reviewOn')}
          error={error('reviewOn')}
        />
      </div>
      <TextAreaField
        label="Lessons from the review"
        name="lessons"
        rows={2}
        defaultValue={value('lessons')}
        error={error('lessons')}
      />
      <FormActions>
        <button type="submit" className={buttonClass()} disabled={pending} aria-busy={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </FormActions>
    </form>
  )
}

/** Records an intimation, the Board's longer period, containment or a note. */
export const BreachStepForm = ({
  action,
  steps,
  now,
}: {
  action: Action
  steps: SelectOption[]
  /** The current time as a datetime-local value, in IST. */
  now: string
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  const { value, error } = fieldsOf(state, { at: now })
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.stacked}>
        <SelectField
          label="What to record"
          name="step"
          required
          placeholder="Choose…"
          options={steps}
          defaultValue={value('step')}
          error={error('step')}
        />
        <TextField
          label="When (IST)"
          name="at"
          type="datetime-local"
          defaultValue={value('at')}
          error={error('at')}
          hint="For a longer period allowed by the Board, the new time limit."
        />
        <TextField
          label="Reference"
          name="reference"
          defaultValue={value('reference')}
          error={error('reference')}
          hint="The Board’s acknowledgement or case number."
        />
      </div>
      <TextAreaField
        label="Note"
        name="note"
        rows={2}
        defaultValue={value('note')}
        error={error('note')}
        hint="For the intimation to Data Principals, how they were told."
      />
      <FormActions>
        <SubmitButton pendingText="Recording…">Record</SubmitButton>
      </FormActions>
    </form>
  )
}

/** Closes a breach; a reason is needed while an intimation is outstanding. */
export const CloseBreachForm = ({
  action,
  outstanding,
}: {
  action: Action
  outstanding: string[]
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label={outstanding.length ? 'Why it is closed without them' : 'Closing note'}
        name="reason"
        rows={2}
        required={outstanding.length > 0}
        defaultValue={state.values?.reason}
        error={state.fieldErrors?.reason}
        hint={
          outstanding.length
            ? `Still to be done: ${outstanding.join('; ')}.`
            : 'Every intimation is recorded.'
        }
      />
      <FormActions>
        <SubmitButton variant="secondary" pendingText="Closing…">
          Close the breach
        </SubmitButton>
      </FormActions>
    </form>
  )
}

// --- Rights requests ----------------------------------------------------------------------------

type RightsFormProps = {
  action: Action
  initial: Record<string, string>
  kinds: SelectOption[]
  departments: SelectOption[]
  responseDays: number
  submitLabel: string
}

/** A request from a Data Principal, recorded by the client's own reference. */
export const RightsRequestForm = ({
  action,
  initial,
  kinds,
  departments,
  responseDays,
  submitLabel,
}: RightsFormProps) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const { value, error } = fieldsOf(state, initial)
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <SelectField
          label="Kind of request"
          name="kind"
          required
          placeholder="Choose…"
          options={kinds}
          defaultValue={value('kind')}
          error={error('kind')}
        />
        <TextField
          label="Received on"
          name="receivedOn"
          type="date"
          required
          defaultValue={value('receivedOn')}
          error={error('receivedOn')}
        />
        <TextField
          label="Due on"
          name="dueOn"
          type="date"
          defaultValue={value('dueOn')}
          error={error('dueOn')}
          hint={`Leave empty for ${responseDays} days from receipt, the client’s response period.`}
        />
      </div>
      <div className={styles.inline}>
        <TextField
          label="Requester reference"
          name="requesterRef"
          required
          defaultValue={value('requesterRef')}
          error={error('requesterRef')}
          hint="The client’s ticket or customer number. Do not enter the person’s name unless it is needed."
        />
        <TextField
          label="Kind of Data Principal"
          name="principalType"
          defaultValue={value('principalType')}
          error={error('principalType')}
          placeholder="Customer, employee, patient…"
        />
        <TextField
          label="How it came in"
          name="channel"
          defaultValue={value('channel')}
          error={error('channel')}
          placeholder="Email, web form, letter…"
        />
      </div>
      <TextAreaField
        label="What is asked"
        name="details"
        rows={3}
        defaultValue={value('details')}
        error={error('details')}
      />
      <div className={styles.inline}>
        <SelectField
          label="Requester identified? (R14)"
          name="identityVerified"
          options={[
            { value: 'false', label: 'Not yet' },
            { value: 'true', label: 'Yes, by the identifier the client asks for' },
          ]}
          defaultValue={value('identityVerified') || 'false'}
        />
        <SelectField
          label="Request made by"
          name="requesterRole"
          placeholder="Not recorded"
          options={[
            { value: 'self', label: 'The Data Principal' },
            { value: 'parent', label: 'A parent of a child' },
            { value: 'guardian', label: 'A lawful guardian' },
            { value: 'nominee', label: 'A nominee (s.14)' },
            { value: 'agent', label: 'An agent with authority' },
          ]}
          defaultValue={value('requesterRole')}
          error={error('requesterRole')}
        />
      </div>
      <div className={styles.inline}>
        <TextField
          label="How identity was checked"
          name="verificationMethod"
          defaultValue={value('verificationMethod')}
          error={error('verificationMethod')}
          placeholder="OTP to the registered mobile, account login…"
        />
        <TextField
          label="Identity checked on"
          name="verifiedOn"
          type="date"
          defaultValue={value('verifiedOn')}
          error={error('verifiedOn')}
        />
        <TextField
          label="Acknowledged on"
          name="acknowledgedOn"
          type="date"
          defaultValue={value('acknowledgedOn')}
          error={error('acknowledgedOn')}
        />
        <TextField
          label="Letter sent"
          name="letterRef"
          defaultValue={value('letterRef')}
          error={error('letterRef')}
          placeholder="L-01"
          hint="The response letter, by its number in the R04 template."
        />
        <SelectField
          label="Department handling it"
          name="departmentId"
          placeholder="None"
          options={departments}
          defaultValue={value('departmentId')}
          error={error('departmentId')}
        />
        <TextField
          label="Handled by"
          name="handler"
          defaultValue={value('handler')}
          error={error('handler')}
        />
      </div>
      <FormActions>
        <button type="submit" className={buttonClass()} disabled={pending} aria-busy={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </FormActions>
    </form>
  )
}

/** Moves a request on: work started, fulfilled, refused with its reason, or withdrawn. */
export const RightsMoveForm = ({
  action,
  moves,
  today,
}: {
  action: Action
  moves: { value: string; label: string }[]
  today: string
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="What was done, or why it is refused"
        name="outcome"
        rows={3}
        defaultValue={state.values?.outcome}
        error={state.fieldErrors?.outcome}
        hint="Required when refusing. A refusal should name the ground, such as retention the law requires."
      />
      <div className={styles.inline}>
        <TextField
          label="Closed on"
          name="closedOn"
          type="date"
          defaultValue={state.values?.closedOn ?? today}
          error={state.fieldErrors?.closedOn}
        />
      </div>
      <FormActions>
        {moves.map((move, index) => (
          <SubmitButton
            key={move.value}
            name="to"
            value={move.value}
            variant={index === 0 ? 'primary' : 'secondary'}
            pendingText="Saving…"
          >
            {move.label}
          </SubmitButton>
        ))}
      </FormActions>
    </form>
  )
}

/** The response period the client publishes. */
export const ResponseDaysForm = ({ action, days }: { action: Action; days: number }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <div className={styles.inline}>
        <TextField
          label="Response period the client publishes (days)"
          name="responseDays"
          type="number"
          min={1}
          defaultValue={state.values?.responseDays ?? String(days)}
          error={state.fieldErrors?.responseDays}
          hint="New requests fall due this many days after receipt. A grievance is answered within 90 days at most (R14(3))."
        />
      </div>
      <FormActions>
        <SubmitButton variant="secondary" pendingText="Saving…">
          Save period
        </SubmitButton>
      </FormActions>
    </form>
  )
}

// --- DPIA ---------------------------------------------------------------------------------------

export type DpiaRiskValues = {
  risk: string
  likelihood: string
  impact: string
  measures: string
  residualLikelihood: string
  residualImpact: string
}

const SCALE = ['1', '2', '3', '4', '5'].map((value) => ({ value, label: value }))

/** The assessment itself: rights, purpose, necessity, risks before and after measures, outcome. */
export const DpiaForm = ({
  action,
  initial,
  risks,
  outcomes,
}: {
  action: Action
  initial: Record<string, string>
  risks: DpiaRiskValues[]
  outcomes: SelectOption[]
}) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const { value, error } = fieldsOf(state, initial)
  // Existing risks, then three empty rows to add more.
  const [rows] = useState(() => [
    ...risks,
    ...Array.from({ length: 3 }, () => ({
      risk: '',
      likelihood: '3',
      impact: '3',
      measures: '',
      residualLikelihood: '3',
      residualImpact: '3',
    })),
  ])
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="The processing"
        name="description"
        rows={4}
        defaultValue={value('description')}
        error={error('description')}
      />
      <TextAreaField
        label="Purpose of the processing"
        name="purpose"
        rows={2}
        defaultValue={value('purpose')}
        error={error('purpose')}
      />
      <TextAreaField
        label="Rights of the Data Principals affected"
        name="rightsAffected"
        rows={3}
        defaultValue={value('rightsAffected')}
        error={error('rightsAffected')}
        hint="Which rights the processing touches and how they are honoured: notice and consent, access, correction and erasure, grievance, nomination."
      />
      <TextAreaField
        label="Necessity and proportionality"
        name="necessity"
        rows={3}
        defaultValue={value('necessity')}
        error={error('necessity')}
        hint="Whether the purpose could be met with less personal data, fewer people or a shorter time."
      />
      <fieldset className={styles.checkList}>
        <legend className={styles.fileLabel}>
          Risks to the Data Principals, before and after the measures
        </legend>
        {error('risks') ? <p className={styles.fieldError}>{error('risks')}</p> : null}
        {rows.map((row, index) => (
          <div key={index} className={styles.riskRow}>
            <TextField
              label={`Risk ${index + 1}`}
              name={`risk_${index}`}
              defaultValue={value(`risk_${index}`) || row.risk}
              error={error(`risks.${index}.risk`)}
            />
            <SelectField
              label="Likelihood"
              name={`likelihood_${index}`}
              options={SCALE}
              defaultValue={value(`likelihood_${index}`) || row.likelihood}
            />
            <SelectField
              label="Impact"
              name={`impact_${index}`}
              options={SCALE}
              defaultValue={value(`impact_${index}`) || row.impact}
            />
            <TextField
              label="Measures that manage it"
              name={`measures_${index}`}
              defaultValue={value(`measures_${index}`) || row.measures}
            />
            <SelectField
              label="Likelihood after"
              name={`residualLikelihood_${index}`}
              options={SCALE}
              defaultValue={value(`residualLikelihood_${index}`) || row.residualLikelihood}
              error={error(`risks.${index}.residualLikelihood`)}
            />
            <SelectField
              label="Impact after"
              name={`residualImpact_${index}`}
              options={SCALE}
              defaultValue={value(`residualImpact_${index}`) || row.residualImpact}
            />
          </div>
        ))}
        <p className={styles.small}>
          Scales of 1 to 5, as in the risk register. A row with no risk text is left out. Save to
          get more empty rows.
        </p>
      </fieldset>
      <div className={styles.inline}>
        <SelectField
          label="Outcome"
          name="outcome"
          placeholder="Not decided"
          options={outcomes}
          defaultValue={value('outcome')}
          error={error('outcome')}
        />
        <TextField
          label="Who was consulted"
          name="consulted"
          defaultValue={value('consulted')}
          error={error('consulted')}
        />
        <TextField
          label="Prepared by"
          name="preparedBy"
          defaultValue={value('preparedBy')}
          error={error('preparedBy')}
        />
      </div>
      <TextAreaField
        label="Outcome note"
        name="outcomeNote"
        rows={2}
        defaultValue={value('outcomeNote')}
        error={error('outcomeNote')}
      />
      <div className={styles.inline}>
        <TextField
          label="Completed on"
          name="completedOn"
          type="date"
          defaultValue={value('completedOn')}
          error={error('completedOn')}
          hint="Used when completing; today if left empty."
        />
        <TextField
          label="Next review"
          name="nextReviewOn"
          type="date"
          defaultValue={value('nextReviewOn')}
          error={error('nextReviewOn')}
          hint="Twelve months after completion if left empty (R13(1) for a Significant Data Fiduciary)."
        />
      </div>
      <FormActions>
        <button
          type="submit"
          name="intent"
          value="complete"
          className={buttonClass()}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Saving…' : 'Save and complete'}
        </button>
        <button
          type="submit"
          name="intent"
          value="draft"
          className={buttonClass('secondary')}
          disabled={pending}
        >
          Save as draft
        </button>
      </FormActions>
    </form>
  )
}
