'use client'

import { buttonClass, FormActions, SelectField } from '@duatf/core-ui'
import type { FormState } from '@/lib/formState'
import { useSubmit } from '@/lib/useSubmit'
import { Feedback } from './Feedback'
import styles from './forms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** The target level of each domain the client is assessed on. */
export const MaturityTargetsForm = ({
  action,
  domains,
  levels,
}: {
  action: Action
  domains: { code: string; title: string; target: number }[]
  /** Level names, 0 first. */
  levels: string[]
}) => {
  // Not reset after saving, so each select keeps showing the level that was saved.
  const { state, onSubmit, pending } = useSubmit(action)
  const options = levels.map((name, level) => ({ value: String(level), label: `${level} ${name}` }))
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      {state.fieldErrors?.targets ? (
        <p className={styles.fieldError}>{state.fieldErrors.targets}</p>
      ) : null}
      <div className={styles.inline}>
        {domains.map((domain) => (
          <SelectField
            key={domain.code}
            label={`${domain.code} ${domain.title}`}
            name={`target_${domain.code}`}
            options={options}
            defaultValue={state.values?.[`target_${domain.code}`] ?? String(domain.target)}
          />
        ))}
      </div>
      <FormActions>
        <button
          type="submit"
          className={buttonClass('secondary')}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Saving…' : 'Save targets'}
        </button>
      </FormActions>
    </form>
  )
}
