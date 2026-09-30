/** Sections of the knowledge-base page that list items, in the order they are shown. */
export const KB_LIST_SECTIONS = [
  'law',
  'bases',
  'obligations',
  'controls',
  'questions',
  'domains',
  'sectors',
  'processes',
  'data-elements',
  'vocabularies',
  'playbooks',
] as const

/** Every section of the single knowledge-base page: the overview, then the lists. */
export const KB_SECTIONS = ['overview', ...KB_LIST_SECTIONS] as const

export type KbSection = (typeof KB_SECTIONS)[number]
export type KbListSection = (typeof KB_LIST_SECTIONS)[number]

export const KB_SECTION_LABEL: Record<KbSection, string> = {
  overview: 'Overview',
  law: 'The law',
  bases: 'Lawful bases',
  obligations: 'Obligations',
  controls: 'Controls',
  questions: 'Questions',
  domains: 'Domains',
  sectors: 'Sector overlays',
  processes: 'Process catalogue',
  'data-elements': 'Data elements',
  vocabularies: 'Vocabularies',
  playbooks: 'Playbooks',
}

export const KB_PATH = '/knowledge-base'

export const isKbSection = (value: string | undefined): value is KbSection =>
  (KB_SECTIONS as readonly string[]).includes(value ?? '')

/** Link to a section of the knowledge base, optionally to one item and with extra filters. */
export const kbHref = (
  section: KbSection,
  item?: string,
  extra: Record<string, string | undefined> = {},
): string => {
  const params = new URLSearchParams()
  if (section !== 'overview') params.set('section', section)
  if (item) params.set('item', item)
  for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value)
  const query = params.toString()
  return query ? `${KB_PATH}?${query}` : KB_PATH
}

export type RefKind =
  | 'obligation'
  | 'control'
  | 'question'
  | 'domain'
  | 'law'
  | 'basis'
  | 'sector'
  | 'process'
  | 'data-element'
  | 'vocabulary'
  | 'playbook'

const ROUTES: Record<RefKind, (code: string) => string> = {
  obligation: (code) => kbHref('obligations', code),
  control: (code) => kbHref('controls', code),
  question: (code) => kbHref('questions', code),
  domain: (code) => kbHref('domains', code),
  law: (code) => kbHref('law', code),
  basis: (code) => `${kbHref('bases')}#${code}`,
  sector: (code) => kbHref('sectors', code),
  process: (code) => kbHref('processes', code),
  'data-element': (code) => `${kbHref('data-elements')}#${code}`,
  vocabulary: (code) => kbHref('vocabularies', code),
  playbook: (code) => kbHref('playbooks', code),
}

/** Turns a stored "ref:kind/code" link target into an app route; other hrefs pass through. */
export const refHref = (href: string): string => {
  const match = /^ref:([a-z-]+)\/(.+)$/.exec(href)
  if (!match) return href
  const route = ROUTES[match[1] as RefKind] as ((code: string) => string) | undefined
  return route ? route(decodeURIComponent(match[2] ?? '')) : href
}
