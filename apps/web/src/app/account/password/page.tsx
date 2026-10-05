import { Callout } from '@duatf/core-ui'
import { MIN_PASSWORD_LENGTH } from '@duatf/platform-identity'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChangePasswordForm } from '@/components/forms/AccountForms'
import { requireSession } from '@/server/auth'
import { changePasswordAction } from '../../login/actions'
import styles from '../../login/login.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Change password' }

export default async function Page() {
  const session = await requireSession()
  const first = session.user.mustChangePassword
  return (
    <main id="main" className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{first ? 'Choose your password' : 'Change password'}</h1>
        {first ? (
          <Callout tone="neutral">
            <p>
              You signed in with a one-time password. Choose your own before you continue; other
              sessions of this account are signed out.
            </p>
          </Callout>
        ) : (
          <p className={styles.lede}>
            Signed in as {session.user.displayName}. Other sessions of this account are signed out
            when the password changes.
          </p>
        )}
        <ChangePasswordForm action={changePasswordAction} minLength={MIN_PASSWORD_LENGTH} />
        {first ? null : (
          <p className={styles.small}>
            <Link href="/">Back to DUATF</Link>
          </p>
        )}
      </div>
    </main>
  )
}
