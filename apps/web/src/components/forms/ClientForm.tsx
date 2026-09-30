'use client'

import {
  Fieldset,
  FormActions,
  FormAlert,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  buttonClass,
  type SelectOption,
} from '@duatf/core-ui'
import Link from 'next/link'
import { useActionState } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import styles from './forms.module.css'

export type ClientFormOptions = {
  organisationTypes: SelectOption[]
  statuses: SelectOption[]
  applicability: SelectOption[]
  states: SelectOption[]
  sectors: SelectOption[]
}

type ClientFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  options: ClientFormOptions
  /** Current values when editing; absent when onboarding a new client. */
  initial?: Record<string, string>
  cancelHref: string
}

/** Onboarding and profile form for a client organisation. */
export const ClientForm = ({ action, options, initial = {}, cancelHref }: ClientFormProps) => {
  const [state, formAction] = useActionState(action, IDLE)
  const creating = !initial.name
  const value = (name: string) => state.values?.[name] ?? initial[name] ?? ''
  const error = (name: string) => state.fieldErrors?.[name]

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.status === 'error' ? <FormAlert>{state.message}</FormAlert> : null}

      <Fieldset legend="Organisation">
        <TextField
          label="Organisation name"
          name="name"
          required
          defaultValue={value('name')}
          error={error('name')}
          autoComplete="organization"
        />
        <TextField
          label="Legal name"
          name="legalName"
          required
          defaultValue={value('legalName')}
          error={error('legalName')}
          hint="As registered, e.g. Acme Health Private Limited."
        />
        {creating ? (
          <TextField
            label="Client ID"
            name="code"
            defaultValue={value('code')}
            error={error('code')}
            maxLength={10}
            hint="2 to 10 capital letters or digits. Leave blank to make one from the name."
          />
        ) : null}
        <SelectField
          label="Organisation type"
          name="organisationType"
          required
          placeholder="Choose…"
          options={options.organisationTypes}
          defaultValue={value('organisationType')}
          error={error('organisationType')}
        />
        <TextField
          label="Industry"
          name="industry"
          required
          defaultValue={value('industry')}
          error={error('industry')}
          hint="In your own words, e.g. hospital chain, NBFC, SaaS."
        />
        <SelectField
          label="Sector overlay"
          name="sectorCode"
          placeholder="None"
          options={options.sectors}
          defaultValue={value('sectorCode')}
          error={error('sectorCode')}
          hint="Links the client to sector laws and retention periods in the knowledge base."
        />
        <TextField
          label="Website"
          name="website"
          type="url"
          defaultValue={value('website')}
          error={error('website')}
          placeholder="www.example.in"
        />
        <TextField
          label="Employees"
          name="employeeCount"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={value('employeeCount')}
          error={error('employeeCount')}
        />
        <TextField
          label="Data principals (approximate)"
          name="dataPrincipalCount"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={value('dataPrincipalCount')}
          error={error('dataPrincipalCount')}
          hint="Customers, patients, users and others whose personal data is processed."
        />
      </Fieldset>

      <Fieldset legend="Location">
        <TextField
          label="Country"
          name="country"
          defaultValue={value('country') || 'India'}
          error={error('country')}
          autoComplete="country-name"
        />
        <SelectField
          label="State or Union Territory"
          name="state"
          placeholder="Choose…"
          options={options.states}
          defaultValue={value('state')}
          error={error('state')}
        />
        <TextAreaField
          label="Registered address"
          name="address"
          rows={3}
          wide
          defaultValue={value('address')}
          error={error('address')}
        />
      </Fieldset>

      <Fieldset legend="Contacts">
        <TextField
          label="Primary contact name"
          name="primaryContactName"
          required
          defaultValue={value('primaryContactName')}
          error={error('primaryContactName')}
        />
        <TextField
          label="Primary contact email"
          name="primaryContactEmail"
          type="email"
          required
          defaultValue={value('primaryContactEmail')}
          error={error('primaryContactEmail')}
        />
        <TextField
          label="Primary contact phone"
          name="primaryContactPhone"
          type="tel"
          defaultValue={value('primaryContactPhone')}
          error={error('primaryContactPhone')}
        />
        <span aria-hidden="true" />
        <TextField
          label="DPO or privacy contact"
          name="dpoName"
          defaultValue={value('dpoName')}
          error={error('dpoName')}
        />
        <TextField
          label="DPO email"
          name="dpoEmail"
          type="email"
          defaultValue={value('dpoEmail')}
          error={error('dpoEmail')}
        />
        <TextField
          label="DPO phone"
          name="dpoPhone"
          type="tel"
          defaultValue={value('dpoPhone')}
          error={error('dpoPhone')}
        />
      </Fieldset>

      <Fieldset legend="Engagement">
        <TextField
          label="Assessment period starts"
          name="assessmentPeriodStart"
          type="date"
          defaultValue={value('assessmentPeriodStart')}
          error={error('assessmentPeriodStart')}
        />
        <TextField
          label="Assessment period ends"
          name="assessmentPeriodEnd"
          type="date"
          defaultValue={value('assessmentPeriodEnd')}
          error={error('assessmentPeriodEnd')}
        />
        <SelectField
          label="DPDP Act applicability"
          name="applicability"
          options={options.applicability}
          defaultValue={value('applicability') || 'under_review'}
          error={error('applicability')}
        />
        <SelectField
          label="Client status"
          name="status"
          options={options.statuses}
          defaultValue={value('status') || 'onboarding'}
          error={error('status')}
        />
        <TextAreaField
          label="Applicability note"
          name="applicabilityNote"
          rows={3}
          wide
          defaultValue={value('applicabilityNote')}
          error={error('applicabilityNote')}
          hint="Why the Act applies or not: s.3 territorial scope, digital personal data, exemptions relied on."
        />
      </Fieldset>

      <FormActions>
        <SubmitButton pendingText={creating ? 'Onboarding…' : 'Saving…'}>
          {creating ? 'Onboard client' : 'Save changes'}
        </SubmitButton>
        <Link href={cancelHref} className={buttonClass('secondary')}>
          Cancel
        </Link>
      </FormActions>
    </form>
  )
}
