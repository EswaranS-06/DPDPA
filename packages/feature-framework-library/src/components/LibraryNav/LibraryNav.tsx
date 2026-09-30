'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './LibraryNav.module.css'

/** Sections of the framework library, in reading order. */
export const LIBRARY_LINKS = [
  { href: '/library', label: 'Overview' },
  { href: '/library/law', label: 'The law' },
  { href: '/library/obligations', label: 'Obligations' },
  { href: '/library/controls', label: 'Controls' },
  { href: '/library/domains', label: 'Domains' },
  { href: '/library/sectors', label: 'Sector overlays' },
  { href: '/library/processes', label: 'Process catalogue' },
  { href: '/library/data-elements', label: 'Data elements' },
  { href: '/library/vocabularies', label: 'Vocabularies' },
  { href: '/library/playbooks', label: 'Playbooks' },
] as const

const isCurrent = (pathname: string, href: string) =>
  href === '/library'
    ? pathname === '/library'
    : pathname === href || pathname.startsWith(`${href}/`)

export const LibraryNav = () => {
  const pathname = usePathname()
  return (
    <nav aria-label="Framework library" className={styles.nav}>
      <ul className={styles.list}>
        {LIBRARY_LINKS.map((item) => {
          const current = isCurrent(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={current ? `${styles.link} ${styles.current}` : styles.link}
                aria-current={current ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
