import { Callout } from '@duatf/core-ui'
import { safeReturnTo } from '@duatf/platform-identity'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/forms/AccountForms'
import { currentSession } from '@/server/auth'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { signInAction } from './actions'
import styles from './login.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in' }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const next = safeReturnTo(firstValue(params.next))
  if (await currentSession()) redirect(next)
  const signedOut = firstValue(params.status) === 'signed_out'
  return (
    <main id="main" className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            D
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>DUATF</span>
            <span className={styles.brandBy}>Self-assessment, by ComplyX</span>
          </span>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.lede}>
          Your DPDP assessments: departments, questions, answers, evidence, findings and
          remediation, run by you.
        </p>
        {signedOut ? (
          <Callout tone="success" role="status">
            <p>You have signed out.</p>
          </Callout>
        ) : null}
        <SignInForm action={signInAction} next={next} />
        <p className={styles.small}>
          ComplyX Cybersecurity Services. A working compliance framework, not legal advice.
        </p>
      </div>
    </main>
  )
}
