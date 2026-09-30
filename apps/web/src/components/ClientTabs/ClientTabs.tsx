'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './ClientTabs.module.css'

export type ClientTab = { href: string; label: string }

/** Tabs across the top of a client's pages; the first tab matches only exactly. */
export const ClientTabs = ({ tabs }: { tabs: ClientTab[] }) => {
  const pathname = usePathname()
  return (
    <nav aria-label="Client sections">
      <ul className={styles.tabs}>
        {tabs.map((tab, index) => {
          const current = index === 0 ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={current ? `${styles.tab} ${styles.current}` : styles.tab}
                aria-current={current ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
