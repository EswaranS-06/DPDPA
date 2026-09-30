import { can, isFirmRole, type Principal } from '@duatf/core-access'
import type { NavItem } from '@/components/AppNav'

/** The sections a user may open, in the order they appear in the rail. */
export const navigationFor = (principal: Principal): NavItem[] => {
  const firm = principal.assignments.some((assignment) => isFirmRole(assignment.role))
  const items: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/clients', label: firm ? 'Clients' : 'My organisation' },
  ]
  if (can(principal, 'kb.view')) items.push({ href: '/knowledge-base', label: 'Knowledge base' })
  if (can(principal, 'platform.admin')) {
    items.push({ href: '/admin/staff', label: 'Staff' })
    items.push({ href: '/admin/risk-bands', label: 'Risk bands' })
  }
  return items
}
