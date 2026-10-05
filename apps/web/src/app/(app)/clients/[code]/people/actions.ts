'use server'

import {
  addClientRole,
  createClientPerson,
  issueClientLogin,
  removeClientRole,
  revokeClientLogin,
  type LoginIssued,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

const peoplePath = (code: string) => `/clients/${encodeURIComponent(code)}/people`

const loginShown = (login: LoginIssued, who: string): FormState => ({
  status: 'success',
  message: `${who} can sign in as ${login.username}. Give them this one-time password privately; they choose their own at first sign-in.`,
  secret: { label: 'One-time password', value: login.oneTimePassword },
})

export const createPersonAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const created = await createClientPerson(await serviceContext(), clientId, values)
    revalidatePath(peoplePath(code))
    return created.login
      ? loginShown(created.login, values.displayName ?? 'The person')
      : {
          status: 'success',
          message: `${values.displayName ?? 'The person'} was added. They have no login; give them work from questions, actions and controls.`,
        }
  } catch (error) {
    return failure(error, values)
  }
}

/** Login and role changes of one person, chosen by the button pressed (intent). */
export const personAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  const userId = values.userId ?? ''
  try {
    const ctx = await serviceContext()
    let state: FormState
    switch (values.intent) {
      case 'issue':
      case 'reset':
        state = loginShown(await issueClientLogin(ctx, clientId, userId, values), 'They')
        break
      case 'revoke':
        await revokeClientLogin(ctx, clientId, userId)
        state = { status: 'success', message: 'Login switched off and sessions ended.' }
        break
      case 'add-role':
        await addClientRole(ctx, clientId, userId, values)
        state = { status: 'success', message: 'Role added.' }
        break
      case 'remove-role':
        await removeClientRole(ctx, clientId, values.assignmentId ?? '')
        state = { status: 'success', message: 'Role removed.' }
        break
      default:
        return { status: 'error', message: 'Unknown action.' }
    }
    revalidatePath(peoplePath(code))
    return state
  } catch (error) {
    return failure(error, values)
  }
}
