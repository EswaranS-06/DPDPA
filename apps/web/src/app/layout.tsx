import '@duatf/core-ui/tokens.css'
import './fonts.css'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { preload } from 'react-dom'

export const metadata: Metadata = {
  title: { default: 'DUATF', template: '%s | DUATF' },
  description: 'DPDP compliance assessment and tracking by Xyberu Cybersecurity Services.',
}

export const viewport: Viewport = { themeColor: '#f4f5f2' }

export default function RootLayout({ children }: { children: ReactNode }) {
  preload('/fonts/anek-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' })
  preload('/fonts/martel-400-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' })
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
