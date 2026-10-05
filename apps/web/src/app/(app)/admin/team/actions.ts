'use server'

import { createStaff, issueStaffLogin, revokeStaffLogin } from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

const TEAM_PATH = '/admin/team'

export const createStaffAction = async (_: FormState, formData: FormData): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const created = await createStaff(await serviceContext(), values)
    revalidatePath(TEAM_PATH)
    return {
      status: 'success',
      message: `${values.displayName ?? 'The new team member'} can sign in as ${created.login.username}. Give them this one-time password privately.`,
      secret: { label: 'One-time password', value: created.login.oneTimePassword },
    }
  } catch (error) {
    return failure(error, values)
  }
}

export const staffLoginAction = async (_: FormState, formData: FormData): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const ctx = await serviceContext()
    if (values.intent === 'revoke') {
      await revokeStaffLogin(ctx, values.userId ?? '')
      revalidatePath(TEAM_PATH)
      return { status: 'success', message: 'Login switched off and sessions ended.' }
    }
    const login = await issueStaffLogin(ctx, values.userId ?? '')
    revalidatePath(TEAM_PATH)
    return {
      status: 'success',
      message: `New one-time password for ${login.username}.`,
      secret: { label: 'One-time password', value: login.oneTimePassword },
    }
  } catch (error) {
    return failure(error, values)
  }
}
