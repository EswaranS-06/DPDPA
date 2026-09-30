import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { parse } from 'yaml'

export type SeedNote = {
  path: string
  stem: string
  folder: string
  type: string
  frontmatter: Record<string, unknown>
  body: string
}

// Framework content only. Templates, examples, client work, engine output and working notes
// belong to later phases or are Obsidian-specific.
const EXCLUDED = [
  '.obsidian',
  '.git',
  '90 Templates',
  '20 Example - DemoPay',
  '20 Client',
  '_context',
  '_framework-source',
  join('11 Assessments', 'Engine Output'),
  'assets',
  'engine',
]

const walk = (dir: string, root: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    const rel = relative(root, full)
    if (EXCLUDED.some((excluded) => rel === excluded || rel.startsWith(excluded + sep))) return []
    if (entry.isDirectory()) return walk(full, root)
    return entry.name.endsWith('.md') ? [full] : []
  })

const splitFrontmatter = (text: string): { frontmatter: Record<string, unknown>; body: string } => {
  if (!text.startsWith('---')) return { frontmatter: {}, body: text }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { frontmatter: {}, body: text }
  const parsed: unknown = parse(text.slice(3, end))
  const frontmatter =
    parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  return { frontmatter, body: text.slice(end + 4).replace(/^\r?\n/, '') }
}

export const readSeedVault = (root: string): { notes: SeedNote[]; digest: string } => {
  const hash = createHash('sha256')
  const notes = walk(root, root)
    .sort()
    .map((path) => {
      const text = readFileSync(path, 'utf8')
      const rel = relative(root, path).split(sep).join('/')
      hash.update(rel).update('\0').update(text).update('\0')
      const { frontmatter, body } = splitFrontmatter(text)
      return {
        path: rel,
        stem: basename(path, '.md'),
        folder: rel.split('/')[0] ?? '',
        type: typeof frontmatter.type === 'string' ? frontmatter.type : '',
        frontmatter,
        body,
      }
    })
  return { notes, digest: hash.digest('hex') }
}
