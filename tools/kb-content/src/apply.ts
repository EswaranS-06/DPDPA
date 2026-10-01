import type { Principal } from '@duatf/core-access'
import { NotFoundError } from '@duatf/core-utils'
import {
  entryForm,
  nextVersion,
  openDraft,
  releaseOverview,
  saveEntry,
  startDraft,
  suggestObligations,
  type AuthoringContext,
  type EditableSection,
} from '@duatf/feature-framework-library-api'
import type { Database } from '@duatf/platform-db'
import {
  BASES,
  DATA_ELEMENTS,
  ENGINE_FLAG_FIXES,
  PLAYBOOKS,
  PROCESSES,
  SECTORS,
  VOCABULARIES,
  type EntryInput,
} from './content'

/** The content pass acts as a firm administrator; its changes are labelled AI-drafted. */
const CONTENT_AUTHOR: Principal = {
  userId: '00000000-0000-0000-0000-000000000000',
  email: 'kb-content@duatf.local',
  displayName: 'Knowledge-base content pass',
  assignments: [{ role: 'firm_admin', clientId: null, departmentId: null }],
}

export const contentContext = (db: Database): AuthoringContext => ({
  db,
  principal: CONTENT_AUTHOR,
  origin: 'assistant',
})

export type ContentReport = {
  version: string
  startedDraft: boolean
  added: string[]
  skipped: string[]
  fixed: string[]
}

const exists = async (ctx: AuthoringContext, section: EditableSection, code: string) => {
  try {
    await entryForm(ctx, section, { code })
    return true
  } catch (error) {
    if (error instanceof NotFoundError) return false
    throw error
  }
}

/**
 * Adds the drafted entries to the open draft release, starting one when none is open. Entries
 * that already exist are left alone, so running it twice changes nothing.
 */
export const applyContent = async (ctx: AuthoringContext): Promise<ContentReport> => {
  let draft = await openDraft(ctx.db)
  const startedDraft = !draft
  if (!draft) {
    const published = (await releaseOverview(ctx.db)).published
    await startDraft(ctx, {
      version: nextVersion(published?.version ?? '1.0.0'),
      notes:
        'Knowledge-base editor launch. Adds AI-drafted entries to the reference sections, each awaiting legal review.',
    })
    draft = await openDraft(ctx.db)
  }
  const report: ContentReport = {
    version: draft?.version ?? '',
    startedDraft,
    added: [],
    skipped: [],
    fixed: [],
  }

  const add = async (section: EditableSection, input: EntryInput) => {
    const code = String(input.code)
    if (await exists(ctx, section, code)) {
      report.skipped.push(`${section}/${code}`)
      return
    }
    await saveEntry(ctx, section, input)
    report.added.push(`${section}/${code}`)
  }

  for (const input of BASES) await add('bases', input)
  for (const input of DATA_ELEMENTS) await add('data-elements', input)

  const flags = await entryForm(ctx, 'vocabularies', { code: 'engine-flags' })
  const terms = typeof flags.values.terms === 'string' ? flags.values.terms : ''
  const fixed = terms
    .split('\n')
    .map((line) => {
      const [term = '', ...rest] = line.split(' | ')
      return [ENGINE_FLAG_FIXES[term] ?? term, ...rest].join(' | ')
    })
    .join('\n')
  if (fixed !== terms) {
    await saveEntry(ctx, 'vocabularies', { ...flags.values, terms: fixed }, 'engine-flags')
    report.fixed.push('vocabularies/engine-flags')
  }
  for (const input of VOCABULARIES) await add('vocabularies', input)

  // Sectors before processes: new processes belong to the new sectors.
  for (const input of SECTORS) await add('sectors', input)
  for (const input of PROCESSES) {
    const obligationCodes = await suggestObligations(ctx, {
      typicalLawfulBasis: input.typicalLawfulBasis,
      flags: input.flags,
    })
    await add('processes', { ...input, obligationCodes })
  }
  for (const input of PLAYBOOKS) await add('playbooks', input)
  return report
}
