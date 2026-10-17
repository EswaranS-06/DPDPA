import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { buildClause, defaultSelection, parseSections, PACK_PRESETS } from './clauses'
import { structureIssues } from './checks'
import { render, type CollectionRow, type FlagValue, type RenderState } from './engine'
import { libraryRoot, loadLibrary, type LibraryData } from './library'
import { importLibrary, readManifest, sha256, verifyLibrary } from './manifest'

const root = libraryRoot()
const data = loadLibrary()

/** The library's own browser scripts, run in a sandbox with the bundle they expect. */
const studio = () => {
  const window: Record<string, unknown> = { DPDP_DATA: data }
  runInNewContext(readFileSync(join(root, 'ui', 'engine.js'), 'utf8'), { window })
  runInNewContext(readFileSync(join(root, 'ui', 'clauses.js'), 'utf8'), { window })
  return window as {
    DPDPEngine: {
      render: (
        template: unknown,
        data: unknown,
        state: unknown,
        options: unknown,
      ) => { markdown: string; analysis: Record<string, Set<string> | string[]> }
    }
    DPDPClauses: {
      parseSections: (markdown: string) => unknown
      defaultSelection: (parsed: unknown) => string[]
      buildClause: (items: unknown, options: unknown) => string
    }
  }
}

/** A small seeded generator, so a failing case can be repeated. */
const random = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const SAMPLES = [
  'Mallard Healthcare Private Limited',
  'dpo@example.test',
  '2026-11-13',
  '30 days',
  'Line one\nline two',
  'A | B',
  '<script>',
  'Yes',
  '',
]

const randomState = (next: () => number, library: LibraryData): RenderState => {
  const pick = <T>(items: readonly T[]) => items[Math.floor(next() * items.length)] as T
  const flags: Record<string, FlagValue> = {}
  for (const flag of [...library.flags.global, ...library.flags.doc]) {
    if (next() < 0.8) flags[flag.name] = flag.type === 'bool' ? next() < 0.5 : pick(flag.options)
  }
  const values: Record<string, string> = {}
  for (const name of Object.keys(library.registry)) if (next() < 0.6) values[name] = pick(SAMPLES)
  const collections: Record<string, CollectionRow[]> = {}
  for (const [name, fields] of Object.entries(library.collections)) {
    if (next() < 0.5) continue
    collections[name] = Array.from({ length: Math.floor(next() * 3) }, () =>
      Object.fromEntries(fields.filter(() => next() < 0.8).map((field) => [field, pick(SAMPLES)])),
    )
  }
  return { flags, values, collections }
}

const plain = (analysis: Record<string, Set<string> | string[]>) =>
  Object.fromEntries(Object.entries(analysis).map(([key, value]) => [key, [...value].sort()]))

