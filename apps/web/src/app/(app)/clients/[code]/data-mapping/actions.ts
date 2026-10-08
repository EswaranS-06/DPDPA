'use server'

import {
  adoptProcesses,
  applyImport,
  deleteActivity,
  previewImport,
  refLabel,
  saveActivity,
  type ImportKind,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ImportState } from '@/components/data/ImportForm'
import { failure, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string }

const mappingPath = (code: string, rest = '') =>
  `/clients/${encodeURIComponent(code)}/data-mapping${rest}`

/** JSON the activity form sends in one hidden field; anything unreadable counts as empty. */
const jsonField = (formData: FormData, name: string): unknown => {
  const raw = formData.get(name)
  if (typeof raw !== 'string' || raw === '') return {}
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return {}
  }
}

export const saveActivityAction = async (
  target: Target & { ref: number | null },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  let saved: { ref: number; warnings: Record<string, string> }
  try {
    saved = await saveActivity(
      await serviceContext(),
      target.clientId,
      target.ref,
      jsonField(formData, 'activity'),
    )
  } catch (error) {
    return failure(error)
  }
  revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}`, 'layout')
  if (target.ref === null)
    redirect(mappingPath(target.clientCode, `/activities/${refLabel(saved.ref)}?saved=1`))
  return {
    status: 'success',
    message: saved.warnings.elements ? `Saved. ${saved.warnings.elements}` : 'Saved.',
  }
}

export const deleteActivityAction = async (
  target: Target & { ref: number },
  _: FormState,
): Promise<FormState> => {
  try {
    await deleteActivity(await serviceContext(), target.clientId, target.ref)
  } catch (error) {
    return failure(error)
  }
  revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}`, 'layout')
  redirect(mappingPath(target.clientCode, `?view=ropa&removed=${refLabel(target.ref)}`))
}

export const adoptProcessesAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const picks = formData
    .getAll('pick')
    .filter((item) => typeof item === 'string')
    .map((item) => {
      const [department = '', process = ''] = item.split('|')
      return { department, process }
    })
  let result: { created: string[]; skipped: string[] }
  try {
    result = await adoptProcesses(await serviceContext(), target.clientId, { picks })
  } catch (error) {
    return failure(error)
  }
  revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}`, 'layout')
  redirect(
    mappingPath(
      target.clientCode,
      `?view=ropa&added=${result.created.length}&skipped=${result.skipped.length}`,
    ),
  )
}

const MAX_BYTES = 10 * 1024 * 1024

/**
 * Checks an uploaded workbook (intent "check") or saves the changes it was checked for (intent
 * "apply", with the fingerprint the check gave).
 */
export const importAction = async (
  target: Target & { kind: ImportKind },
  _: ImportState,
  formData: FormData,
): Promise<ImportState> => {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'Choose the Excel file to import.' }
  }
  if (file.size > MAX_BYTES) {
    return {
      status: 'error',
      message: 'The file is larger than 10 MB. Import the exported workbook.',
    }
  }
  const content = Buffer.from(await file.arrayBuffer())
  const ctx = await serviceContext()
  try {
    if (formData.get('intent') === 'apply') {
      const fingerprint = formData.get('fingerprint')
      const applied = await applyImport(
        ctx,
        target.clientId,
        target.kind,
        content,
        typeof fingerprint === 'string' ? fingerprint : '',
      )
      revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}`, 'layout')
      return { status: 'applied', applied }
    }
    const plan = await previewImport(ctx, target.clientId, target.kind, content)
    return plan.fatal ? { status: 'error', message: plan.fatal } : { status: 'checked', plan }
  } catch (error) {
    const state = failure(error)
    return { status: 'error', message: state.message }
  }
}
