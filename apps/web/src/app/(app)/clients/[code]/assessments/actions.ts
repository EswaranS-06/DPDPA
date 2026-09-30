'use server'

import {
  answerItem,
  assignItems,
  changeAssessmentStatus,
  createAssessment,
  reviewItem,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

const assessmentPath = (client: string, assessment?: string) =>
  `/clients/${encodeURIComponent(client)}/assessments${assessment ? `/${encodeURIComponent(assessment)}` : ''}`

export const createAssessmentAction = async (
  clientId: string,
  clientCode: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  let code: string
  try {
    code = (await createAssessment(await serviceContext(), clientId, values)).code
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(assessmentPath(clientCode))
  redirect(assessmentPath(clientCode, code))
}

export const answerItemAction = async (
  target: { clientId: string; clientCode: string; assessmentCode: string; itemId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await answerItem(await serviceContext(), target.clientId, target.itemId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(assessmentPath(target.clientCode, target.assessmentCode), 'layout')
  return { status: 'success', message: 'Answer saved.' }
}

export const reviewItemAction = async (
  target: { clientId: string; clientCode: string; assessmentCode: string; itemId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await reviewItem(await serviceContext(), target.clientId, target.itemId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(assessmentPath(target.clientCode, target.assessmentCode), 'layout')
  return {
    status: 'success',
    message: values.decision === 'accepted' ? 'Answer accepted.' : 'Sent back with your note.',
  }
}

export const assignItemsAction = async (
  target: { clientId: string; clientCode: string; assessmentId: string; assessmentCode: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const changed = await assignItems(
      await serviceContext(),
      target.clientId,
      target.assessmentId,
      values,
    )
    revalidatePath(assessmentPath(target.clientCode, target.assessmentCode), 'layout')
    return {
      status: 'success',
      message: `${changed} question${changed === 1 ? '' : 's'} ${values.departmentId ? 'assigned' : 'unassigned'}.`,
    }
  } catch (error) {
    return failure(error, values)
  }
}

export const changeStatusAction = async (
  target: { clientId: string; clientCode: string; assessmentId: string; assessmentCode: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await changeAssessmentStatus(
      await serviceContext(),
      target.clientId,
      target.assessmentId,
      values.to ?? '',
    )
  } catch (error) {
    return failure(error)
  }
  revalidatePath(assessmentPath(target.clientCode), 'layout')
  return { status: 'success', message: 'Status updated.' }
}
