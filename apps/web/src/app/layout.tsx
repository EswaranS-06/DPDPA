import '@duatf/core-ui/tokens.css'
import './fonts.css'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { preload } from 'react-dom'
import { DENSITY_COOKIE, THEME_COOKIE, asDensity, asTheme } from '@/components/shell/display'

export const metadata: Metadata = {
  title: { default: 'DUATF', template: '%s | DUATF' },
  description: 'DPDP compliance assessment and tracking by ComplyX Cybersecurity Services.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1420' },
  ],
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  preload('/fonts/inter-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' })
  const saved = await cookies()
  const theme = asTheme(saved.get(THEME_COOKIE)?.value)
  const density = asDensity(saved.get(DENSITY_COOKIE)?.value)
  return (
    <html lang="en-IN" data-theme={theme} data-density={density}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
