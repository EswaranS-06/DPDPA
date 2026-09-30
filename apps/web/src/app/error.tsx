'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert">
      <h1>The framework could not be loaded</h1>
      <p>
        The server could not read the framework database. Check that the database service is
        running, then try again.
      </p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
