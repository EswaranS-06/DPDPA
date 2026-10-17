import type { LibraryData, Registry, Template } from './library'

// The template grammar of ComplyX's DPDP template library (ADR-0010), ported from the library's
// own engine (library/ui/engine.js) so that both print the same document from the same template:
// INCLUDE, drafting notes, IF, REPEAT, comments, placeholders. Tests compare the two.

const PLACEHOLDER = /\[((?:[A-Z][A-Za-z0-9]*)(?:-[A-Za-z0-9]+)*)\](?!\()/g
const INCLUDE = /<!--\s*INCLUDE\s+([A-Za-z0-9-]+)\s*-->/g
const IF_OR_END = /<!--\s*(IF\s+[^>]*?|END IF)\s*-->/g
const REPEAT = /<!--\s*REPEAT\s+([A-Za-z0-9-]+)\s*-->\n?([\s\S]*?)<!--\s*END REPEAT\s*-->\n?/g
const COMMENT = /<!--[\s\S]*?-->/g
export const DOC_LEVEL_FIELDS = [
  'Document-Title',
  'Document-ID',
  'Document-Version',
  'Document-Owner',
  'Document-Classification',
] as const
const RULES_COMMENCEMENT = '2027-05-13'

export type FlagValue = boolean | string
export type CollectionRow = Record<string, string>

/** What a client's documents are filled from, in the shape the library names it. */
export type RenderState = {
  flags: Record<string, FlagValue>
  values: Record<string, string>
  collections: Record<string, CollectionRow[]>
  /** Document-level flags and values, by template ID. */
  docFlags?: Record<string, Record<string, FlagValue>>
  docValues?: Record<string, Record<string, string>>
}

export type RenderAnalysis = {
  fields: Set<string>
  collections: Set<string>
  emptyCollections: Set<string>
  collectionFields: Set<string>
  missing: string[]
}

const escapeHtml = (text: string) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const expandIncludes = (text: string, blocks: Record<string, string>, depth = 0): string =>
  depth > 4
    ? text
    : text.replace(INCLUDE, (_, name: string) =>
        blocks[name] !== undefined ? expandIncludes(blocks[name], blocks, depth + 1) : '',
      )

/** Drafting notes are block quotes that start "> **Drafting note": removed, or kept and marked. */
const handleDraftingNotes = (text: string, keep: boolean) => {
  const out: string[] = []
  let inNote = false
  for (const line of text.split('\n')) {
    if (line.startsWith('> **Drafting note')) {
      inNote = true
      if (keep) out.push(line.replace('> **Drafting note', '> **🛈 Drafting note'))
      continue
    }
    if (inNote && line.startsWith('>')) {
      if (keep) out.push(line)
      continue
    }
    inNote = false
    out.push(line)
  }
  return out.join('\n')
}

export const isTruthy = (value: unknown): boolean =>
  !(
    value === undefined ||
    value === null ||
    value === false ||
    value === '' ||
    value === 'None' ||
    value === 'false'
  )

const flagText = (value: FlagValue | undefined) =>
  value === undefined ? '' : typeof value === 'boolean' ? String(value) : value

export const evaluateCondition = (expr: string, flags: Record<string, FlagValue>): boolean => {
  const negated = /^NOT\s+([A-Za-z0-9-]+)$/.exec(expr)
  if (negated) return !isTruthy(flags[negated[1] ?? ''])
  const compared = /^([A-Za-z0-9-]+)\s*(==|!=)\s*([A-Za-z0-9-]+)$/.exec(expr)
  if (compared) {
    const actual = flagText(flags[compared[1] ?? ''])
    return compared[2] === '==' ? actual === compared[3] : actual !== compared[3]
  }
  return isTruthy(flags[expr.trim()])
}

const applyConditionals = (text: string, flags: Record<string, FlagValue>) => {
  let out = ''
  let last = 0
  const stack: boolean[] = []
  const visible = () => stack.every(Boolean)
  for (const match of text.matchAll(IF_OR_END)) {
    if (visible()) out += text.slice(last, match.index)
    last = match.index + match[0].length
    if (match[1] === 'END IF') stack.pop()
    else stack.push(evaluateCondition((match[1] ?? '').replace(/^IF\s+/, '').trim(), flags))
  }
  if (visible()) out += text.slice(last)
  return out.replace(/\n{3,}/g, '\n\n')
}

const formatValue = (value: unknown, inTable: boolean) => {
  const text = String(Array.isArray(value) ? value.join(', ') : value)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  if (inTable) return text.replace(/\|/g, '&#124;').replace(/\r?\n/g, '<br>')
  return text.replace(/\r?\n/g, '  \n')
}

/** Marker text uses entities so a later placeholder pass cannot match it again. */
const marker = (name: string, kind: 'missing' | 'collection') =>
  `<mark class="ph ph-${kind}" data-ph="${name}">&#91;${name}&#93;</mark>`

// Unfilled collection fields are parked as sentinels until the pass over single values is done.
const OPEN = String.fromCharCode(1)
const CLOSE = String.fromCharCode(2)
const SENTINEL = new RegExp(`${OPEN}([^${CLOSE}]+)${CLOSE}`, 'g')
const park = (name: string) => `${OPEN}${name}${CLOSE}`

type Lookup = (name: string) => string | null | undefined

/** Substitutes placeholders line by line, so table cells can be escaped safely. */
const substitute = (
  text: string,
  lookup: Lookup,
  onMissing: (name: string, whole: string) => string,
  found?: Set<string>,
) =>
  text
    .split('\n')
    .map((line) => {
      const inTable = line.trim().startsWith('|')
      return line.replace(PLACEHOLDER, (whole, name: string) => {
        const value = lookup(name)
        if (value === null) return whole
        if (found) found.add(name)
        if (value !== undefined && String(value).trim() !== '') return formatValue(value, inTable)
        return onMissing(name, whole)
      })
    })
    .join('\n')

const expandRepeats = (
  text: string,
  collections: Record<string, CollectionRow[]>,
  analysis: RenderAnalysis,
) =>
  text.replace(REPEAT, (_, name: string, body: string) => {
    const rows = (collections[name] ?? []).filter((row) =>
      Object.values(row).some((value) => String(value || '').trim()),
    )
    analysis.collections.add(name)
    const fields = new Set<string>()
    body.replace(PLACEHOLDER, (whole, field: string) => {
      fields.add(field)
      return whole
    })
    if (!rows.length) {
      analysis.emptyCollections.add(name)
      return substitute(body, () => '', park, analysis.collectionFields)
    }
    return rows
      .map((row) =>
        substitute(
          body,
          (field) => (fields.has(field) && field in row ? (row[field] ?? '') : null),
          park,
          analysis.collectionFields,
        ),
      )
      .join('')
  })

const todayIso = (today?: string) => today ?? new Date().toISOString().slice(0, 10)

export const buildFlags = (
  template: Template,
  state: RenderState,
  data: Pick<LibraryData, 'flags'>,
  today?: string,
): Record<string, FlagValue> => {
  const flags: Record<string, FlagValue> = { ...state.flags }
  for (const flag of data.flags.doc)
    if (flag.usedIn.includes(template.id)) flags[flag.name] = flag.default
  flags['Pre-May-2027'] = todayIso(today) < RULES_COMMENCEMENT
  Object.assign(flags, state.docFlags?.[template.id] ?? {})
  return flags
}

const DP_CATEGORY_LABELS: Record<string, string> = {
  'Attendant-Next-of-Kin': 'Attendant / Next of Kin',
  'Vendor-Representative': 'Vendor Representative',
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "2026-11-13" as "13 November 2026", the way the library's engine writes a date; other text unchanged. */
export const formatIsoDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  if (!match) return value
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? ''} ${match[1]}`
}

const makeRawLookup = (
  template: Template,
  state: RenderState,
  registry: Registry,
  flags: Record<string, FlagValue>,
  today?: string,
) => {
  const docValues = state.docValues?.[template.id] ?? {}
  const category = flags['DP-Category']
  const auto: Record<string, string> = {
    'DP-Category-Label':
      typeof category === 'string' && category && category !== 'Custom'
        ? (DP_CATEGORY_LABELS[category] ?? category)
        : '',
    // Public documents drop the internal parenthetical: "Privacy Notice (Master …)" → "Privacy Notice".
    'Document-Title': /^public/.test(template.publish)
      ? template.title.replace(/\s*\(.*\)\s*$/, '')
      : template.title,
    'Document-ID': template.id,
    'Document-Version': template.version || '1.0',
    'Last-Updated-Date': todayIso(today),
  }
  const resolve = (name: string, depth = 0): string => {
    if (depth > 3) return ''
    if (
      (DOC_LEVEL_FIELDS as readonly string[]).includes(name) &&
      String(docValues[name] ?? '').trim()
    ) {
      return docValues[name] ?? ''
    }
    const value = state.values[name]
    if (value !== undefined && String(value).trim() !== '') return value
    if (auto[name]) return auto[name]
    const fallback = registry[name]?.default
    if (typeof fallback === 'string' && fallback.startsWith('='))
      return resolve(fallback.slice(1), depth + 1)
    return ''
  }
  return resolve
}

const makeLookup = (
  template: Template,
  state: RenderState,
  data: LibraryData,
  today?: string,
): ((name: string) => string) => {
  const flags = buildFlags(template, state, data, today)
  const raw = makeRawLookup(template, state, data.registry, flags, today)
  return (name) => {
    const flag = flags[name]
    if (typeof flag === 'string' && !(name in state.values && String(state.values[name]).trim()))
      return flag
    const value = raw(name)
    return data.registry[name]?.type === 'date' ? formatIsoDate(value) : value
  }
}

export type RenderOptions = {
  /** "preview" marks missing values; "export" leaves them as [Name]. */
  mode?: 'preview' | 'export'
  showNotes?: boolean
  /** The day the document is dated, as YYYY-MM-DD; today unless given (tests fix it). */
  today?: string
}

/** Renders a template to Markdown, with what it used and what is still missing. */
export const render = (
  template: Template,
  data: LibraryData,
  state: RenderState,
  { mode = 'preview', showNotes = false, today }: RenderOptions = {},
): { markdown: string; analysis: RenderAnalysis } => {
  const analysis: RenderAnalysis = {
    fields: new Set(),
    collections: new Set(),
    emptyCollections: new Set(),
    collectionFields: new Set(),
    missing: [],
  }
  let text = expandIncludes(template.body, data.blocks)
  text = handleDraftingNotes(text, showNotes)
  text = applyConditionals(text, buildFlags(template, state, data, today))
  text = expandRepeats(text, state.collections, analysis)
  text = text.replace(COMMENT, '')
  const lookup = makeLookup(template, state, data, today)
  const onMissing = (name: string, whole: string) =>
    mode === 'preview' ? marker(name, 'missing') : whole
  text = substitute(text, lookup, onMissing, analysis.fields)
  text = text.replace(SENTINEL, (_, name: string) =>
    mode === 'preview' ? marker(name, 'collection') : `[${name}]`,
  )
  // Numbered sub-clauses on consecutive lines ("1.1 …", "(a) …", "A. …") become separate paragraphs.
  text = text.replace(
    /([^\n|])\n(?=(?:\*\*)?(?:\d+(?:\.\d+)+|\([a-z0-9]{1,4}\)|[A-Z]\.)\s)/g,
    '$1\n\n',
  )
  analysis.missing = [...analysis.fields].filter((name) => !String(lookup(name) || '').trim())
  return { markdown: `${text.trim()}\n`, analysis }
}

/** Reads a duration such as "30 days" or "72 hours" as days, the way the library's checks do. */
export const parseDurationDays = (value: unknown): number | null => {
  const match = /(\d+(?:\.\d+)?)\s*(working\s+day|business\s+day|day|hour|hr|week|month)/i.exec(
    typeof value === 'string' || typeof value === 'number' ? String(value) : '',
  )
  if (!match) return null
  const amount = parseFloat(match[1] ?? '')
  const unit = (match[2] ?? '').toLowerCase()
  if (unit.startsWith('hour') || unit === 'hr') return amount / 24
  if (unit.startsWith('week')) return amount * 7
  if (unit.startsWith('month')) return amount * 30
  if (unit.startsWith('working') || unit.startsWith('business')) return amount * 1.4
  return amount
}

export { escapeHtml }
