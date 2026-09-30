/** What a form shows after it is submitted (shared by server actions and client forms). */
export type FormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  /** The submitted text, so the form keeps what the user typed after an error. */
  values?: Record<string, string>
  /** A one-time secret (such as a temporary password) shown once and never stored. */
  secret?: { label: string; value: string }
}

export const IDLE: FormState = { status: 'idle' }
