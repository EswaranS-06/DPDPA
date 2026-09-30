import { can, type Principal } from '@duatf/core-access'
import type { NavItem } from '@/components/AppNav'

/** The sections a user may open, in the order they appear in the rail. */
export const navigationFor = (principal: Principal): NavItem[] => {
  const items: NavItem[] = [{ href: '/', label: 'Home' }]
  if (can(principal, 'kb.view')) items.push({ href: '/knowledge-base', label: 'Knowledge base' })
  return items
}
