import {
  control,
  createDatabase,
  dataElement,
  discoveryQuestion,
  domain,
  eq,
  frameworkRelease,
  instrument,
  lawfulBasis,
  notificationEntry,
  obligation,
  obligationControl,
  pbcItem,
  playbookDoc,
  processTemplate,
  retentionAnchor,
  scopingQuestion,
  sectorLaw,
  sectorOverlay,
  stuckPoint,
  vocabulary,
  vocabularyTerm,
  type Transaction,
} from '@duatf/platform-db'
import { buildFrameworkRows, type FrameworkRows } from './mappers'
import { readSeedVault } from './vault'

export const SEED_SOURCE = 'seed:DPDP-DUATF-Vault'
export const SEED_VERSION = '1.0.0'

export class AlreadyImportedError extends Error {
  constructor(version: string) {
    super(
      `The seed vault was already imported as framework release ${version}. It is a one-time import.`,
    )
    this.name = 'AlreadyImportedError'
  }
}

export type ImportReport = {
  version: string
  digest: string
  counts: Record<keyof FrameworkRows, number>
  unresolvedLinks: Record<string, number>
  dryRun: boolean
}

const insertAll = async (tx: Transaction, releaseId: string, rows: FrameworkRows) => {
  const withRelease = <Row extends object>(items: Row[]) =>
    items.map((item) => ({ ...item, releaseId }))
  const steps: [string, () => Promise<unknown>][] = [
    ['instrument', () => tx.insert(instrument).values(withRelease(rows.instruments))],
    ['lawful_basis', () => tx.insert(lawfulBasis).values(withRelease(rows.lawfulBases))],
    ['domain', () => tx.insert(domain).values(withRelease(rows.domains))],
    ['obligation', () => tx.insert(obligation).values(withRelease(rows.obligations))],
    ['control', () => tx.insert(control).values(withRelease(rows.controls))],
    [
      'obligation_control',
      () => tx.insert(obligationControl).values(withRelease(rows.obligationControls)),
    ],
    [
      'process_template',
      () => tx.insert(processTemplate).values(withRelease(rows.processTemplates)),
    ],
    ['sector_overlay', () => tx.insert(sectorOverlay).values(withRelease(rows.sectorOverlays))],
    ['sector_law', () => tx.insert(sectorLaw).values(withRelease(rows.sectorLaws))],
    [
      'retention_anchor',
      () => tx.insert(retentionAnchor).values(withRelease(rows.retentionAnchors)),
    ],
    ['data_element', () => tx.insert(dataElement).values(withRelease(rows.dataElements))],
    ['vocabulary', () => tx.insert(vocabulary).values(withRelease(rows.vocabularies))],
    ['vocabulary_term', () => tx.insert(vocabularyTerm).values(withRelease(rows.vocabularyTerms))],
    ['pbc_item', () => tx.insert(pbcItem).values(withRelease(rows.pbcItems))],
    ['stuck_point', () => tx.insert(stuckPoint).values(withRelease(rows.stuckPoints))],
    [
      'scoping_question',
      () => tx.insert(scopingQuestion).values(withRelease(rows.scopingQuestions)),
    ],
    [
      'discovery_question',
      () => tx.insert(discoveryQuestion).values(withRelease(rows.discoveryQuestions)),
    ],
    [
      'notification_entry',
      () => tx.insert(notificationEntry).values(withRelease(rows.notificationEntries)),
    ],
    ['playbook_doc', () => tx.insert(playbookDoc).values(withRelease(rows.playbookDocs))],
  ]
  for (const [table, step] of steps) {
    try {
      await step()
    } catch (error) {
      throw new Error(`Import failed while writing ${table}`, { cause: error })
    }
  }
}

/**
 * One-time import of the seed vault as framework release 1.0.0 (published, immutable).
 * Later framework changes are made as new releases in the database, never by re-importing.
 */
export const importSeedVault = async (options: {
  vaultPath: string
  databaseUrl: string
  dryRun?: boolean
}): Promise<ImportReport> => {
  const { notes, digest } = readSeedVault(options.vaultPath)
  const { rows, unresolvedLinks } = buildFrameworkRows(notes)
  const counts = Object.fromEntries(
    Object.entries(rows).map(([key, items]) => [key, items.length]),
  ) as ImportReport['counts']
  const report: ImportReport = {
    version: SEED_VERSION,
    digest,
    counts,
    unresolvedLinks,
    dryRun: options.dryRun ?? false,
  }
  if (options.dryRun) return report

  const { db, close } = createDatabase(options.databaseUrl, { max: 1 })
  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ version: frameworkRelease.version })
        .from(frameworkRelease)
        .where(eq(frameworkRelease.source, SEED_SOURCE))
      if (existing[0]) throw new AlreadyImportedError(existing[0].version)

      const [release] = await tx
        .insert(frameworkRelease)
        .values({
          version: SEED_VERSION,
          status: 'draft',
          source: SEED_SOURCE,
          sourceDigest: digest,
          createdBy: 'seed-import',
          notes: 'One-time import of the DUATF vault v1 (framework as of 25 Sep 2026).',
        })
        .returning({ id: frameworkRelease.id })
      if (!release) throw new Error('Release insert returned no id')

      await insertAll(tx, release.id, rows)
      await tx
        .update(frameworkRelease)
        .set({ status: 'published', publishedBy: 'seed-import', publishedAt: new Date() })
        .where(eq(frameworkRelease.id, release.id))
    })
    return report
  } finally {
    await close()
  }
}
