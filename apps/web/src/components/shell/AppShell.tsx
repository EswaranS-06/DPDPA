'use client'

import { ArrowLeftRight, Menu, Search, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CommandPalette } from './CommandPalette'
import { NAV_ICON } from './icons'
import {
  clientCodeIn,
  clientSections,
  crumbsFor,
  isCurrentLink,
  type NavClient,
  type NavGroup,
  type Navigation,
} from './navigation'
import { UserMenu, type ShellUser } from './UserMenu'
import styles from './AppShell.module.css'

type AppShellProps = {
  navigation: Navigation
  user: ShellUser
  children: ReactNode
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

const NavGroups = ({ groups, pathname }: { groups: NavGroup[]; pathname: string }) =>
  groups.map((group, index) => (
    <div key={group.label ?? `group-${index}`} className={styles.group}>
      {group.label ? <p className={styles.groupLabel}>{group.label}</p> : null}
      <ul className={styles.links}>
        {group.links.map((link) => {
          const Icon = NAV_ICON[link.icon]
          const current = isCurrentLink(pathname, link)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={current ? `${styles.link} ${styles.current}` : styles.link}
                aria-current={current ? 'page' : undefined}
                title={link.label}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className={styles.linkLabel}>{link.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  ))

const ClientCard = ({ client, firm }: { client: NavClient; firm: boolean }) => (
  <div className={styles.clientCard}>
    <span className={styles.clientMark} aria-hidden="true">
      {initials(client.name)}
    </span>
    <span className={styles.clientText}>
      <span className={styles.clientName}>{client.name}</span>
      <span className={`code ${styles.clientCode}`}>{client.code}</span>
    </span>
    {firm ? (
      <Link href="/clients" className={styles.switch} title="Switch client">
        <ArrowLeftRight size={16} strokeWidth={1.75} aria-hidden="true" />
        <span className="visually-hidden">Switch client</span>
      </Link>
    ) : null}
  </div>
)

/** The application frame: sidebar, top bar with breadcrumbs and search, and the page. */
export const AppShell = ({ navigation, user, children }: AppShellProps) => {
  const pathname = usePathname()
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const sidebar = useRef<HTMLElement>(null)

  const code = clientCodeIn(pathname)
  const client =
    navigation.clients.find((row) => row.code === code) ??
    (!navigation.firm && navigation.clients.length === 1 ? navigation.clients[0] : undefined)
  const [lead, ...rest] = navigation.groups
  const sections = client ? clientSections(client.code) : []
  const crumbs = crumbsFor(pathname, navigation)

  const closeDrawer = useCallback(() => {
    setDrawer(false)
    menuButton.current?.focus()
  }, [])

  useEffect(() => {
    if (drawer) sidebar.current?.querySelector<HTMLElement>('a, button')?.focus()
  }, [drawer])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing =
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPalette(true)
      } else if (event.key === '/' && !typing) {
        event.preventDefault()
        setPalette(true)
      } else if (event.key === 'Escape' && drawer) {
        closeDrawer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer, closeDrawer])

  return (
    <div className={styles.frame} data-drawer={drawer ? 'open' : undefined}>
      <aside
        ref={sidebar}
        id="sidebar"
        className={`${styles.sidebar} no-print`}
        aria-label="Sidebar"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('a')) setDrawer(false)
        }}
      >
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.logo} aria-hidden="true">
              D
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>DUATF</span>
              <span className={styles.brandBy}>by ComplyX</span>
            </span>
          </Link>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Main" className={styles.nav}>
          {navigation.firm && lead ? <NavGroups groups={[lead]} pathname={pathname} /> : null}
          {client ? (
            <div className={styles.clientBlock} aria-label={`${client.name} sections`} role="group">
              <ClientCard client={client} firm={navigation.firm} />
              <NavGroups groups={sections} pathname={pathname} />
            </div>
          ) : null}
          <NavGroups groups={navigation.firm ? rest : navigation.groups} pathname={pathname} />
        </nav>
        <div className={styles.sidebarFooter}>
          <UserMenu user={user} />
        </div>
      </aside>
      <div className={`${styles.backdrop} no-print`} onClick={closeDrawer} aria-hidden="true" />

      <div className={styles.column}>
        <header className={`${styles.topbar} no-print`}>
          <button
            ref={menuButton}
            type="button"
            className={styles.menuButton}
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            aria-controls="sidebar"
            aria-expanded={drawer}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <ol>
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1
                return (
                  <li key={crumb.href}>
                    {last ? (
                      <span aria-current="page">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href}>{crumb.label}</Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
          <button
            type="button"
            className={styles.searchButton}
            onClick={() => setPalette(true)}
            aria-keyshortcuts="Control+K Meta+K"
          >
            <Search size={16} strokeWidth={2} aria-hidden="true" />
            <span className={styles.searchText}>Search clients, findings, questions</span>
            <kbd className={styles.kbd}>Ctrl K</kbd>
          </button>
        </header>
        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        navigation={navigation}
        client={client ?? null}
      />
    </div>
  )
}
