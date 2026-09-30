'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import styles from './Form.module.css'

type SubmitButtonProps = {
  children: ReactNode
  /** Text while the form is being sent. */
  pendingText?: string
  variant?: 'primary' | 'secondary' | 'danger'
  /** Server action for this button only (formAction). */
  formAction?: (formData: FormData) => void | Promise<void>
  name?: string
  value?: string
}

/** Submit button that disables itself and says what is happening while the form is sent. */
export const SubmitButton = ({
  children,
  pendingText = 'Saving…',
  variant = 'primary',
  formAction,
  name,
  value,
}: SubmitButtonProps) => {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      formAction={formAction}
      name={name}
      value={value}
      className={`${styles.button} ${styles[variant]}`}
    >
      {pending ? pendingText : children}
    </button>
  )
}
