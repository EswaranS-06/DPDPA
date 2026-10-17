// The library's clause tool (library/ui/clauses.js), ported: a rendered document as one numbered
// clause (14, 14.1, 14.1.1) to drop into another agreement, and clause packs built from sections
// of several documents. Tests compare it with the library's own tool.

const HEADING = /^(#{1,4})\s+(.*)$/
/** Sections that rarely belong inside another contract; left out by default. */
const DEFAULT_EXCLUDE =
  /^recitals$|revision history|document control|acknowledg|in witness|^signature|^declaration|^approval$|assessor section|for office use|clause library/i

/** Removes existing numbering and labels so the clause can be numbered afresh. */
export const cleanTitle = (title: string) =>
  String(title)
    .replace(/\*\*/g, '')
    .replace(
      /^(?:PART\s+[A-Z0-9-]+\s*[:.—-]\s*|Clause\s+[A-Z]*-?\d+[A-Z]?\s*[:.—-]\s*|ANNEX(?:URE)?\s+[A-Z0-9-]+\s*[:.—-]\s*|SCHEDULE\s+[A-Z0-9-]+\s*[:.—-]\s*|APPENDIX\s+[A-Z0-9-]+\s*[:.—-]\s*|[A-Z]{1,3}-\d+[A-Z]?\s*[:.—-]\s*|[A-Z]?\d+(?:\.\d+)*[.:)]?\s+|[A-Z]\.\s+)/i,
      '',
    )
    .replace(/\s*\((?:insert|internal|public|completed by|issued|sent|filed)[^)]*\)\s*$/i, '')
    .replace(/[.:\s]+$/, '')
    .trim()

const KEEP_CASE = [
  'DPDP',
  'DPO',
  'SDF',
  'DPIA',
  'RoPA',
  'CERT-In',
  'RBI',
  'SEBI',
  'IRDAI',
  'India',
  'Indian',
  'Board',
  'Act',
  'Rules',
  'SOP',
  'VPC',
  'CCTV',
  'HR',
  'IT',
  'ID',
  'KYC',
  'DSA',
  'DPA',
]

/** "DEFINITIONS AND INTERPRETATION" as "Definitions and interpretation", acronyms kept. */
export const sentenceCase = (title: string) => {
  if (!/[A-Z]/.test(title) || title !== title.toUpperCase()) return title
  let text = title.toLowerCase().replace(/^./, (c) => c.toUpperCase())
  for (const keep of KEEP_CASE) {
    text = text.replace(new RegExp(`\\b${keep.replace('-', '\\-')}\\b`, 'gi'), keep)
  }
  return text.replace(/^./, (c) => c.toUpperCase())
}

const originalNumber = (title: string) =>
  /^(\d+)[.:)]?\s/.exec(String(title).replace(/\*\*/g, ''))?.[1] ?? null

export type Section = {
  level: number
  title: string
  index: number
  parent: number | null
  depth: number
  path: string
  body: string
}

/** Splits Markdown into an ordered list of heading sections, each with its parent and path. */
export const parseSections = (markdown: string): { preamble: string; sections: Section[] } => {
  const raw: { level: number; title: string; lines: string[] }[] = []
  const preamble: string[] = []
  let current: { level: number; title: string; lines: string[] } | null = null
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence
    const match = !inFence ? HEADING.exec(line) : null
    if (match) {
      current = { level: (match[1] ?? '').length, title: (match[2] ?? '').trim(), lines: [] }
      raw.push(current)
    } else {
      ;(current ? current.lines : preamble).push(line)
    }
  }
  const stack: Section[] = []
  const sections = raw.map((item, index) => {
    while (stack.length && (stack[stack.length - 1]?.level ?? 0) >= item.level) stack.pop()
    const section: Section = {
      level: item.level,
      title: item.title,
      index,
      parent: stack.length ? (stack[stack.length - 1]?.index ?? null) : null,
      depth: stack.length,
      path: [...stack.map((entry) => entry.title), item.title].join(' › '),
      body: item.lines
        .join('\n')
        .replace(/^\s*---\s*$/gm, '')
        .trim(),
    }
    stack.push(section)
    return section
  })
  return { preamble: preamble.join('\n').trim(), sections }
}

/** The sections a clause takes unless chosen otherwise: all but the top heading and the excluded. */
export const defaultSelection = (parsed: { sections: Section[] }) => {
  const excluded = new Set<number>()
  const selected: string[] = []
  for (const section of parsed.sections) {
    if (section.parent !== null && excluded.has(section.parent)) {
      excluded.add(section.index)
      continue
    }
    if (section.level === 1 || DEFAULT_EXCLUDE.test(cleanTitle(section.title))) {
      if (section.level > 1) excluded.add(section.index)
      continue
    }
    selected.push(section.path)
  }
  return selected
}

