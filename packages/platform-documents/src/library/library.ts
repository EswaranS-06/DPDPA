import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findRepoRoot } from '@duatf/core-config'

// Reads ComplyX's DPDP template library (ADR-0010) the way the library's own bundler does
// (library/tools/build_ui.py, kept outside the repo): front matter, shared blocks, the placeholder
// registry, the flag tables and the order of each collection's fields. The files themselves are
// never changed; see manifest.ts.

export const TEMPLATE_DIRS = [
  '01-notices',
  '02-consent',
  '03-governance',
  '04-vendor',
  '05-rights',
  '06-breach',
  '07-sdf',
] as const

export type Template = {
  id: string
  file: string
  folder: string
  title: string
  category: string
  audience: string
  publish: string
  appliesWhen: string
  legalBasis: string
  flags: string[]
  version: string
  reviewCycle: string
  body: string
}

export type RegistryEntry = {
  group?: string
  type?: string
  description?: string
  default?: string | boolean | string[]
  required?: boolean
  used_in?: string[]
  [key: string]: string | boolean | string[] | undefined
}
export type Registry = Record<string, RegistryEntry>

export type GlobalFlag = {
  name: string
  type: 'bool' | 'enum'
  options: string[]
  question: string
  default: boolean | string
}
export type DocFlag = {
  name: string
  type: 'bool' | 'enum'
  options: string[]
  usedIn: string[]
  question: string
  auto: boolean
  default: boolean | string
}

export type LibraryData = {
  templates: Template[]
  blocks: Record<string, string>
  registry: Registry
  collections: Record<string, string[]>
  flags: { global: GlobalFlag[]; doc: DocFlag[] }
}

/** Where the library sits in the repository. */
export const libraryRoot = () => join(findRepoRoot(), 'packages', 'platform-documents', 'library')

/** Python's str.strip(chars): removes any of the characters from both ends. */
const stripChars = (text: string, chars: string) => {
  let start = 0
  let end = text.length
  while (start < end && chars.includes(text[start] ?? '')) start += 1
  while (end > start && chars.includes(text[end - 1] ?? '')) end -= 1
  return text.slice(start, end)
}

export const splitFrontMatter = (text: string): { meta: Record<string, string>; body: string } => {
  if (!text.startsWith('---')) return { meta: {}, body: text }
  const end = text.indexOf('\n---', 3)
  const raw = text.slice(3, end)
  const meta: Record<string, string> = {}
  for (const line of raw.trim().split(/\r?\n/)) {
    const colon = line.indexOf(':')
    if (colon >= 0) meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }
  return { meta, body: text.slice(end + 4).replace(/^\n+/, '') }
}

