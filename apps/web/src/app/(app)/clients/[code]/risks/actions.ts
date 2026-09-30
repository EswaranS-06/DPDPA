'use server'

import { acceptRisk, updateBands, updateRisk, type Band } from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string; riskId: string }

const refresh = (clientCode: string) =>
  revalidatePath(`/clients/${encodeURIComponent(clientCode)}`, 'layout')

export const updateRiskAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await updateRisk(await serviceContext(), target.clientId, target.riskId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target.clientCode)
  return { status: 'success', message: 'Risk updated.' }
}

export const acceptRiskAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await acceptRisk(await serviceContext(), target.clientId, target.riskId, values)
  } catch (error) {
    return failure(error, values)
  }
  refresh(target.clientCode)
  return { status: 'success', message: 'Risk accepted and recorded.' }
}

/** Rows band_0 … band_5 of the settings form; empty rows are ignored. */
export const updateBandsAction = async (_: FormState, formData: FormData): Promise<FormState> => {
  const values = formValues(formData)
  const bands: Band[] = []
  for (let index = 0; index < 6; index += 1) {
    const name = values[`name_${index}`]?.trim() ?? ''
    if (!name) continue
    bands.push({
      name,
      minScore: Number(values[`min_${index}`]),
      maxScore: Number(values[`max_${index}`]),
      tone: values[`tone_${index}`] ?? 'neutral',
    })
  }
  try {
    await updateBands(await serviceContext(), bands)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath('/', 'layout')
  return { status: 'success', message: 'Risk bands saved. Every register uses them now.' }
}
