import { isoDate } from '@duatf/core-utils'
import {
  createFrameworkLibraryApi,
  frameworkLibraryRouter,
  type FrameworkLibraryApi,
} from '@duatf/feature-framework-library-api'
import { router } from '@duatf/platform-trpc'
import { requireSession } from './auth'
import { database } from './runtime'

export const appRouter = router({ framework: frameworkLibraryRouter })

/**
 * The knowledge-base API for the signed-in user; redirects to sign-in otherwise. draft reads
 * the open draft release instead of the published one (only for editors; ignored otherwise).
 */
export const libraryApi = async (
  options: { draft?: boolean } = {},
): Promise<FrameworkLibraryApi> => {
  const { principal } = await requireSession()
  return createFrameworkLibraryApi({ db: database().db, principal, kbDraft: options.draft })
}

/** Today's date in India, used for commencement status. */
export const today = () => isoDate(new Date())
