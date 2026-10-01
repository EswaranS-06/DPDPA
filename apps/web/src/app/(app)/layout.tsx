import { ROLE_LABEL, type Principal } from '@duatf/core-access'
import { listClients } from '@duatf/feature-compliance-api'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/shell/AppShell'
import { DENSITY_COOKIE, THEME_COOKIE, asDensity, asTheme } from '@/components/shell/display'
import { navigationFor } from '@/server/navigation'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

const roleSummary = (principal: Principal) => {
  const labels = [
    ...new Set(principal.assignments.map((assignment) => ROLE_LABEL[assignment.role])),
  ]
  return labels.length === 0 ? 'No role assigned' : labels.join(', ')
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await serviceContext()
  const { user, principal } = ctx.session
  const [clients, saved] = await Promise.all([listClients(ctx), cookies()])
  return (
    <AppShell
      navigation={navigationFor(principal, clients)}
      user={{
        name: user.displayName,
        roles: roleSummary(principal),
        initials: initialsOf(user.displayName),
        theme: asTheme(saved.get(THEME_COOKIE)?.value),
        density: asDensity(saved.get(DENSITY_COOKIE)?.value),
      }}
    >
      {children}
    </AppShell>
  )
}
