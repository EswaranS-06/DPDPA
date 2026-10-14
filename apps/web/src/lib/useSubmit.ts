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
    // The button that was pressed is part of the submission (its name and value).
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const data = new FormData(event.currentTarget, submitter)
    startTransition(() => dispatch(data))
  }
  return { state, onSubmit, pending }
}
