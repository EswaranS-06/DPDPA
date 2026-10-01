import Link from 'next/link'
import styles from './FilterTabs.module.css'

export type FilterTab = { href: string; label: string; count?: number; current: boolean }

/** Quick filters as tabs above a list; each is a link, so the view can be shared. */
export const FilterTabs = ({ tabs, label }: { tabs: FilterTab[]; label: string }) => (
  <nav aria-label={label}>
    <ul className={styles.tabs}>
      {tabs.map((tab) => (
        <li key={tab.href}>
          <Link
            href={tab.href}
            className={tab.current ? `${styles.tab} ${styles.current}` : styles.tab}
            aria-current={tab.current ? 'page' : undefined}
          >
            {tab.label}
            {tab.count === undefined ? null : <span className={styles.count}>{tab.count}</span>}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
)
