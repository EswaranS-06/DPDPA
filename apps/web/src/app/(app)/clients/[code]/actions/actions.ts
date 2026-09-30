'use server'

import {
  createAction,
  createReassessment,
  linkActionEvidence,
  transitionAction,
  updateActionPlan,
  uploadEvidence,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

const refresh = (clientCode: string) =>
  revalidatePath(`/clients/${encodeURIComponent(clientCode)}`, 'layout')

export const createActionAction = async (
  target: { clientId: string; clientCode: string; findingId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  let code: string
  try {
    code = (await createAction(await serviceContext(), target.clientId, target.findingId, values))
      .code
  } catch (error) {
    return failure(error, values)
  }
  refresh(target.clientCode)
  redirect(`/clients/${encodeURIComponent(target.clientCode)}/actions/${code}`)
}

type ActionTarget = {
  clientId: string
  clientCode: string
  actionId: string
  departmentId: string | null
}

export const updatePlanAction = async (
  target: ActionTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await updateActionPlan(await serviceContext(), target.clientId, target.actionId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target.clientCode)
  return { status: 'success', message: 'Plan saved.' }
}

export const moveAction = async (
  target: ActionTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await transitionAction(await serviceContext(), target.clientId, target.actionId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target.clientCode)
  return { status: 'success', message: 'Status updated.' }
}

/** Uploads a file as evidence for the action's department and links it to the action. */
export const uploadActionEvidence = async (
  target: ActionTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  const file = formData.get('file')
  try {
    if (!(file instanceof File) || file.size === 0) {
      return {
        status: 'error',
        message: 'Choose a file to upload.',
        fieldErrors: { file: 'Choose a file.' },
        values,
      }
    }
    const ctx = await serviceContext()
    const uploaded = await uploadEvidence(
      ctx,
      target.clientId,
      { ...values, departmentId: target.departmentId ?? '' },
      { name: file.name, bytes: Buffer.from(await file.arrayBuffer()) },
    )
    await linkActionEvidence(ctx, target.clientId, target.actionId, uploaded.id)
    refresh(target.clientCode)
    return { status: 'success', message: `Uploaded and linked as ${uploaded.code}.` }
  } catch (error) {
    return failure(error, values)
  }
}

export const linkEvidenceToAction = async (
  target: ActionTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await linkActionEvidence(
      await serviceContext(),
      target.clientId,
      target.actionId,
      values.evidenceId ?? '',
    )
  } catch (error) {
    return failure(error, values)
  }
  refresh(target.clientCode)
  return { status: 'success', message: 'Evidence linked.' }
}

export const reassessAction = async (
  target: { clientId: string; clientCode: string; assessmentId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  let code: string
  try {
    code = (
      await createReassessment(await serviceContext(), target.clientId, target.assessmentId, values)
    ).code
  } catch (error) {
    return failure(error, values)
  }
  refresh(target.clientCode)
  redirect(`/clients/${encodeURIComponent(target.clientCode)}/assessments/${code}`)
}
