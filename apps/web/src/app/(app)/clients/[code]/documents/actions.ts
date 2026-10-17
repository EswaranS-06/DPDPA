'use server'

import {
  clearDocumentAnswers,
  reviewTemplate,
  saveDocumentChecklist,
  saveDocumentProfile,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string }

const refresh = (target: Target) =>
  revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}/documents`, 'layout')

/** The applicability questions: "true"/"false" for a yes-or-no flag, the option for the others. */
export const saveFlagsAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  const flags = Object.fromEntries(
    Object.entries(values)
      .filter(([key]) => key.startsWith('flag_'))
      .map(([key, value]) => [
        key.slice('flag_'.length),
        value === 'true' ? true : value === 'false' ? false : value,
      ]),
  )
  try {
    await saveDocumentProfile(await serviceContext(), target.clientId, { flags })
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return {
    status: 'success',
    message: 'Answers saved. The documents the client needs are worked out again.',
  }
}

/** Common details of one group; an emptied field goes back to DUATF's record or the default. */
export const saveValuesAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  const fields = Object.entries(values).filter(([key]) => key.startsWith('value_'))
  const filled = Object.fromEntries(
    fields
      .filter(([, value]) => value.trim())
      .map(([key, value]) => [key.slice('value_'.length), value.trim()]),
  )
  const emptied = fields
    .filter(([, value]) => !value.trim())
    .map(([key]) => key.slice('value_'.length))
  try {
    const ctx = await serviceContext()
    await saveDocumentProfile(ctx, target.clientId, { values: filled })
    if (emptied.length) await clearDocumentAnswers(ctx, target.clientId, { values: emptied })
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return { status: 'success', message: 'Details saved.' }
}

/** One table as tab-separated text: the first line is the columns. */
export const saveCollectionAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  const name = values.collection ?? ''
  const lines = (values[`rows_${name}`] ?? '').split(/\r?\n/).filter((line) => line.trim())
  const [head, ...body] = lines
  const columns = (head ?? '').split('\t').map((column) => column.trim())
  const rows = body.map((line) => {
    const cells = line.split('\t')
    const row: Record<string, string> = {}
    columns.forEach((column, index) => {
      const cell = (cells[index] ?? '').trim()
      if (column && cell) row[column] = cell
    })
    return row
  })
  try {
    await saveDocumentProfile(await serviceContext(), target.clientId, {
      collections: { [name]: rows },
    })
  } catch (error) {
    return failure(error, values)
  }
  refresh(target)
  return {
    status: 'success',
    message: `${rows.length} row${rows.length === 1 ? '' : 's'} saved for ${name}.`,
  }
}

/** Drops a saved table, so the one DUATF builds from its records applies again. */
export const clearCollectionAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const name = formValues(formData).collection ?? ''
  try {
    await clearDocumentAnswers(await serviceContext(), target.clientId, { collections: [name] })
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  return { status: 'success', message: `${name} is built from DUATF’s records again.` }
}

export const saveChecklistAction = async (
  target: Target & { templateId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const items = formData.getAll('items').map(String)
  const sign = formData.get('intent') === 'sign'
  try {
    await saveDocumentChecklist(await serviceContext(), target.clientId, target.templateId, {
      items,
      sign,
    })
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  return { status: 'success', message: sign ? 'Checklist signed off.' : 'Checklist saved.' }
}

export const reviewTemplateAction = async (
  target: Target & { templateId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  try {
    await reviewTemplate(
      await serviceContext(),
      target.templateId,
      formValues(formData).note || undefined,
    )
  } catch (error) {
    return failure(error)
  }
  refresh(target)
  return {
    status: 'success',
    message: 'Marked as legally reviewed for this version of the template.',
  }
}
