import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import JSZip from 'jszip'
import { libraryRoot } from './library'

// The library is kept word for word (ADR-0010 decision 1). Every file DUATF uses is listed with
// its SHA-256 in library/manifest.json; a test fails if a file differs from it. The only way to
// change the files is to import a new version of ComplyX's zip, which reports what changed.

export const MANIFEST = 'manifest.json'

/** The files of the library DUATF keeps: its templates, common files, registers and engine. */
export const keptFile = (path: string) =>
  path === 'README.md' ||
  /^0[0-7]-[a-z-]+\/[^/]+\.(md|yaml|yml)$/.test(path) ||
  /^registers\/[^/]+\.csv$/.test(path) ||
  /^ui\/(engine|clauses|data)\.js$/.test(path)

export type Manifest = {
  source: string
  /** SHA-256 of the zip it came from. */
  sourceSha256: string
  importedOn: string
  files: Record<string, string>
}

export const sha256 = (bytes: Buffer | Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex')

const filesUnder = (dir: string, root = dir): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory()
      ? filesUnder(path, root)
      : [relative(root, path).replace(/\\/g, '/')]
  })

export const readManifest = (root = libraryRoot()): Manifest =>
  JSON.parse(readFileSync(join(root, MANIFEST), 'utf8')) as Manifest

/** Differences between the files on disk and the manifest; all empty when the library is intact. */
export const verifyLibrary = (root = libraryRoot()) => {
  const manifest = readManifest(root)
  const onDisk = filesUnder(root).filter((path) => path !== MANIFEST)
  const listed = Object.keys(manifest.files)
  return {
    missing: listed.filter((path) => !existsSync(join(root, path))),
    changed: listed.filter(
      (path) =>
        existsSync(join(root, path)) &&
        sha256(readFileSync(join(root, path))) !== manifest.files[path],
    ),
    unlisted: onDisk.filter((path) => !(path in manifest.files)),
  }
}

export type ImportReport = {
  added: string[]
  changed: string[]
  removed: string[]
  unchanged: number
  manifest: Manifest
}

/**
 * Imports a version of the library from its zip into the library folder: only the files DUATF
 * keeps, byte for byte, with a new manifest. Says what was added, changed and removed. With
 * dryRun, nothing is written.
 */
export const importLibrary = async (
  zipBytes: Buffer,
  options: { root?: string; source?: string; dryRun?: boolean; today?: string } = {},
): Promise<ImportReport> => {
  const root = options.root ?? libraryRoot()
  const zip = await JSZip.loadAsync(zipBytes)
  const entries = Object.values(zip.files).filter((file) => !file.dir)
  // The zip holds one top folder (Templater-DPDP/); paths are taken below it.
  const top = entries.every((file) => file.name.includes('/'))
    ? (entries[0]?.name.split('/')[0] ?? '')
    : ''
  const incoming = new Map<string, Buffer>()
  for (const file of entries) {
    const path =
      top && file.name.startsWith(`${top}/`) ? file.name.slice(top.length + 1) : file.name
    if (keptFile(path)) incoming.set(path, Buffer.from(await file.async('uint8array')))
  }
  if (!incoming.has('00-common/placeholder-registry.yaml') || !incoming.has('ui/engine.js')) {
    throw new Error('This zip is not the DPDP template library: its registry or engine is missing.')
  }
  const current = existsSync(join(root, MANIFEST)) ? readManifest(root).files : {}
  const files = Object.fromEntries([...incoming].map(([path, bytes]) => [path, sha256(bytes)]))
  const report: ImportReport = {
    added: Object.keys(files)
      .filter((path) => !(path in current))
      .sort(),
    changed: Object.keys(files)
      .filter((path) => path in current && current[path] !== files[path])
      .sort(),
    removed: Object.keys(current)
      .filter((path) => !(path in files))
      .sort(),
    unchanged: Object.keys(files).filter((path) => current[path] === files[path]).length,
    manifest: {
      source: options.source ?? 'Templater-DPDP.zip',
      sourceSha256: sha256(zipBytes),
      importedOn: options.today ?? new Date().toISOString().slice(0, 10),
      files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
    },
  }
  if (options.dryRun) return report
  for (const path of report.removed) rmSync(join(root, path), { force: true })
  for (const [path, bytes] of incoming) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), bytes)
  }
  writeFileSync(join(root, MANIFEST), `${JSON.stringify(report.manifest, null, 2)}\n`)
  return report
}
