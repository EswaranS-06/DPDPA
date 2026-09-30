import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/api'
import { currentSession } from '@/server/auth'
import { database } from '@/server/runtime'

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: async () => ({
      db: database().db,
      principal: (await currentSession())?.principal ?? null,
    }),
  })

export { handler as GET, handler as POST }
