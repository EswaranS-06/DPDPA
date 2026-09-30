import { ROLE_DESCRIPTION, ROLE_LABEL } from '@duatf/core-access'
import { PageHeader } from '@duatf/core-ui'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/server/auth'
import styles from './home.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Home' }

export default async function Page() {
  const { user, principal } = await requireSession()
  return (
    <>
      <PageHeader
        title={`Welcome, ${user.displayName}`}
        lede="What you can see and do in DUATF depends on the roles below."
      />
      <section aria-labelledby="access" className={styles.section}>
        <h2 id="access" className={styles.heading}>
          Your access
        </h2>
        {principal.assignments.length === 0 ? (
          <p className={styles.note}>
            You can sign in, but no role has been given to you yet. Ask your DUATF administrator.
          </p>
        ) : (
          <ul className={styles.roles}>
            {principal.assignments.map((assignment) => (
              <li
                key={`${assignment.role}-${assignment.clientId ?? 'all'}-${assignment.departmentId ?? ''}`}
                className={styles.role}
              >
                <span className={styles.roleName}>{ROLE_LABEL[assignment.role]}</span>
                <span className={styles.roleScope}>
                  {assignment.clientId === null ? 'All clients' : 'One client'}
                  {assignment.departmentId ? ', one department' : ''}
                </span>
                <span className={styles.roleText}>{ROLE_DESCRIPTION[assignment.role]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="start" className={styles.section}>
        <h2 id="start" className={styles.heading}>
          Start here
        </h2>
        <ul className={styles.links}>
          <li>
            <Link href="/knowledge-base">Knowledge base</Link>
            <span>
              The DPDP Act and Rules, obligations, controls, the question bank and playbooks.
            </span>
          </li>
        </ul>
      </section>
    </>
  )
}
