import { can } from '@duatf/core-access'
import { openDraft, type AuthoringContext } from '@duatf/feature-framework-library-api'
import { cookies } from 'next/headers'
import { requireSession } from './auth'
import { database } from './runtime'

/** Whether an editor reads the open draft or the published release on the knowledge-base page. */
export const KB_VIEW_COOKIE = 'duatf-kb-view'

/** The signed-in user as a knowledge-base author. */
export const authoringContext = async (): Promise<AuthoringContext> => {
  const { principal } = await requireSession()
  return { db: database().db, principal }
}

/**
 * True when this editor chose to read the draft and a draft is open. Readers without the edit
 * capability always see the published release, whatever the cookie says.
 */
export const viewingDraft = async (): Promise<boolean> => {
  const { principal } = await requireSession()
  if (!can(principal, 'kb.edit')) return false
  if ((await cookies()).get(KB_VIEW_COOKIE)?.value !== 'draft') return false
  return Boolean(await openDraft(database().db))
}
