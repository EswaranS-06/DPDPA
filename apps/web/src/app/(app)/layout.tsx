import { ROLE_LABEL, type Principal } from '@duatf/core-access'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { AppNav } from '@/components/AppNav'
import { requireSession } from '@/server/auth'
import { navigationFor } from '@/server/navigation'
import styles from './shell.module.css'

export const dynamic = 'force-dynamic'

const roleSummary = (principal: Principal) => {
  const labels = [
    ...new Set(principal.assignments.map((assignment) => ROLE_LABEL[assignment.role])),
  ]
  return labels.length === 0 ? 'No role assigned' : labels.join(', ')
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, principal } = await requireSession()
  return (
    <div className={styles.frame}>
      <Link href="/" className={styles.brand}>
        <span className={styles.brandMark}>DUATF</span>
        <span className={styles.brandName}>DPDP compliance tracking</span>
      </Link>
      <header className={styles.top}>
        <form action="/search" method="get" role="search" className={styles.search}>
          <label htmlFor="site-search" className="visually-hidden">
            Search the knowledge base
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Search the knowledge base: s.8(6), OBL-CON-01, withdrawal"
          />
          <button type="submit">Search</button>
        </form>
        <div className={styles.user}>
          <div className={styles.userText}>
            <span className={styles.userName}>{user.displayName}</span>
            <span className={styles.userRole}>{roleSummary(principal)}</span>
          </div>
          <form action="/auth/logout" method="post">
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      <aside className={styles.rail}>
        <AppNav items={navigationFor(principal)} />
        <p className={styles.railNote}>
          ComplyX Cybersecurity Services. A working compliance framework, not legal advice.
        </p>
      </aside>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  )
}
