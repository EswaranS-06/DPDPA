'use server'

import { removeDpia, risksFromForm, saveDpia, startDpia } from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string }
type DpiaTarget = Target & { dpiaId: string; dpiaCode: string }

const base = (target: Target) => `/clients/${encodeURIComponent(target.clientCode)}`
const refresh = (target: Target) => revalidatePath(base(target), 'layout')

export const startDpiaAction = async (
  target: Target & { activityRef: number },
  _: FormState,
): Promise<FormState> => {
  let code: string
  try {
    code = (await startDpia(await serviceContext(), target.clientId, target.activityRef)).code
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  redirect(`${base(target)}/dpia/${code}`)
}

/** Saves the assessment; the "Save and complete" button completes it. */
export const saveDpiaAction = async (
  target: DpiaTarget,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  const complete = values.intent === 'complete'
  try {
    await saveDpia(
      await serviceContext(),
      target.clientId,
      target.dpiaId,
      { ...values, risks: risksFromForm(values) },
      { complete },
    )
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  // The completed view replaces the form, so the confirmation is shown on the page itself.
  if (complete) redirect(`${base(target)}/dpia/${target.dpiaCode}?completed=1`)
  return { status: 'success', message: 'Draft saved.' }
}

export const removeDpiaAction = async (target: DpiaTarget, _: FormState): Promise<FormState> => {
  try {
    await removeDpia(await serviceContext(), target.clientId, target.dpiaId)
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  redirect(`${base(target)}/dpia`)
}