/** "3.1 The processor shall…" under "3. PROCESSING" becomes "14.3.1 The processor shall…". */
const renumberBody = (body: string, original: string | null, number: string) => {
  if (!original) return body
  const pattern = new RegExp(`^(\\s*)(\\*\\*)?${original}\\.(\\d+(?:\\.\\d+)*)(\\*\\*)?(\\s)`, 'gm')
  return body.replace(
    pattern,
    (
      _,
      space: string,
      open: string | undefined,
      rest: string,
      close: string | undefined,
      gap: string,
    ) => `${space}${open || ''}${number}.${rest}${close || ''}${gap}`,
  )
}

const startsWithBlock = (text: string) =>
  /^(\||>|[-*+]\s|\d+\.\s|\d+(?:\.\d+)+\s|\([a-z0-9]+\)\s|[A-Z]\.\s|```|<|#|!\[)/.test(text.trim())

export type ClauseOptions = {
  number?: string
  title?: string
  intro?: string
  headingCase?: 'upper' | 'title'
}

/**
 * Builds one clause from sections, possibly of several documents. Each item's group is its
 * document; heading levels are normalised per document.
 */
export const buildClause = (
  items: readonly { section: Section; group: string }[],
  options: ClauseOptions = {},
) => {
  const number = String(options.number || '1').trim()
  const title = String(options.title || 'Data Protection').trim()
  const out = [
    `**${number}. ${options.headingCase === 'title' ? title : title.toUpperCase()}**`,
    '',
  ]
  if (options.intro?.trim()) out.push(options.intro.trim(), '')
  const minLevel: Record<string, number> = {}
  for (const { section, group } of items)
    minLevel[group] = Math.min(minLevel[group] ?? 9, section.level)
  const counters: number[] = []
  let lastGroup: string | null = null
  for (const { section, group } of items) {
    // A new source document continues at the top level.
    if (group !== lastGroup && lastGroup !== null) counters.length = 1
    lastGroup = group
    let depth = section.level - (minLevel[group] ?? section.level)
    // Never skip a numbering level.
    if (depth > counters.length) depth = counters.length
    counters.length = depth + 1
    counters[depth] = (counters[depth] || 0) + 1
    const no = [number, ...counters].join('.')
    const heading = sentenceCase(cleanTitle(section.title))
    const body = renumberBody(section.body, originalNumber(section.title), no)
    const blocks = body ? body.split(/\n{2,}/) : []
    if (blocks.length && !startsWithBlock(blocks[0] ?? '')) {
      out.push(`**${no} ${heading}.** ${blocks[0] ?? ''}`)
      if (blocks.length > 1) out.push('', blocks.slice(1).join('\n\n'))
    } else {
      out.push(`**${no} ${heading}.**`)
      if (body) out.push('', body)
    }
    out.push('')
  }
  return `${out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`
}

/** Wording replacements, one "old => new" per line, as the library's clause view applies them. */
export const applyReplacements = (markdown: string, rules: string) => {
  let out = markdown
  for (const line of String(rules || '').split('\n')) {
    const [from, to] = line.split(/=>|→/).map((part) => (part || '').trim())
    if (from) out = out.split(from).join(to || '')
  }
  return out
}

/** The clause titles and wording replacements the library suggests for each document. */
export const CLAUSE_TITLES: Record<string, string> = {
  V01: 'Data Protection',
  V02: 'Data Sharing',
  V04: 'Data Protection',
  V05: 'Transfer of Personal Data outside India',
  B01: 'Personal Data Breach',
  R01: 'Grievance Redressal',
  R02: 'Data Principal Rights',
  G02: 'Data Retention and Erasure',
  G04: 'Access Control',
  C02: 'Withdrawal of Consent',
  N01: 'Privacy',
}
export const CLAUSE_REPLACE: Record<string, string> = {
  V01: 'this DPA => this Clause',
  V04: 'this Rider => this Clause',
}

/** The library's clause-pack presets: which sections of which document each one takes. */
export const PACK_PRESETS = [
  {
    key: 'nda-msa',
    label: 'NDA / MSA data-protection clause',
    hint: 'Processor obligations from the DPDP rider (V04)',
    doc: 'V04',
    match: /^Clause DP-\d+/,
  },
  {
    key: 'breach',
    label: 'Breach notification only',
    hint: 'V04 DP-5',
    doc: 'V04',
    match: /^Clause DP-5\b/,
  },
  {
    key: 'cross-border',
    label: 'Cross-border transfer clauses',
    hint: 'V05 Part B + appendix',
    doc: 'V05',
    match: /^PART B|^Appendix CB/i,
  },
  {
    key: 'sharing',
    label: 'Controller-to-controller sharing terms',
    hint: 'V02 clauses 1–9',
    doc: 'V02',
    match: /^\d+\.\s/,
  },
  {
    key: 'full-dpa',
    label: 'Full DPA as one clause',
    hint: 'V01 clauses 1–14 + annexes',
    doc: 'V01',
    match: /^\d+\.\s|^ANNEX/i,
  },
] as const
