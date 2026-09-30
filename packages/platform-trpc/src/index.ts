import type { Database } from '@duatf/platform-db'
import { initTRPC, TRPCError } from '@trpc/server'

/** Request context shared by every feature router. Authentication arrives in C3. */
export type ApiContext = {
  db: Database
}

const t = initTRPC.context<ApiContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory
export { TRPCError }

export const notFound = (what: string): never => {
  throw new TRPCError({ code: 'NOT_FOUND', message: `${what} was not found.` })
}
