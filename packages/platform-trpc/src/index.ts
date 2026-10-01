import type { Principal } from '@duatf/core-access'
import type { Database } from '@duatf/platform-db'
import { initTRPC, TRPCError } from '@trpc/server'

/** Request context shared by every feature router. principal is null for anonymous callers. */
export type ApiContext = {
  db: Database
  principal: Principal | null
  /** Read the open knowledge-base draft instead of the published release (editors only). */
  kbDraft?: boolean
}

const t = initTRPC.context<ApiContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory
export { TRPCError }

/** Procedures that need a signed-in user; ctx.principal is non-null inside. */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.principal) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please sign in.' })
  return next({ ctx: { ...ctx, principal: ctx.principal } })
})

export const notFound = (what: string): never => {
  throw new TRPCError({ code: 'NOT_FOUND', message: `${what} was not found.` })
}
