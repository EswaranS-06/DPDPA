'use client'

import { FormAlert } from '@duatf/core-ui'
import type { FormState } from '@/lib/formState'
import styles from './forms.module.css'

/** Success or error line, plus a one-time secret when the action returned one. */
export const Feedback = ({ state }: { state: FormState }) => {
  if (state.status === 'idle') return null
  if (state.status === 'error') return <FormAlert>{state.message}</FormAlert>
  return (
    <FormAlert tone="success">
      <div className={styles.secret}>
        <span>{state.message}</span>
        {state.secret ? (
          <>
            <span>
              {state.secret.label}: <code className={styles.secretValue}>{state.secret.value}</code>
            </span>
            <span className={styles.small}>
              This is shown once and is not stored by DUATF. Copy it now.
            </span>
          </>
        ) : null}
      </div>
    </FormAlert>
  )
}
