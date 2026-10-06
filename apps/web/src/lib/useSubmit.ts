'use client'

import { startTransition, useActionState, type FormEvent } from 'react'
import { IDLE, type FormState } from './formState'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/**
 * A server action run on submit without React's automatic form reset, so controlled editors
 * (checkboxes, selects, radios) keep showing what was saved or what failed to save.
 */
export const useSubmit = (action: Action) => {
  const [state, dispatch, pending] = useActionState(action, IDLE)
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => dispatch(data))
  }
  return { state, onSubmit, pending }
}
