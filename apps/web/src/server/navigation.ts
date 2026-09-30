import { can, type Principal } from '@duatf/core-access'
import { LIBRARY_LINKS } from '@duatf/feature-framework-library'
import type { NavItem } from '@/components/AppNav'

/** The sections a user may open, in the order they appear in the rail. */
export const navigationFor = (principal: Principal): NavItem[] => {
  const items: NavItem[] = [{ href: '/', label: 'Home' }]
  if (can(principal, 'kb.view')) {
    items.push({ href: '/library', label: 'Knowledge base', children: LIBRARY_LINKS.slice(1) })
  }
  return items
}
