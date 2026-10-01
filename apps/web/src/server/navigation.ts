import { can, isFirmRole, type Principal } from '@duatf/core-access'
import type { ClientSummary } from '@duatf/feature-compliance-api'
import type { Navigation, NavGroup } from '@/components/shell/navigation'

/**
 * The sidebar for this user: the firm's own sections, the knowledge base and administration.
 * A client's sections are added by the shell while the user is inside that client.
 */
export const navigationFor = (principal: Principal, clients: ClientSummary[]): Navigation => {
  const firm = principal.assignments.some((assignment) => isFirmRole(assignment.role))
  const groups: NavGroup[] = []
  if (firm) {
    groups.push({
      label: null,
      links: [
        { href: '/', label: 'Overview', icon: 'overview', exact: true },
        { href: '/clients', label: 'Clients', icon: 'clients', exact: true },
      ],
    })
  }
  if (can(principal, 'kb.view')) {
    groups.push({
      label: 'Library',
      links: [{ href: '/knowledge-base', label: 'Knowledge base', icon: 'kb' }],
    })
  }
  if (can(principal, 'platform.admin')) {
    groups.push({
      label: 'Administration',
      links: [
        { href: '/admin/staff', label: 'Staff', icon: 'staff' },
        { href: '/admin/risk-bands', label: 'Risk bands', icon: 'bands' },
      ],
    })
  }
  return {
    firm,
    groups,
    clients: clients.map((client) => ({
      code: client.code,
      name: client.name,
      status: client.status,
    })),
  }
}
