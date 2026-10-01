'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { buttonClass, type ButtonVariant } from './Form'

type SubmitButtonProps = {
  children: ReactNode
  /** Text while the form is being sent. */
  pendingText?: string
  variant?: ButtonVariant
  size?: 'md' | 'sm'
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
  size = 'md',
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
      aria-busy={pending}
      formAction={formAction}
      name={name}
      value={value}
      className={buttonClass(variant, size)}
    >
      {pending ? pendingText : children}
    </button>
  )
}
