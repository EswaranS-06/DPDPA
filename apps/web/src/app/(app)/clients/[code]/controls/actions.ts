'use server'

import { setControlOwner } from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

export const setControlOwnerAction = async (
  clientId: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await setControlOwner(await serviceContext(), clientId, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(`/clients/${encodeURIComponent(code)}/controls`)
  return { status: 'success', message: values.userId ? 'Owner saved.' : 'Owner removed.' }
}
