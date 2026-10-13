'use server'

import {
  decideSignoff,
  requestSignoff,
  signOffCycle,
  withdrawSignoff,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string; assessmentId: string }

const refresh = (target: Target) =>
  revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}`, 'layout')

export const requestSignoffAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await requestSignoff(await serviceContext(), target.clientId, target.assessmentId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return {
    status: 'success',
    message: 'Sent for sign-off. Answers are locked until it is decided.',
  }
}

export const signOffNowAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await signOffCycle(await serviceContext(), target.clientId, target.assessmentId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Signed off. The assessment is completed.' }
}

export const decideSignoffAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await decideSignoff(await serviceContext(), target.clientId, target.assessmentId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return {
    status: 'success',
    message:
      values.decision === 'approve'
        ? 'Approved. The assessment is completed.'
        : 'Sent back for changes. Answers can be changed again.',
  }
}

export const withdrawSignoffAction = async (target: Target, _: FormState): Promise<FormState> => {
  try {
    await withdrawSignoff(await serviceContext(), target.clientId, target.assessmentId)
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  return { status: 'success', message: 'Request withdrawn. Answers can be changed again.' }
}
