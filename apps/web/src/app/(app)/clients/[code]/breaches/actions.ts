'use server'

import {
  closeBreach,
  recordBreach,
  recordBreachStep,
  reopenBreach,
  updateBreach,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string }
type BreachTarget = Target & { breachId: string }

const base = (target: Target) => `/clients/${encodeURIComponent(target.clientCode)}`
const refresh = (target: Target) => revalidatePath(base(target), 'layout')

/** Form values with the ticked natures and activities as lists. */
const breachValues = (formData: FormData) => ({
  ...formValues(formData),
  natures: formData.getAll('natures').filter((item) => typeof item === 'string'),
  activityRefs: formData.getAll('activityRefs').filter((item) => typeof item === 'string'),
})

export const recordBreachAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  let code: string
  try {
    code = (await recordBreach(await serviceContext(), target.clientId, breachValues(formData)))
      .code
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  redirect(`${base(target)}/breaches/${code}`)
}

export const updateBreachAction = async (
  target: BreachTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await updateBreach(
      await serviceContext(),
      target.clientId,
      target.breachId,
      breachValues(formData),
    )
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Breach record saved. The draft notices follow it.' }
}

export const recordStepAction = async (
  target: BreachTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await recordBreachStep(await serviceContext(), target.clientId, target.breachId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Recorded on the timeline.' }
}

export const closeBreachAction = async (
  target: BreachTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await closeBreach(await serviceContext(), target.clientId, target.breachId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Breach closed.' }
}

export const reopenBreachAction = async (
  target: BreachTarget,
  _: FormState,
): Promise<FormState> => {
  try {
    await reopenBreach(await serviceContext(), target.clientId, target.breachId)
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  return { status: 'success', message: 'Breach reopened.' }
}
