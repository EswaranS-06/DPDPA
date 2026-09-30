import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h1>This page is not in the framework</h1>
      <p>
        The code or address may be mistyped, or the record belongs to a different framework release.
      </p>
      <p>
        <Link href="/search">Search the framework</Link> or go back to the{' '}
        <Link href="/">overview</Link>.
      </p>
    </div>
  )
}
