'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AppNav.module.css'

export type NavLink = { href: string; label: string }
export type NavItem = NavLink & { children?: readonly NavLink[] }

const isCurrent = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** Primary navigation; an item's sub-links show while the reader is inside that section. */
export const AppNav = ({ items }: { items: readonly NavItem[] }) => {
  const pathname = usePathname()
  return (
    <nav aria-label="Main" className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item) => {
          const inside =
            isCurrent(pathname, item.href) ||
            (item.children ?? []).some((child) => isCurrent(pathname, child.href))
          const exact = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={inside ? `${styles.link} ${styles.current}` : styles.link}
                aria-current={exact ? 'page' : undefined}
              >
                {item.label}
              </Link>
              {inside && item.children && (
                <ul className={styles.children}>
                  {item.children.map((child) => {
                    const current =
                      child.href === item.href
                        ? pathname === child.href
                        : isCurrent(pathname, child.href)
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={
                            current ? `${styles.child} ${styles.childCurrent}` : styles.child
                          }
                          aria-current={current ? 'page' : undefined}
                        >
                          {child.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
