'use server'

import {
  discardDraft,
  isEditableSection,
  kbHref,
  KB_DRAFT_PATH,
  KB_PATH,
  markReviewed,
  publishDraft,
  removeEntry,
  saveEntry,
  startDraft,
  suggestObligations,
  type EditableSection,
} from '@duatf/feature-framework-library-api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cookieSecure } from '@/server/auth'
import { authoringContext, KB_VIEW_COOKIE } from '@/server/knowledgeBase'
import { failure, formValues, type FormState } from '@/server/services'

const LIST_ONLY: readonly EditableSection[] = ['bases', 'data-elements']

/** Where an entry shows in the knowledge base: its own view, or its row in a list. */
const entryView = (section: EditableSection, code: string) =>
  LIST_ONLY.includes(section)
    ? `${kbHref(section)}#${encodeURIComponent(code)}`
    : kbHref(section, code)

const setView = async (view: 'draft' | 'published') => {
  ;(await cookies()).set(KB_VIEW_COOKIE, view, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    maxAge: 60 * 60 * 24 * 30,
  })
}

/** Text fields of an entry form; checkbox groups arrive as lists. */
const entryInput = (formData: FormData): Record<string, string | string[]> => {
  const input: Record<string, string | string[]> = {}
  for (const key of new Set(formData.keys())) {
    if (key.startsWith('$') || key === 'intent') continue
    const all = formData.getAll(key).filter((value): value is string => typeof value === 'string')
    input[key] = all.length > 1 ? all : (all[0] ?? '')
  }
  return input
}

/** Form values as text; lists become one value per line, as the form reads them back. */
const asValues = (input: Record<string, string | string[]>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join('\n') : value,
    ]),
  )

/** Switches the knowledge-base page between the published release and the open draft. */
export const setKbViewAction = async (formData: FormData): Promise<void> => {
  const view = formData.get('view') === 'draft' ? 'draft' : 'published'
  await setView(view)
  const next = formData.get('next')
  redirect(typeof next === 'string' && next.startsWith(KB_PATH) ? next : KB_PATH)
}

export const startDraftAction = async (_: FormState, formData: FormData): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await startDraft(await authoringContext(), values)
  } catch (error) {
    return failure(error, values)
  }
  await setView('draft')
  redirect(KB_DRAFT_PATH)
}

export const publishDraftAction = async (_: FormState, formData: FormData): Promise<FormState> => {
  const values = formValues(formData)
  let version: string
  try {
    version = (await publishDraft(await authoringContext(), values)).version
  } catch (error) {
    return failure(error, values)
  }
  await setView('published')
  redirect(`${KB_DRAFT_PATH}?published=${encodeURIComponent(version)}`)
}

export const discardDraftAction = async (_: FormState): Promise<FormState> => {
  let version: string
  try {
    version = (await discardDraft(await authoringContext())).version
  } catch (error) {
    return failure(error)
  }
  await setView('published')
  redirect(`${KB_DRAFT_PATH}?discarded=${encodeURIComponent(version)}`)
}

export const saveEntryAction = async (
  section: string,
  code: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  if (!isEditableSection(section)) return { status: 'error', message: 'Unknown section.' }
  const input = entryInput(formData)
  const values = asValues(input)
  const ctx = await authoringContext()
  if (formData.get('intent') === 'suggest') {
    try {
      const codes = await suggestObligations(ctx, input)
      return {
        status: 'success',
        message: `${codes.length} ${codes.length === 1 ? 'obligation is' : 'obligations are'} now ticked, from the lawful basis and the facts. Adjust the list, then save.`,
        values: { ...values, obligationCodes: codes.join('\n') },
      }
    } catch (error) {
      return failure(error, values)
    }
  }
  let saved: string
  try {
    saved = (await saveEntry(ctx, section, input, code ?? undefined)).code
  } catch (error) {
    return failure(error, values)
  }
  await setView('draft')
  redirect(entryView(section, saved))
}

export const removeEntryAction = async (
  section: string,
  code: string,
  _: FormState,
): Promise<FormState> => {
  if (!isEditableSection(section)) return { status: 'error', message: 'Unknown section.' }
  try {
    await removeEntry(await authoringContext(), section, code)
  } catch (error) {
    return failure(error)
  }
  await setView('draft')
  redirect(kbHref(section))
}

export const markReviewedAction = async (
  section: string,
  code: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  if (!isEditableSection(section)) return { status: 'error', message: 'Unknown section.' }
  const values = formValues(formData)
  try {
    await markReviewed(await authoringContext(), section, code, values)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(KB_PATH, 'layout')
  return { status: 'success', message: `${code} is marked as reviewed.` }
}
