'use server'

import {
  moveRightsRequest,
  recordRightsRequest,
  setRightsResponseDays,
  updateRightsRequest,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string }
type RequestTarget = Target & { requestId: string }

const base = (target: Target) => `/clients/${encodeURIComponent(target.clientCode)}`
const refresh = (target: Target) => revalidatePath(base(target), 'layout')

export const recordRequestAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  let code: string
  try {
    code = (await recordRightsRequest(await serviceContext(), target.clientId, values)).code
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  redirect(`${base(target)}/rights/${code}`)
}

export const updateRequestAction = async (
  target: RequestTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await updateRightsRequest(await serviceContext(), target.clientId, target.requestId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Request saved.' }
}

export const moveRequestAction = async (
  target: RequestTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await moveRightsRequest(await serviceContext(), target.clientId, target.requestId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Request updated.' }
}

export const setResponseDaysAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await setRightsResponseDays(await serviceContext(), target.clientId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Response period saved. New requests use it.' }
}
