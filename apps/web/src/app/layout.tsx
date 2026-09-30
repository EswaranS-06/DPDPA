import '@duatf/core-ui/tokens.css'
import './fonts.css'
import './globals.css'
import { LibraryNav } from '@duatf/feature-framework-library'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { preload } from 'react-dom'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: { default: 'DUATF', template: '%s | DUATF' },
  description: 'DPDP Unified Assessment and Tracking Framework by ComplyX Cybersecurity Services.',
}

export const viewport: Viewport = { themeColor: '#f4f5f2' }

export default function RootLayout({ children }: { children: ReactNode }) {
  preload('/fonts/anek-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' })
  preload('/fonts/martel-400-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' })
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className={styles.skip}>
          Skip to content
        </a>
        <div className={styles.frame}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>DUATF</span>
            <span className={styles.brandName}>DPDP assessment framework</span>
          </Link>
          <div className={styles.top}>
            <form action="/search" method="get" role="search" className={styles.search}>
              <label htmlFor="site-search" className="visually-hidden">
                Search the framework
              </label>
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="Search by citation, code or words: s.8(6), OBL-CON-01, withdrawal"
              />
              <button type="submit">Search</button>
            </form>
          </div>
          <aside className={styles.rail}>
            <LibraryNav />
            <p className={styles.railNote}>
              ComplyX Cybersecurity Services. A working compliance framework, not legal advice.
            </p>
          </aside>
          <main id="main" className={styles.main}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
