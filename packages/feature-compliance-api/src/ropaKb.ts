import {
  categoryInfo,
  CATEGORY_CODES,
  LEVELS,
  TRANSFER_ANSWERS,
  type Level,
  type TransferAnswer,
} from './personalData'

// The knowledge base's RoPA answer lists (ADR-0008) and the rules that turn what an assessor
// typed, picked or imported into those answers. A closed list refuses anything else; an open list
// keeps other text as typed. Pure, so the browser uses the same rules (loadRopaKb is in ropa.ts).

/** The ropa-* vocabularies, by the RoPA field they answer. */
export const ROPA_LISTS = {
  principals: 'ropa-data-principals',
  sources: 'ropa-sources',
  recipients: 'ropa-recipients',
  systems: 'ropa-systems',
  retention: 'ropa-retention',
  deletion: 'ropa-deletion',
  security: 'ropa-security',
  consent: 'ropa-consent-status',
  names: 'ropa-data-element-names',
  fields: 'ropa-fields',
} as const
export type RopaList = keyof typeof ROPA_LISTS

export type RopaAnswer = {
  value: string
  meaning: string | null
  extra: Record<string, string>
}

export type RopaBasis = { code: string; name: string; reference: string; label: string }

export type RopaElement = {
  code: string
  title: string
  /** What a RoPA calls it, e.g. "Bank details". */
  name: string
  category: string
  level: Level
  personalData: boolean
}

export type RopaProcess = {
  code: string
  title: string
  sectorCode: string
  department: string
  typicalSystems: string[]
  typicalLawfulBasis: string[]
  purpose: string | null
  elements: string[]
  principals: string[]
  sources: string[]
  internal: string[]
  processors: string[]
  recipients: string[]
  retention: string | null
  deletion: string | null
  security: string[]
}

export type RopaKb = {
  releaseVersion: string
  lists: Record<RopaList, RopaAnswer[]>
  /** The client's sector retention periods the knowledge base is sure of. */
  sectorRetention: RopaAnswer[]
  bases: RopaBasis[]
  elements: RopaElement[]
  /** Catalogue processes common to all sectors and of the client's sector. */
  processes: RopaProcess[]
}

/** Lower case, "&" as "and", punctuation as spaces: how two spellings are compared. */
export const spellingKey = (text: string) =>
  text
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

export type Matcher = (text: string) => string | undefined

/** Matches any of the spellings to its value. */
export const matcherOf = (entries: Iterable<[string, string[]]>): Matcher => {
  const known = new Map<string, string>()
  for (const [value, spellings] of entries) {
    for (const spelling of [value, ...spellings]) {
      const key = spellingKey(spelling)
      if (key && !known.has(key)) known.set(key, value)
    }
  }
  return (text) => known.get(spellingKey(text))
}

