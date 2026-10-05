'use server'

import {
  createClient,
  createDepartment,
  setDepartmentActive,
  updateClient,
  updateDepartment,
  type QuestionChange,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

const clientPath = (code: string, tab = '') => `/clients/${encodeURIComponent(code)}${tab}`

export const createClientAction = async (_: FormState, formData: FormData): Promise<FormState> => {
  const values = formValues(formData)
  let code: string
  try {
    code = (await createClient(await serviceContext(), values)).code
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath('/clients')
  redirect(clientPath(code))
}

export const updateClientAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await updateClient(await serviceContext(), clientId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(clientPath(code))
  redirect(clientPath(code))
}

/** The department fields plus every ticked question (one "questions" field each). */
const departmentInput = (formData: FormData) => ({
  ...formValues(formData),
  questions: formData.getAll('questions').filter((item) => typeof item === 'string'),
})

/** "kept" notes for questions that could not be taken away, carried to the department page. */
const keptQuery = (change: QuestionChange | null) =>
  change?.kept.length ? `?kept=${encodeURIComponent(change.kept.join(', '))}` : ''

export const createDepartmentAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const input = departmentInput(formData)
  const departmentCode = (formValues(formData).code ?? '').trim().toUpperCase()
  try {
    await createDepartment(await serviceContext(), clientId, input)
  } catch (error) {
    return failure(error, formValues(formData))
  }
  revalidatePath(clientPath(code), 'layout')
  redirect(clientPath(code, `/departments/${encodeURIComponent(departmentCode)}`))
}

export const updateDepartmentAction = async (
  target: {
    clientId: string
    clientCode: string
    departmentId: string
    departmentCode: string
    active: boolean
  },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const input = departmentInput(formData)
  let change: QuestionChange | null
  try {
    change = await updateDepartment(await serviceContext(), target.clientId, target.departmentId, {
      ...input,
      active: target.active,
    })
  } catch (error) {
    return failure(error, formValues(formData))
  }
  revalidatePath(clientPath(target.clientCode), 'layout')
  redirect(
    clientPath(
      target.clientCode,
      `/departments/${encodeURIComponent(target.departmentCode)}${keptQuery(change)}`,
    ),
  )
}

export const setDepartmentActiveAction = async (
  clientId: string,
  code: string,
  formData: FormData,
): Promise<void> => {
  const values = formValues(formData)
  await setDepartmentActive(
    await serviceContext(),
    clientId,
    values.departmentId ?? '',
    values.active === 'true',
  )
  revalidatePath(clientPath(code, '/departments'))
}