const parseList = (value: string) => {
  const text = value.trim()
  if (text.startsWith('[') && text.endsWith(']')) {
    return text
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return text ? [text] : []
}

/**
 * A library file as text, with line endings read the way Python reads text (universal newlines):
 * the library's bundler and validator see CR LF as LF, and so does DUATF. The file is not changed.
 */
export const readLibraryText = (path: string) => readFileSync(path, 'utf8').replace(/\r\n?/g, '\n')

const read = (root: string, ...parts: string[]) => readLibraryText(join(root, ...parts))

export const loadTemplates = (root = libraryRoot()): Template[] =>
  TEMPLATE_DIRS.flatMap((dir) =>
    readdirSync(join(root, dir))
      .filter((name) => name.endsWith('.md'))
      .sort()
      .map((name) => {
        const { meta, body } = splitFrontMatter(read(root, dir, name))
        return {
          id: meta.id ?? name.split('-')[0] ?? name,
          file: `${dir}/${name}`,
          folder: dir,
          title: meta.title ?? name,
          category: meta.category ?? '',
          audience: meta.audience ?? '',
          publish: meta.publish ?? '',
          appliesWhen: meta.applies_when ?? '',
          legalBasis: stripChars(meta.legal_basis ?? '', '[]'),
          flags: parseList(meta.flags ?? ''),
          version: meta.version ?? '1.0',
          reviewCycle: meta.review_cycle ?? '',
          body,
        }
      }),
  )

export const loadBlocks = (root = libraryRoot()): Record<string, string> => {
  const { body } = splitFrontMatter(read(root, '00-common', 'shared-blocks.md'))
  const blocks: Record<string, string> = {}
  for (const match of body.matchAll(
    /^## BLOCK:\s*([a-z0-9-]+)[^\n]*\n([\s\S]*?)(?=^---\s*$|(?![\s\S]))/gm,
  )) {
    blocks[match[1] ?? ''] = `${stripChars(match[2] ?? '', '\n')}\n`
  }
  return blocks
}

const parseScalar = (value: string): string | boolean | string[] => {
  const text = value.trim()
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    return text.slice(1, -1).replace(/\\"/g, '"')
  }
  if (text.startsWith('[') && text.endsWith(']')) {
    return text
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (text === 'true' || text === 'false') return text === 'true'
  return text
}

export const loadRegistry = (root = libraryRoot()) => {
  const placeholders: Registry = {}
  const collections: Record<string, Record<string, string | boolean | string[]>> = {}
  let section: string | null = null
  let current: string | null = null
  for (const line of read(root, '00-common', 'placeholder-registry.yaml').split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    if (!line.startsWith(' ')) {
      section = line.split(':')[0] ?? null
      continue
    }
    const indent = line.length - line.trimStart().length
    const trimmed = line.trim()
    const colon = trimmed.indexOf(':')
    const key = colon >= 0 ? trimmed.slice(0, colon) : trimmed
    const value = colon >= 0 ? trimmed.slice(colon + 1) : ''
    const target =
      section === 'placeholders' ? placeholders : section === 'collections' ? collections : null
    if (!target) continue
    if (indent === 2) {
      current = key
      target[current] = {}
    } else if (indent === 4 && current) {
      const entry = target[current]
      if (entry) entry[key] = parseScalar(value)
    }
  }
  return {
    placeholders,
    collections: Object.fromEntries(
      Object.entries(collections).map(([name, entry]) => [
        name,
        Array.isArray(entry.fields) ? entry.fields : [],
      ]),
    ),
  }
}

const DP_CATEGORY_OPTIONS = [
  'Customer',
  'Patient',
  'Attendant-Next-of-Kin',
  'Visitor',
  'Vendor-Representative',
  'Custom',
]

export const loadFlags = (root = libraryRoot()): LibraryData['flags'] => {
  const { body } = splitFrontMatter(read(root, '00-common', 'conditional-flags.md'))
  const global: GlobalFlag[] = []
  const doc: DocFlag[] = []
  let section: 'global' | 'doc' | null = null
  for (const line of body.split(/\r?\n/)) {
    if (line.startsWith('## 1. ')) section = 'global'
    else if (line.startsWith('### 1.1')) section = 'doc'
    else if (line.startsWith('## 2')) section = null
    const match = /^\|\s*`([A-Za-z0-9-]+)`\s*\|(.*)\|\s*$/.exec(line)
    if (!match || !section) continue
    const cells = (match[2] ?? '').split('|').map((cell) => cell.trim())
    const name = match[1] ?? ''
    const typeCell = cells[0] ?? ''
    const kind = typeCell.startsWith('enum') ? 'enum' : 'bool'
    let options = kind === 'enum' ? [...typeCell.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? '') : []
    if (name === 'DP-Category') options = DP_CATEGORY_OPTIONS
    if (section === 'global') {
      const fallback = cells.length > 2 ? stripChars(cells[2] ?? '', '`') : ''
      global.push({
        name,
        type: kind,
        options,
        question: cells[1] ?? '',
        default: kind === 'bool' ? fallback === 'true' : fallback || (options[0] ?? ''),
      })
    } else {
      doc.push({
        name,
        type: kind,
        options,
        usedIn: [...(cells[1] ?? '').matchAll(/[A-Z]\d{2}/g)].map((m) => m[0]),
        question: cells[2] ?? '',
        auto: typeCell.includes('auto'),
        default: kind === 'bool' ? false : (options[0] ?? ''),
      })
    }
  }
  return { global, doc }
}

const PH = /\[((?:[A-Z][A-Za-z0-9]*)(?:-[A-Za-z0-9]+)*)\](?!\()/g
const REPEAT = /<!--\s*REPEAT\s+([A-Za-z0-9-]+)\s*-->([\s\S]*?)<!--\s*END REPEAT\s*-->/g

/** Each collection's fields in the order they first appear in a template's table. */
const orderCollectionFields = (
  templates: readonly Template[],
  collections: Record<string, string[]>,
) => {
  const ordered: Record<string, string[]> = {}
  for (const template of templates) {
    for (const match of template.body.matchAll(REPEAT)) {
      const sequence = (ordered[match[1] ?? ''] ??= [])
      for (const field of (match[2] ?? '').matchAll(PH)) {
        if (!sequence.includes(field[1] ?? '')) sequence.push(field[1] ?? '')
      }
    }
  }
  return Object.fromEntries(
    Object.entries(collections).map(([name, fields]) => [
      name,
      [
        ...(ordered[name] ?? []),
        ...fields.filter((field) => !(ordered[name] ?? []).includes(field)),
      ],
    ]),
  )
}

let cached: LibraryData | null = null

/** The whole library, read once per process. */
export const loadLibrary = (root?: string): LibraryData => {
  if (cached && !root) return cached
  const base = root ?? libraryRoot()
  const { placeholders, collections } = loadRegistry(base)
  const templates = loadTemplates(base)
  const data: LibraryData = {
    templates,
    blocks: loadBlocks(base),
    registry: placeholders,
    collections: orderCollectionFields(templates, collections),
    flags: loadFlags(base),
  }
  if (!root) cached = data
  return data
}

const INCLUDE_TAG = /<!--\s*INCLUDE\s+([A-Za-z0-9-]+)\s*-->/g

/**
 * Which templates use each single value and each table: the placeholders outside REPEAT blocks
 * and the REPEAT collections, with the shared blocks a template includes counted as its own.
 */
export const fieldUsage = (data: Pick<LibraryData, 'templates' | 'blocks'>) => {
  const fields: Record<string, string[]> = {}
  const collections: Record<string, string[]> = {}
  const add = (target: Record<string, string[]>, name: string, id: string) => {
    const list = (target[name] ??= [])
    if (!list.includes(id)) list.push(id)
  }
  for (const template of data.templates) {
    let text = template.body
    for (let depth = 0; depth < 4; depth += 1) {
      text = text.replace(INCLUDE_TAG, (_, name: string) => data.blocks[name] ?? '')
    }
    // Drafting notes never reach the document, so their placeholders are not asked for.
    let inNote = false
    text = text
      .split('\n')
      .filter((line) => {
        if (line.startsWith('> **Drafting note')) inNote = true
        else if (!(inNote && line.startsWith('>'))) inNote = false
        return !inNote
      })
      .join('\n')
    const outside = text.replace(REPEAT, (_, name: string) => {
      add(collections, name, template.id)
      return ''
    })
    for (const match of outside.matchAll(PH)) add(fields, match[1] ?? '', template.id)
  }
  return { fields, collections }
}

/** One CSV line as its cells, with quoted cells (which may hold commas) unquoted. */
const csvCells = (line: string): string[] => {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      cells.push(cell)
      cell = ''
    } else cell += char
  }
  cells.push(cell)
  return cells.map((item) => item.trim())
}

/** The library's register layouts (registers/*.csv): each file with its columns, in order. */
export const loadRegisterLayouts = (root = libraryRoot()) =>
  readdirSync(join(root, 'registers'))
    .filter((name) => name.endsWith('.csv'))
    .sort()
    .map((file) => ({
      file,
      columns: csvCells(
        (read(root, 'registers', file).split(/\r?\n/)[0] ?? '').replace(/^\uFEFF/, ''),
      ),
    }))