const alsoAccepts = (answer: RopaAnswer) =>
  (answer.extra['Also accepts'] ?? '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)

export const answerMatcher = (answers: readonly RopaAnswer[]): Matcher =>
  matcherOf(answers.map((answer) => [answer.value, alsoAccepts(answer)]))

/**
 * Splits "A; B" (one per line works too) into answers. A piece that isn't an answer as a whole
 * is split on commas when every part is one, so "Name, PAN, bank details" reads as three.
 */
export const splitAnswers = (text: string, match: Matcher): string[] =>
  text
    .split(/[;\n]/)
    .map((piece) => piece.trim())
    .filter(Boolean)
    .flatMap((piece) => {
      if (match(piece) || !piece.includes(',')) return [piece]
      const parts = piece
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
      return parts.every((part) => match(part)) ? parts : [piece]
    })

export const basisLabel = (row: { code: string; name: string; reference: string }) =>
  row.name.includes(row.reference) || /\(s\.\d/.test(row.name)
    ? row.name
    : `${row.name} (${row.reference})`

export const basisMatcher = (bases: readonly RopaBasis[]): Matcher =>
  matcherOf(
    bases.map((row) => [
      row.code,
      [row.label, row.name, row.reference, ...(row.code === 'consent' ? ['Consent'] : [])],
    ]),
  )

/** Data elements by code, title or RoPA name (and the names list's other spellings). */
export const elementMatcher = (kb: Pick<RopaKb, 'elements' | 'lists'>): Matcher =>
  matcherOf([
    ...kb.lists.names.flatMap((answer): [string, string[]][] => {
      const code = answer.meaning
      return code ? [[code, [answer.value, ...alsoAccepts(answer)]]] : []
    }),
    ...kb.elements.map((element): [string, string[]] => [
      element.code,
      [element.title, element.name],
    ]),
  ])

// --- Normalising an activity ---------------------------------------------------------------------

export type ActivityElement = {
  code: string | null
  title: string
  category: string
  level: Level
}

/** A processing activity in stored form: list answers as their answer text. */
export type ActivityValues = {
  departmentCode: string
  name: string
  templateCode: string | null
  purpose: string | null
  lawfulBases: string[]
  lawReference: string | null
  principals: string[]
  elements: ActivityElement[]
  sources: string[]
  systems: string[]
  internalRecipients: string[]
  processors: string[]
  recipients: string[]
  retention: string | null
  deletion: string | null
  security: string[]
  transfersAbroad: TransferAnswer
  countries: string | null
  consentStatus: string | null
  owner: string | null
  notes: string | null
}

type RawElement = string | { code?: unknown; title?: unknown; category?: unknown; level?: unknown }

/** What a form, an import row or a catalogue process gives for an activity. */
export type RawActivity = {
  department?: unknown
  name?: unknown
  templateCode?: unknown
  purpose?: unknown
  lawfulBases?: unknown
  lawReference?: unknown
  principals?: unknown
  elements?: unknown
  sources?: unknown
  systems?: unknown
  internalRecipients?: unknown
  processors?: unknown
  recipients?: unknown
  retention?: unknown
  deletion?: unknown
  security?: unknown
  transfersAbroad?: unknown
  countries?: unknown
  consentStatus?: unknown
  owner?: unknown
  notes?: unknown
}

/** The key a department's own (non-knowledge-base) element is held under, by its title. */
export const ownKey = (title: string) => `own:${title.toLowerCase()}`

/** The client's side: its departments and what each already holds. */
export type ActivityScope = {
  kb: RopaKb
  departments: { code: string; name: string }[]
  /** Department code -> the category and level it gives each element (by code, or ownKey). */
  inventory: Map<string, Map<string, { category: string; level: Level }>>
}

export type Normalised = {
  values: ActivityValues
  errors: Record<string, string>
  warnings: Record<string, string>
}

/** Field names as the RoPA shows them, for messages. */
export const ACTIVITY_LABELS: Record<keyof ActivityValues, string> = {
  departmentCode: 'Department',
  name: 'Processing activity',
  templateCode: 'Catalogue process',
  purpose: 'Purpose',
  lawfulBases: 'Lawful basis',
  lawReference: 'Law relied on',
  principals: 'Data principals',
  elements: 'Personal data',
  sources: 'Source of data',
  systems: 'Systems',
  internalRecipients: 'Internal recipients',
  processors: 'Processors',
  recipients: 'Other recipients',
  retention: 'Retention period',
  deletion: 'Deletion',
  security: 'Security measures',
  transfersAbroad: 'Cross-border transfer',
  countries: 'Countries',
  consentStatus: 'Consent status',
  owner: 'Owner or DPO contact',
  notes: 'Notes',
}

export const TRANSFER_TEXT: Record<TransferAnswer, string> = {
  no: 'No',
  yes: 'Yes',
  unknown: 'Not yet known',
}

const text = (value: unknown) =>
  typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''

const quoted = (items: readonly string[]) => items.map((item) => `“${item}”`).join(', ')

const uniqueByKey = (items: readonly string[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = spellingKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** The pieces of a list field: an array as given, text split into answers. */
const piecesOf = (value: unknown, match: Matcher): string[] =>
  Array.isArray(value)
    ? value.map(text).filter(Boolean)
    : typeof value === 'string'
      ? splitAnswers(value, match)
      : []

/**
 * Turns raw answers into stored values. Closed lists (department, lawful basis, data principals,
 * sources, deletion, transfer, consent status, internal recipients, catalogue process) refuse
 * what they don't know; open lists keep it as typed, with a warning.
 */
export const normaliseActivity = (raw: RawActivity, scope: ActivityScope): Normalised => {
  const { kb } = scope
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}
  const fail = (field: keyof ActivityValues, message: string) => {
    errors[field] ??= message
  }
  const limit = (field: keyof ActivityValues, value: string, max: number) => {
    if (value.length > max) fail(field, `Keep ${ACTIVITY_LABELS[field]} under ${max} characters.`)
    return value || null
  }

  const departmentMatch = matcherOf(scope.departments.map((row) => [row.code, [row.name]]))
  const departmentCode = departmentMatch(text(raw.department)) ?? ''
  if (!departmentCode) {
    fail(
      'departmentCode',
      text(raw.department)
        ? `“${text(raw.department)}” is not one of the client’s departments.`
        : 'Choose the department.',
    )
  }

  const name = text(raw.name)
  if (!name) fail('name', 'Name the processing activity.')

  const closed = (field: keyof ActivityValues, list: readonly RopaAnswer[], value: unknown) => {
    const match = answerMatcher(list)
    const pieces = piecesOf(value, match)
    if (list.length === 0) return uniqueByKey(pieces)
    const unknown = pieces.filter((piece) => !match(piece))
    if (unknown.length) {
      fail(field, `Not in the ${ACTIVITY_LABELS[field]} list: ${quoted(unknown)}.`)
    }
    return [...new Set(pieces.flatMap((piece) => match(piece) ?? []))]
  }
  const open = (field: keyof ActivityValues, list: readonly RopaAnswer[], value: unknown) => {
    const match = answerMatcher(list)
    const pieces = piecesOf(value, match)
    const unknown = pieces.filter((piece) => !match(piece))
    if (unknown.length && list.length) warnings[field] = `Kept as typed: ${quoted(unknown)}.`
    return uniqueByKey(pieces.map((piece) => match(piece) ?? piece))
  }
  const single = (field: keyof ActivityValues, values: string[]) => {
    if (values.length > 1) fail(field, `Give one ${ACTIVITY_LABELS[field]}.`)
    return values[0] ?? null
  }

  const bases = basisMatcher(kb.bases)
  const basisPieces = piecesOf(raw.lawfulBases, bases)
  const unknownBases = basisPieces.filter((piece) => !bases(piece))
  if (unknownBases.length) {
    fail('lawfulBases', `Not a DPDP lawful basis: ${quoted(unknownBases)}. Choose from the list.`)
  }

  const processMatch = matcherOf(
    kb.processes.map((row) => [row.code, [`${row.code} ${row.title}`]]),
  )
  const templateText = text(raw.templateCode)
  const templateCode = templateText ? (processMatch(templateText) ?? null) : null
  if (templateText && !templateCode) {
    fail('templateCode', `“${templateText}” is not a catalogue process for this client.`)
  }

  const internalPieces = piecesOf(raw.internalRecipients, departmentMatch)
  const unknownDepartments = internalPieces.filter((piece) => !departmentMatch(piece))
  if (unknownDepartments.length) {
    fail(
      'internalRecipients',
      `Not one of the client’s departments: ${quoted(unknownDepartments)}.`,
    )
  }

  const transferText = text(raw.transfersAbroad)
  const transferMatch = matcherOf(
    TRANSFER_ANSWERS.map((answer) => [answer, [TRANSFER_TEXT[answer]]] as [string, string[]]),
  )
  const transfersAbroad = (transferText ? transferMatch(transferText) : 'unknown') as
    TransferAnswer | undefined
  if (!transfersAbroad) fail('transfersAbroad', 'Answer No, Yes or Not yet known.')

  const retentionList = [...kb.lists.retention, ...kb.sectorRetention]
  const retention = single('retention', open('retention', retentionList, raw.retention))
  const deletion = single('deletion', closed('deletion', kb.lists.deletion, raw.deletion))
  const consentStatus = single(
    'consentStatus',
    closed('consentStatus', kb.lists.consent, raw.consentStatus),
  )

  const elements = normaliseElements(raw.elements, departmentCode, scope, warnings, fail)
  const countries = limit('countries', text(raw.countries), 300)

  return {
    values: {
      departmentCode,
      name: name.slice(0, 160),
      templateCode,
      purpose: limit('purpose', text(raw.purpose), 1000),
      lawfulBases: [...new Set(basisPieces.flatMap((piece) => bases(piece) ?? []))],
      lawReference: limit('lawReference', text(raw.lawReference), 300),
      principals: closed('principals', kb.lists.principals, raw.principals),
      elements,
      sources: closed('sources', kb.lists.sources, raw.sources),
      systems: open('systems', kb.lists.systems, raw.systems),
      internalRecipients: [
        ...new Set(internalPieces.flatMap((piece) => departmentMatch(piece) ?? [])),
      ].filter((code) => code !== departmentCode),
      processors: open('processors', kb.lists.recipients, raw.processors),
      recipients: open('recipients', kb.lists.recipients, raw.recipients),
      retention: retention ? limit('retention', retention, 300) : null,
      deletion,
      security: open('security', kb.lists.security, raw.security),
      transfersAbroad: transfersAbroad ?? 'unknown',
      countries: transfersAbroad === 'yes' ? countries : null,
      consentStatus,
      owner: limit('owner', text(raw.owner), 200),
      notes: limit('notes', text(raw.notes), 2000),
    },
    errors,
    warnings,
  }
}

const normaliseElements = (
  value: unknown,
  departmentCode: string,
  scope: ActivityScope,
  warnings: Record<string, string>,
  fail: (field: keyof ActivityValues, message: string) => void,
): ActivityElement[] => {
  const match = elementMatcher(scope.kb)
  const byCode = new Map(scope.kb.elements.map((row) => [row.code, row]))
  const held = scope.inventory.get(departmentCode)
  const items: RawElement[] = Array.isArray(value)
    ? (value as RawElement[])
    : typeof value === 'string'
      ? splitAnswers(value, match)
      : []
  const out: ActivityElement[] = []
  const own: string[] = []
  for (const item of items) {
    const given = typeof item === 'string' ? { title: item } : item
    const code = text(given.code) ? match(text(given.code)) : match(text(given.title))
    const entry = code ? byCode.get(code) : undefined
    if (entry) {
      const kept = held?.get(entry.code)
      out.push({
        code: entry.code,
        title: entry.title,
        category: kept?.category ?? entry.category,
        level: kept?.level ?? entry.level,
      })
      continue
    }
    const title = text(given.title).slice(0, 120)
    if (!title) {
      if (text(given.code)) fail('elements', `${text(given.code)} is not in the knowledge base.`)
      continue
    }
    const known = held?.get(ownKey(title))
    const category = CATEGORY_CODES.includes(text(given.category))
      ? text(given.category)
      : (known?.category ?? 'other')
    const level =
      LEVELS.find((item) => item === text(given.level)) ??
      (known && known.category === category ? known.level : categoryInfo(category).level)
    out.push({ code: null, title, category, level })
    if (!known) own.push(title)
  }
  if (own.length) {
    warnings.elements = `Added as the department’s own data elements: ${quoted(own)}.`
  }
  const seen = new Set<string>()
  return out.filter((row) => {
    const key = row.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Field by field, what differs between two activities (for an import's change list). */
export const changedFields = (before: ActivityValues, after: ActivityValues) =>
  (Object.keys(ACTIVITY_LABELS) as (keyof ActivityValues)[]).filter((field) => {
    const a = before[field]
    const b = after[field]
    const plain = (value: unknown) =>
      JSON.stringify(
        Array.isArray(value)
          ? value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).sort()
          : value,
      )
    return plain(a) !== plain(b)
  })
