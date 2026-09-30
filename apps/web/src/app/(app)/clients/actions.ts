'use server'

import {
  assignStaff,
  createClient,
  createDepartment,
  inviteClientUser,
  inviteFirmStaff,
  removeAssignment,
  resetTemporaryPassword,
  setUserEnabled,
  updateClient,
  setDepartmentActive,
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

export const createDepartmentAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await createDepartment(await serviceContext(), clientId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(clientPath(code, '/departments'))
  return { status: 'success', message: `Department ${values.code?.toUpperCase() ?? ''} added.` }
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

export const inviteClientUserAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const result = await inviteClientUser(await serviceContext(), clientId, values)
    revalidatePath(clientPath(code, '/people'))
    return result.temporaryPassword
      ? {
          status: 'success',
          message: `${values.email ?? 'The person'} can now sign in. Give them this one-time password through a separate, private channel; they will choose their own password and set up an authenticator app at first sign-in.`,
          secret: { label: 'One-time password', value: result.temporaryPassword },
        }
      : {
          status: 'success',
          message: 'This person already had an account; the role was added to it.',
        }
  } catch (error) {
    return failure(error, values)
  }
}

export const assignStaffAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await assignStaff(await serviceContext(), clientId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(clientPath(code, '/people'))
  return { status: 'success', message: 'Added to the client team.' }
}

export const inviteStaffAction = async (_: FormState, formData: FormData): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const result = await inviteFirmStaff(await serviceContext(), values)
    revalidatePath('/admin/staff')
    return result.temporaryPassword
      ? {
          status: 'success',
          message: `${values.email ?? 'The person'} can now sign in. Give them this one-time password privately; they will choose their own password and set up an authenticator app at first sign-in.`,
          secret: { label: 'One-time password', value: result.temporaryPassword },
        }
      : { status: 'success', message: 'This person already had an account; the role was added.' }
  } catch (error) {
    return failure(error, values)
  }
}

/** Remove role, reset password, disable and enable: small actions with their own feedback. */
export const accountAction = async (
  returnPath: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const ctx = await serviceContext()
    let state: FormState
    switch (values.intent) {
      case 'remove':
        await removeAssignment(ctx, values.assignmentId ?? '')
        state = { status: 'success', message: 'Role removed.' }
        break
      case 'reset':
        state = {
          status: 'success',
          message: 'Give this one-time password privately. Their open sessions were ended.',
          secret: {
            label: 'New one-time password',
            value: await resetTemporaryPassword(ctx, values.userId ?? ''),
          },
        }
        break
      case 'disable':
      case 'enable':
        await setUserEnabled(ctx, values.userId ?? '', values.intent === 'enable')
        state = {
          status: 'success',
          message:
            values.intent === 'enable' ? 'Account enabled.' : 'Account disabled and signed out.',
        }
        break
      default:
        return { status: 'error', message: 'Unknown action.' }
    }
    revalidatePath(returnPath)
    return state
  } catch (error) {
    return failure(error)
  }
}
