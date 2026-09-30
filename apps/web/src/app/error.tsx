'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p>
        The server could not complete this request. Check that the database and Keycloak services
        are running, then try again.
      </p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
