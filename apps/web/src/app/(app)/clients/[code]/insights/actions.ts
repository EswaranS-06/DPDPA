'use server'

import { setMaturityTargets, targetsFromForm } from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

export const setTargetsAction = async (
  target: { clientId: string; clientCode: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await setMaturityTargets(await serviceContext(), target.clientId, {
      targets: targetsFromForm(values),
    })
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}`, 'layout')
  return { status: 'success', message: 'Targets saved. The gaps are ranked again.' }
}
