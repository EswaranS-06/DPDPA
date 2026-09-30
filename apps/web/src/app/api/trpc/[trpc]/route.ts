import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, database } from '../../../../server/api'

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => ({ db: database().db }),
  })

export { handler as GET, handler as POST }
