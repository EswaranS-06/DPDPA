'use client'

import {
  FormActions,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  type SelectOption,
} from '@duatf/core-ui'
import { useActionState, useRef } from 'react'
import { IDLE, type FormState } from '@/lib/formState'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx,.csv,.txt'

type UploadFormProps = {
  action: Action
  /** Question to link the upload to, when uploading from a question page. */
  itemId?: string
  departments?: SelectOption[]
  /** Open evidence requests of the question the file can answer. */
  requests?: { id: string; title: string }[]
}

export const UploadEvidenceForm = ({
  action,
  itemId,
  departments,
  requests = [],
}: UploadFormProps) => {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState(async (previous: FormState, formData: FormData) => {
    const next = await action(previous, formData)
    if (next.status === 'success') formRef.current?.reset()
    return next
  }, IDLE)
  const value = (name: string) => (state.status === 'error' ? (state.values?.[name] ?? '') : '')
  const error = (name: string) => state.fieldErrors?.[name]
  return (
    <form ref={formRef} action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      {itemId ? <input type="hidden" name="itemIds" value={itemId} /> : null}
      <div className={styles.inline}>
        <div className={styles.fileField}>
          <label htmlFor="evidence-file" className={styles.fileLabel}>
            File{' '}
            <span className={styles.small}>(PDF, image, Office, CSV or text; up to 20 MB)</span>
          </label>
          <input
            id="evidence-file"
            name="file"
            type="file"
            accept={ACCEPT}
            required
            aria-invalid={error('file') ? true : undefined}
          />
          {error('file') ? <p className={styles.fieldError}>{error('file')}</p> : null}
        </div>
        <TextField
          label="Title"
          name="title"
          required
          defaultValue={value('title')}
          error={error('title')}
          placeholder="e.g. Board-approved privacy policy v3"
        />
        <TextField
          label="Valid until"
          name="validUntil"
          type="date"
          defaultValue={value('validUntil')}
          error={error('validUntil')}
          hint="For certificates and reports that expire."
        />
        {departments ? (
          <SelectField
            label="Department"
            name="departmentId"
            placeholder="None"
            options={departments}
            defaultValue={value('departmentId')}
            error={error('departmentId')}
          />
        ) : null}
      </div>
      <TextAreaField
        label="Description"
        name="description"
        rows={2}
        defaultValue={value('description')}
        error={error('description')}
      />
      {requests.length ? (
        <fieldset className={styles.checkList}>
          <legend className={styles.fileLabel}>This file answers</legend>
          {requests.map((request) => (
            <label key={request.id} className={styles.checkItem}>
              <input type="checkbox" name="requestIds" value={request.id} />
              {request.title}
            </label>
          ))}
        </fieldset>
      ) : null}
      <FormActions>
        <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
      </FormActions>
    </form>
  )
}

export const LinkEvidenceForm = ({
  action,
  itemId,
  options,
}: {
  action: Action
  itemId: string
  options: SelectOption[]
}) => {
  const [state, formAction] = useActionState(action, IDLE)
  if (options.length === 0) return null
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <input type="hidden" name="itemIds" value={itemId} />
      <div className={styles.inline}>
        <SelectField
          label="Use evidence already uploaded"
          name="evidenceId"
          required
          placeholder="Choose…"
          options={options}
          error={state.fieldErrors?.itemIds}
        />
      </div>
      <div>
        <SubmitButton variant="secondary" pendingText="Linking…">
          Link
        </SubmitButton>
      </div>
    </form>
  )
}

export const EvidenceReviewForm = ({ action }: { action: Action }) => {
  const [state, formAction] = useActionState(action, IDLE)
  return (
    <form action={formAction} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextAreaField
        label="Review note"
        name="note"
        rows={2}
        defaultValue={state.values?.note}
        error={state.fieldErrors?.note}
        hint="Required when rejecting."
      />
      <FormActions>
        <SubmitButton name="decision" value="accepted" pendingText="Saving…">
          Accept evidence
        </SubmitButton>
        <SubmitButton name="decision" value="rejected" variant="danger" pendingText="Saving…">
          Reject
        </SubmitButton>
      </FormActions>
    </form>
  )
}
