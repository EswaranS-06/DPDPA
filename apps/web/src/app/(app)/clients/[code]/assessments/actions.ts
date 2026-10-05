'use server'

import {
  answerItem,
  assignDepartmentItems,
  assignItem,
  cancelEvidenceRequest,
  changeAssessmentStatus,
  checkAnswered,
  checkItem,
  createAssessment,
  requestEvidence,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

const assessmentPath = (client: string, assessment?: string) =>
  `/clients/${encodeURIComponent(client)}/assessments${assessment ? `/${encodeURIComponent(assessment)}` : ''}`

const clientPath = (client: string) => `/clients/${encodeURIComponent(client)}`

type ItemTarget = { clientId: string; clientCode: string; assessmentCode: string; itemId: string }

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

/** Saves an answer: one option, several ticked choices, free text, or Not applicable. */
export const answerItemAction = async (
  target: ItemTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await answerItem(await serviceContext(), target.clientId, target.itemId, {
      ...values,
      choices: formData.getAll('choices').filter((item) => typeof item === 'string'),
    })
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(clientPath(target.clientCode), 'layout')
  return { status: 'success', message: 'Answer saved.' }
}

/** Ticks one answer as checked, or takes the tick away. */
export const checkItemAction = async (
  target: ItemTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await checkItem(await serviceContext(), target.clientId, target.itemId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(clientPath(target.clientCode), 'layout')
  return {
    status: 'success',
    message: values.checked === 'true' ? 'Ticked as checked.' : 'Tick removed.',
  }
}

/** Ticks every answered question of a department (or of the whole cycle) as checked. */
export const checkAllAction = async (
  target: {
    clientId: string
    clientCode: string
    assessmentId: string
    assessmentCode: string
    departmentId?: string
  },
  _: FormState,
): Promise<FormState> => {
  try {
    const count = await checkAnswered(
      await serviceContext(),
      target.clientId,
      target.assessmentId,
      target.departmentId,
    )
    revalidatePath(clientPath(target.clientCode), 'layout')
    return { status: 'success', message: `${count} answer${count === 1 ? '' : 's'} ticked.` }
  } catch (error) {
    return failure(error)
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
  revalidatePath(clientPath(target.clientCode), 'layout')
  return { status: 'success', message: 'Status updated.' }
}

/** Gives one question to a person (or takes it back). */
export const assignItemAction = async (
  target: ItemTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await assignItem(await serviceContext(), target.clientId, target.itemId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(clientPath(target.clientCode), 'layout')
  return { status: 'success', message: values.assigneeUserId ? 'Assigned.' : 'Assignment removed.' }
}

/** Asks for evidence for one question (ticked suggestions and/or a written item). */
export const requestEvidenceAction = async (
  target: ItemTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const count = await requestEvidence(await serviceContext(), target.clientId, target.itemId, {
      ...values,
      titles: formData.getAll('titles').filter((item) => typeof item === 'string'),
    })
    revalidatePath(clientPath(target.clientCode), 'layout')
    return { status: 'success', message: `${count} item${count === 1 ? '' : 's'} requested.` }
  } catch (error) {
    return failure(error, values)
  }
}

/** Withdraws an evidence request. */
export const cancelRequestAction = async (
  target: { clientId: string; clientCode: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await cancelEvidenceRequest(await serviceContext(), target.clientId, values.requestId ?? '')
  } catch (error) {
    return failure(error)
  }
  revalidatePath(clientPath(target.clientCode), 'layout')
  return { status: 'success', message: 'Request withdrawn.' }
}

/** Gives a department's questions in a cycle to one person. */
export const assignDepartmentAction = async (
  target: { clientId: string; clientCode: string; assessmentId: string; departmentId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const count = await assignDepartmentItems(
      await serviceContext(),
      target.clientId,
      target.assessmentId,
      target.departmentId,
      values,
    )
    revalidatePath(clientPath(target.clientCode), 'layout')
    return { status: 'success', message: `${count} question${count === 1 ? '' : 's'} assigned.` }
  } catch (error) {
    return failure(error, values)
  }
}
