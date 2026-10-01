import { Callout } from '@duatf/core-ui'
import { safeReturnTo } from '@duatf/platform-identity'
import { KeyRound, LogIn } from 'lucide-react'
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
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            D
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>DUATF</span>
            <span className={styles.brandBy}>by ComplyX</span>
          </span>
        </div>
        <h1 className={styles.title}>Sign in to DUATF</h1>
        <p className={styles.lede}>
          DPDP compliance assessments, evidence, findings and remediation for ComplyX clients.
        </p>
        {message ? (
          <Callout
            tone={code === 'signed_out' ? 'success' : 'danger'}
            role={code === 'signed_out' ? 'status' : 'alert'}
          >
            <p>{message}</p>
          </Callout>
        ) : null}
        <a className={styles.button} href={`/auth/login?next=${encodeURIComponent(next)}`}>
          <LogIn size={18} aria-hidden="true" />
          Sign in with your DUATF account
        </a>
        <p className={styles.note}>
          <KeyRound size={14} aria-hidden="true" />
          You will be asked for the code from your authenticator app.
        </p>
        <p className={styles.small}>
          ComplyX Cybersecurity Services. A working compliance framework, not legal advice.
        </p>
      </div>
    </main>
  )
}