describe('the template library, word for word', () => {
  it('TC-C26.1-01 every template, common and register file is byte-identical to the library copy, and an import of a new library version lists what changed', async () => {
    expect(verifyLibrary()).toEqual({ missing: [], changed: [], unlisted: [] })
    const manifest = readManifest()
    expect(Object.keys(manifest.files).filter((path) => /^0[1-7]-/.test(path))).toHaveLength(33)
    expect(Object.keys(manifest.files)).toEqual(
      expect.arrayContaining([
        'README.md',
        '00-common/placeholder-registry.yaml',
        '00-common/validation-checklist.md',
        'registers/ropa.csv',
        'ui/engine.js',
        'ui/clauses.js',
      ]),
    )

    // A new version: one file changed, one added, one gone, and a file DUATF does not keep.
    const scratch = mkdtempSync(join(tmpdir(), 'library-'))
    try {
      cpSync(root, scratch, { recursive: true })
      const zip = new JSZip()
      for (const path of Object.keys(manifest.files)) {
        if (path === 'registers/cookie-register.csv') continue
        const bytes = readFileSync(join(root, path))
        zip.file(
          `Templater-DPDP/${path}`,
          path === '01-notices/N04-cookie-notice-banner.md'
            ? Buffer.concat([bytes, Buffer.from('\n')])
            : bytes,
        )
      }
      zip.file(
        'Templater-DPDP/07-sdf/S05-new-template.md',
        '---\nid: S05\ntitle: New\n---\n\nBody\n',
      )
      zip.file('Templater-DPDP/dist/DPDP-Document-Studio.exe', 'not kept')
      const bytes = await zip.generateAsync({ type: 'nodebuffer' })
      const dry = await importLibrary(bytes, { root: scratch, dryRun: true })
      expect([dry.added, dry.changed, dry.removed]).toEqual([
        ['07-sdf/S05-new-template.md'],
        ['01-notices/N04-cookie-notice-banner.md'],
        ['registers/cookie-register.csv'],
      ])
      expect(verifyLibrary(scratch)).toEqual({ missing: [], changed: [], unlisted: [] })
      const done = await importLibrary(bytes, { root: scratch })
      expect(done.manifest.sourceSha256).toBe(sha256(bytes))
      expect(verifyLibrary(scratch)).toEqual({ missing: [], changed: [], unlisted: [] })
      writeFileSync(join(scratch, '02-consent/C01-consent-capture-forms.md'), 'edited')
      expect(verifyLibrary(scratch).changed).toEqual(['02-consent/C01-consent-capture-forms.md'])
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })
})

describe('the library’s template grammar', () => {
  it('reads the library as the library’s own bundler does (ui/data.js)', () => {
    const window: Record<string, unknown> = {}
    runInNewContext(readFileSync(join(root, 'ui', 'data.js'), 'utf8'), { window })
    const bundle = window.DPDP_DATA as LibraryData
    expect(data.templates.map(({ body, ...meta }) => ({ ...meta, body: body.length }))).toEqual(
      bundle.templates.map(({ body, ...meta }) => ({ ...meta, body: body.length })),
    )
    expect(data.templates.map((template) => template.body)).toEqual(
      bundle.templates.map((template) => template.body),
    )
    expect(data.blocks).toEqual(bundle.blocks)
    expect(data.registry).toEqual(bundle.registry)
    expect(data.collections).toEqual(bundle.collections)
    expect(data.flags).toEqual(bundle.flags)
  })

  it('TC-C26.2-01 for all 33 templates and random flags, values and collections, DUATF’s rendering equals the library engine’s', () => {
    const { DPDPEngine } = studio()
    const next = random(20261017)
    expect(data.templates).toHaveLength(33)
    for (let round = 0; round < 6; round += 1) {
      const state = randomState(next, data)
      for (const template of data.templates) {
        for (const mode of ['preview', 'export'] as const) {
          const ours = render(template, data, state, { mode, showNotes: round % 2 === 0 })
          const theirs = DPDPEngine.render(template, data, state, {
            mode,
            showNotes: round % 2 === 0,
          })
          expect(ours.markdown, `${template.id} ${mode} round ${round}`).toBe(theirs.markdown)
          expect(
            plain(ours.analysis as unknown as Record<string, Set<string>>),
            `${template.id} analysis`,
          ).toEqual(plain(theirs.analysis))
        }
      }
    }
  })

  it('TC-C26.2-02 every IF and REPEAT is closed, every INCLUDE resolves and every flag is defined, as the library’s own validator requires', () => {
    // The library's own validator (tools/validate.py) reports exactly these two: examples of the
    // grammar written in the prose of the common files, not directives. No template has a problem.
    expect(structureIssues()).toEqual({
      problems: [
        '00-common/conditional-flags.md: unrecognised comment <!-- IF ... -->',
        '00-common/shared-blocks.md: INCLUDE block-name not defined',
      ],
      unknownFlags: [],
    })
  })
})

describe('clause view and clause pack', () => {
  it('TC-C26.8-01 a document as one numbered clause, and a clause pack from the presets, number and word their sections as the library’s clause tool does', () => {
    const { DPDPClauses } = studio()
    const state = randomState(random(1442), data)
    for (const id of ['V01', 'V02', 'V04', 'V05', 'N01', 'B01', 'R02']) {
      const template = data.templates.find((row) => row.id === id)
      if (!template) throw new Error(`No ${id}`)
      const markdown = render(template, data, state, { mode: 'export' }).markdown
      const ours = parseSections(markdown)
      expect(JSON.parse(JSON.stringify(ours)), id).toEqual(
        JSON.parse(JSON.stringify(DPDPClauses.parseSections(markdown))),
      )
      const selected = defaultSelection(ours)
      expect(selected).toEqual(DPDPClauses.defaultSelection(DPDPClauses.parseSections(markdown)))
      const items = ours.sections
        .filter((section) => selected.includes(section.path))
        .map((section) => ({ section, group: id }))
      for (const options of [
        { number: '14', title: 'Data Protection' },
        {
          number: '7',
          title: 'Privacy',
          intro: 'The parties agree:',
          headingCase: 'title' as const,
        },
      ]) {
        expect(buildClause(items, options), `${id} ${options.number}`).toBe(
          DPDPClauses.buildClause(items, options),
        )
      }
    }
    // A pack across documents, from every preset.
    const items = PACK_PRESETS.flatMap((preset) => {
      const template = data.templates.find((row) => row.id === preset.doc)
      if (!template) return []
      const markdown = render(template, data, state, { mode: 'export' }).markdown
      return parseSections(markdown)
        .sections.filter((section) => preset.match.test(section.title))
        .map((section) => ({ section, group: preset.doc }))
    })
    expect(items.length).toBeGreaterThan(10)
    expect(buildClause(items, { number: '9' })).toBe(
      DPDPClauses.buildClause(items, { number: '9' }),
    )
  })
})
