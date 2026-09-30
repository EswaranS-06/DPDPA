import { TRPCError } from '@duatf/platform-trpc'
import { notFound } from 'next/navigation'

/** Shows the not-found page when the API reports a missing record. */
export const orNotFound = async <Result>(request: Promise<Result>): Promise<Result> => {
  try {
    return await request
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound()
    throw error
  }
}
