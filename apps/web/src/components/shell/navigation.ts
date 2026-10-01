import type { ClientStatus } from '@duatf/platform-db'

/** Icon names cross the server/client boundary as strings; icons.ts maps them to Lucide. */
export type NavIcon =
  | 'overview'
  | 'clients'
  | 'kb'
  | 'staff'
  | 'bands'
  | 'clientHome'
  | 'assessments'
  | 'evidence'
  | 'findings'
  | 'risks'
  | 'actions'
  | 'reports'
  | 'departments'
  | 'people'

export type NavLink = { href: string; label: string; icon: NavIcon; exact?: boolean }
export type NavGroup = { label: string | null; links: NavLink[] }
export type NavClient = { code: string; name: string; status: ClientStatus }

export type Navigation = {
  /** True for ComplyX staff, who work across clients. */
  firm: boolean
  groups: NavGroup[]
  clients: NavClient[]
}

/** A client's sections, grouped by the work they hold. The same for every client. */
export const clientSections = (code: string): NavGroup[] => {
  const base = `/clients/${code}`
  return [
    {
      label: 'Compliance',
      links: [
        { href: base, label: 'Overview', icon: 'clientHome', exact: true },
        { href: `${base}/assessments`, label: 'Assessments', icon: 'assessments' },
        { href: `${base}/evidence`, label: 'Evidence', icon: 'evidence' },
      ],
    },
    {
      label: 'Risk and remediation',
      links: [
        { href: `${base}/findings`, label: 'Findings', icon: 'findings' },
        { href: `${base}/risks`, label: 'Risk register', icon: 'risks' },
        { href: `${base}/actions`, label: 'Remediation', icon: 'actions' },
      ],
    },
    {
      label: 'Reporting',
      links: [{ href: `${base}/reports`, label: 'Reports', icon: 'reports' }],
    },
    {
      label: 'Organisation',
      links: [
        { href: `${base}/departments`, label: 'Departments', icon: 'departments' },
        { href: `${base}/people`, label: 'People', icon: 'people' },
      ],
    },
  ]
}

/** The client code in a path such as /clients/NADALL/findings, or null. */
export const clientCodeIn = (pathname: string): string | null => {
  const match = /^\/clients\/([^/]+)/.exec(pathname)
  const code = match?.[1] ? decodeURIComponent(match[1]) : null
  return code && code !== 'new' ? code.toUpperCase() : null
}

export const isCurrentLink = (pathname: string, link: NavLink): boolean =>
  link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`)

export type Crumb = { label: string; href: string }

const SEGMENT_LABEL: Record<string, string> = {
  assessments: 'Assessments',
  evidence: 'Evidence',
  findings: 'Findings',
  risks: 'Risk register',
  actions: 'Remediation',
  reports: 'Reports',
  departments: 'Departments',
  people: 'People',
  edit: 'Edit profile',
  'knowledge-base': 'Knowledge base',
  admin: 'Administration',
  staff: 'Staff',
  'risk-bands': 'Risk bands',
  search: 'Search',
  new: 'Onboard client',
}

/** Where the reader is, from the path: Clients / Nadall / Findings / FND-NADALL-004. */
export const crumbsFor = (pathname: string, navigation: Navigation): Crumb[] => {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (parts.length === 0) return [{ label: navigation.firm ? 'Overview' : 'Home', href: '/' }]
  const crumbs: Crumb[] = []
  let href = ''
  parts.forEach((part, index) => {
    href += `/${encodeURIComponent(part)}`
    const previous = parts[index - 1]
    if (part === 'items' || part === 'executive' || (part === 'admin' && index === 0)) return
    if (previous === 'executive') {
      crumbs.push({ label: `Executive report, ${part}`, href })
      return
    }
    if (index === 0 && part === 'clients') {
      if (navigation.firm) crumbs.push({ label: 'Clients', href })
      return
    }
    if (previous === 'clients' && index === 1 && part !== 'new') {
      const client = navigation.clients.find((row) => row.code === part.toUpperCase())
      crumbs.push({ label: client?.name ?? part.toUpperCase(), href })
      return
    }
    crumbs.push({ label: SEGMENT_LABEL[part] ?? part, href })
  })
  return crumbs
}
