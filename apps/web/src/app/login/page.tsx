import { safeReturnTo } from '@duatf/platform-identity'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { currentSession } from '@/server/auth'
import { firstValue, type SearchParams } from '@/server/searchParams'
import styles from './login.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in' }

const MESSAGES: Record<string, string> = {
  state_mismatch: 'The sign-in request expired or did not match. Please try again.',
  provider_error: 'Keycloak could not complete the sign-in. Please try again.',
  missing_email: 'Your Keycloak account has no email address. Ask your administrator.',
  not_registered: 'This account has not been given access to DUATF. Ask your administrator.',
  disabled: 'This account has been disabled. Ask your administrator.',
  signed_out: 'You have signed out.',
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const next = safeReturnTo(firstValue(params.next))
  if (await currentSession()) redirect(next)
  const code =
    firstValue(params.error) ??
    (firstValue(params.status) === 'signed_out' ? 'signed_out' : undefined)
  const message = code ? MESSAGES[code] : undefined
  return (
    <main id="main" className={styles.page}>
      <div className={styles.card}>
        <p className={styles.mark}>DUATF</p>
        <h1 className={styles.title}>DPDP compliance tracking</h1>
        <p className={styles.lede}>
          Assessments, evidence, findings and remediation for Xyberu clients. Sign in with your
          DUATF account; you will be asked for your authenticator code.
        </p>
        {message ? (
          <p className={code === 'signed_out' ? styles.info : styles.error} role="status">
            {message}
          </p>
        ) : null}
        <a className={styles.button} href={`/auth/login?next=${encodeURIComponent(next)}`}>
          Sign in
        </a>
        <p className={styles.small}>
          Xyberu Cybersecurity Services. A working compliance framework, not legal advice.
        </p>
      </div>
    </main>
  )
}
