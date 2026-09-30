import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" style={{ padding: 'var(--space-6)' }}>
      <h1>Not found</h1>
      <p>This page does not exist, or you do not have access to it.</p>
      <p>
        <Link href="/">Go to your home page</Link>
      </p>
    </main>
  )
}
