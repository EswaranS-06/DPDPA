'use server'

import {
  addProcessorsFromRopa,
  createProcessor,
  removeProcessor,
  updateProcessor,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string }

const base = (target: Target) => `/clients/${encodeURIComponent(target.clientCode)}`
const refresh = (target: Target) => revalidatePath(base(target), 'layout')

/** Form values with the ticked contract terms as a list. */
const processorValues = (formData: FormData) => ({
  ...formValues(formData),
  terms: formData.getAll('terms').filter((item) => typeof item === 'string'),
})

export const createProcessorAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  let code: string
  try {
    code = (
      await createProcessor(await serviceContext(), target.clientId, processorValues(formData))
    ).code
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  redirect(`${base(target)}/processors/${code}`)
}

export const updateProcessorAction = async (
  target: Target & { processorId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await updateProcessor(
      await serviceContext(),
      target.clientId,
      target.processorId,
      processorValues(formData),
    )
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Processor saved.' }
}

export const removeProcessorAction = async (
  target: Target & { processorId: string },
  _: FormState,
): Promise<FormState> => {
  try {
    await removeProcessor(await serviceContext(), target.clientId, target.processorId)
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  redirect(`${base(target)}/processors`)
}

export const addFromRopaAction = async (target: Target, _: FormState): Promise<FormState> => {
  let added: string[]
  try {
    added = await addProcessorsFromRopa(await serviceContext(), target.clientId)
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  // The notice that held the button goes away with the names, so the page itself confirms.
  redirect(`${base(target)}/processors?added=${added.length}`)
}
