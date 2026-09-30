// Small, deliberate markdown helpers for the seed notes' known shapes.

const WIKILINK = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g

export type RefTarget = { kind: string; code: string }
export type RefResolver = (target: string) => RefTarget | undefined

/** Target note name of a "[[Target|Alias]]" value from frontmatter; plain strings pass through. */
export const linkTarget = (value: unknown): string => {
  const text = typeof value === 'string' ? value : ''
  const match = /\[\[([^\]|#]+)/.exec(text)
  return (match?.[1] ?? text).trim()
}

export const linkTargets = (value: unknown): string[] =>
  (Array.isArray(value) ? value : value ? [value] : []).map(linkTarget).filter(Boolean)

export const asText = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

export const asList = (value: unknown): string[] =>
  (Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ''
      ? []
      : [value]
  )
    .map((item) => asText(item))
    .filter(Boolean)

/** Removes Obsidian-only blocks (Dataview queries) and embeds. */
export const stripObsidian = (markdown: string): string =>
  markdown
    .replace(/```dataview[\s\S]*?```\n?/g, '')
    .replace(/^!\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/** Rewrites [[links]] to markdown links with a "ref:kind/code" target; unknown targets become text. */
export const rewriteLinks = (
  markdown: string,
  resolve: RefResolver,
  onUnresolved?: (target: string) => void,
): string =>
  markdown.replace(WIKILINK, (_whole, embed: string, target: string, alias?: string) => {
    if (embed) return ''
    const name = target.trim()
    const label = (alias ?? name).trim()
    const ref = resolve(name)
    if (!ref) {
      onUnresolved?.(name)
      return label
    }
    return `[${label}](ref:${ref.kind}/${ref.code})`
  })

export const h1 = (markdown: string): string | undefined =>
  /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim()

/** Content under a "## Heading" (matched by prefix) up to the next heading of the same or higher level. */
export const section = (markdown: string, heading: string): string => {
  const lines = markdown.split('\n')
  const start = lines.findIndex(
    (line) => /^##\s/.test(line) && line.replace(/^##\s+/, '').startsWith(heading),
  )
  if (start === -1) return ''
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,2}\s/.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim()
}

/** First prose paragraph after the H1 (skips tables, quotes, lists and headings). */
export const firstParagraph = (markdown: string): string => {
  const afterTitle = markdown.replace(/^[\s\S]*?^#\s+.+$/m, '')
  const block = afterTitle
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk && !/^(#|\||>|-|\*|```|\d+\.)/.test(chunk))
  return block?.replace(/\s*\n\s*/g, ' ') ?? ''
}

const cells = (row: string): string[] =>
  row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim())

/** Parses the first GitHub-style table in a markdown fragment. */
export const parseTable = (markdown: string): { headers: string[]; rows: string[][] } => {
  const lines = markdown.split('\n')
  const start = lines.findIndex(
    (line, index) =>
      line.trim().startsWith('|') && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1] ?? ''),
  )
  if (start === -1) return { headers: [], rows: [] }
  const headers = cells(lines[start] ?? '')
  const rows: string[][] = []
  for (const line of lines.slice(start + 2)) {
    if (!line.trim().startsWith('|')) break
    rows.push(cells(line))
  }
  return { headers, rows }
}

export const bulletItems = (markdown: string): string[] =>
  markdown
    .split('\n')
    .filter((line) => /^\s*[-*]\s+/.test(line))
    .map((line) => line.replace(/^\s*[-*]\s+/, '').trim())

/** Plain text of an inline markdown fragment: drops links, code ticks and emphasis. */
export const plain = (text: string): string =>
  text
    .replace(WIKILINK, (_whole, _embed: string, target: string, alias?: string) =>
      (alias ?? target).trim(),
    )
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim()

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
