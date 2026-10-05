'use client'

import {
  ChevronsUpDown,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Rows3,
  Sun,
  SunMoon,
  Rows4,
} from 'lucide-react'
import { useState } from 'react'
import {
  DENSITIES,
  DENSITY_COOKIE,
  DENSITY_LABEL,
  THEME_COOKIE,
  THEME_LABEL,
  THEMES,
  type Density,
  type Theme,
} from './display'
import styles from './AppShell.module.css'

export type ShellUser = {
  name: string
  roles: string
  initials: string
  /** The saved display preferences, read from cookies on the server. */
  theme: Theme
  density: Density
}

const THEME_ICON = { system: Monitor, light: Sun, dark: Moon, contrast: SunMoon } as const
const DENSITY_ICON = { comfortable: Rows3, compact: Rows4 } as const

const YEAR = 60 * 60 * 24 * 365

/** Applies a display preference to the page now and keeps it for the next visit. */
const apply = (preference: 'theme' | 'density', value: string) => {
  document.documentElement.dataset[preference] = value
  const cookie = preference === 'theme' ? THEME_COOKIE : DENSITY_COOKIE
  document.cookie = `${cookie}=${value}; Path=/; Max-Age=${YEAR}; SameSite=Lax`
}

/** The signed-in person, their display preferences and sign out, at the foot of the sidebar. */
export const UserMenu = ({ user }: { user: ShellUser }) => {
  const [theme, setTheme] = useState<Theme>(user.theme)
  const [density, setDensity] = useState<Density>(user.density)

  const chooseTheme = (next: Theme) => {
    setTheme(next)
    apply('theme', next)
  }
  const chooseDensity = (next: Density) => {
    setDensity(next)
    apply('density', next)
  }

  return (
    <>
      <button type="button" className={styles.userButton} popoverTarget="user-menu">
        <span className={styles.avatar} aria-hidden="true">
          {user.initials}
        </span>
        <span className={styles.userText}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{user.roles}</span>
        </span>
        <ChevronsUpDown className={styles.userChevron} size={16} aria-hidden="true" />
        <span className="visually-hidden">, open account and display settings</span>
      </button>
      <div id="user-menu" popover="auto" className={styles.userMenu}>
        <div className={styles.menuHeader}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{user.roles}</span>
        </div>
        <fieldset className={styles.menuGroup}>
          <legend>Theme</legend>
          {THEMES.map((option) => {
            const Icon = THEME_ICON[option]
            return (
              <label key={option} className={styles.menuOption}>
                <input
                  type="radio"
                  name="theme"
                  value={option}
                  checked={theme === option}
                  onChange={() => chooseTheme(option)}
                />
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                {THEME_LABEL[option]}
              </label>
            )
          })}
        </fieldset>
        <fieldset className={styles.menuGroup}>
          <legend>Table density</legend>
          {DENSITIES.map((option) => {
            const Icon = DENSITY_ICON[option]
            return (
              <label key={option} className={styles.menuOption}>
                <input
                  type="radio"
                  name="density"
                  value={option}
                  checked={density === option}
                  onChange={() => chooseDensity(option)}
                />
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                {DENSITY_LABEL[option]}
              </label>
            )
          })}
        </fieldset>
        <div className={styles.menuGroup}>
          <a href="/account/password" className={styles.signOut}>
            <KeyRound size={16} strokeWidth={1.75} aria-hidden="true" />
            Change password
          </a>
        </div>
        <form action="/auth/logout" method="post" className={styles.menuGroup}>
          <button type="submit" className={styles.signOut}>
            <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </>
  )
}
