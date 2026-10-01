'use client'

import { ErrorCard } from '@/components/StateCards'

/** Errors inside the app keep the sidebar, so the reader can go elsewhere. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorCard digest={error.digest} reset={reset} />
}
