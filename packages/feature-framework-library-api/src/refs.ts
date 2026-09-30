export type RefKind =
  | 'obligation'
  | 'control'
  | 'domain'
  | 'law'
  | 'basis'
  | 'sector'
  | 'process'
  | 'data-element'
  | 'vocabulary'
  | 'playbook'

const ROUTES: Record<RefKind, (code: string) => string> = {
  obligation: (code) => `/library/obligations/${code}`,
  control: (code) => `/library/controls/${code}`,
  domain: (code) => `/library/domains/${code}`,
  law: (code) => `/library/law/${code}`,
  basis: (code) => `/library/law/bases#${code}`,
  sector: (code) => `/library/sectors/${code}`,
  process: (code) => `/library/processes/${code}`,
  'data-element': (code) => `/library/data-elements#${code}`,
  vocabulary: (code) => `/library/vocabularies/${code}`,
  playbook: (code) => `/library/playbooks/${code}`,
}

/** Turns a stored "ref:kind/code" link target into an app route; other hrefs pass through. */
export const refHref = (href: string): string => {
  const match = /^ref:([a-z-]+)\/(.+)$/.exec(href)
  if (!match) return href
  const route = ROUTES[match[1] as RefKind] as ((code: string) => string) | undefined
  return route ? route(encodeURIComponent(decodeURIComponent(match[2] ?? ''))) : href
}
