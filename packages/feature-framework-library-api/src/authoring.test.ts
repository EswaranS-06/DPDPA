import { randomUUID } from 'node:crypto'
import { AccessDeniedError, type Principal } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import { RuleError, ValidationError } from '@duatf/core-utils'
import {
  createDatabase,
  FRAMEWORK_CHILD_TABLES,
  sql,
  type Database,
  type DatabaseHandle,
  type ObligationTrigger,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  entryForm,
  markReviewed,
  removeEntry,
  saveEntry,
  suggestObligations,
  triggeredObligations,
} from './entries'
import { createFrameworkLibraryApi } from './router'
import {
  publishDraft,
  releaseChanges,
  releaseOverview,
  releaseReviews,
  startDraft,
  type AuthoringContext,
} from './releases'

const env = parseEnv(testDatabaseEnvSchema)
let app: DatabaseHandle

beforeAll(() => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 2 })
})
afterAll(async () => {
  await app.close()
})

const person = (role: Principal['assignments'][number]['role'], name: string): Principal => ({
  userId: randomUUID(),
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.test`,
  displayName: name,
  assignments: [
    { role, clientId: role.startsWith('client') ? randomUUID() : null, departmentId: null },
  ],
})
const admin = person('firm_admin', 'KB Admin')
const lead = person('lead_auditor', 'KB Lead')

class Rollback extends Error {}

/** A database error's message together with the messages of its causes. */
const messageOf = (error: unknown): string =>
  error instanceof Error ? `${error.message} ${messageOf(error.cause)}` : ''

/**
 * Runs the work inside a transaction that is always rolled back, so drafts and publishing never
 * leak into the shared test database that other test files read at the same time.
 */
const isolated = async (work: (as: (who: Principal) => AuthoringContext) => Promise<void>) => {
  await expect(
    app.db.transaction(async (tx) => {
      // A transaction runs nested transactions as savepoints, as the services expect.
      const db = tx as unknown as Database
      await work((who) => ({ db, principal: who }))
      throw new Rollback('rolled back')
    }),
  ).rejects.toBeInstanceOf(Rollback)
}

const rowsOf = (table: string, releaseId: string) =>
  sql`select to_jsonb(t) - 'release_id' - 'id' as row from ${sql.identifier(table)} t
      where t.release_id = ${releaseId}`

describe('knowledge-base draft releases', () => {
  it('TC-C17.1-01 a draft starts as an exact copy of the published release, one at a time', async () => {
    await isolated(async (as) => {
      const before = await releaseOverview(as(lead).db)
      const published = before.published
      expect(published?.status).toBe('published')
      expect(before.draft).toBeNull()
      await expect(startDraft(as(lead), { version: published?.version })).rejects.toBeInstanceOf(
        ValidationError,
      )
      const { version } = await startDraft(as(lead), { version: '9.1.0', notes: 'Test draft' })
      const after = await releaseOverview(as(lead).db)
      expect(after.draft?.version).toBe(version)
      expect(after.published?.id).toBe(published?.id)
      // Oracle: every child table, row for row, read directly from both releases.
      const differences: string[] = []
      for (const table of FRAMEWORK_CHILD_TABLES) {
        const missing = await as(lead).db.execute<{ n: number }>(sql`
          select count(*)::int as n from ((${rowsOf(table, published?.id ?? '')})
            except all (${rowsOf(table, after.draft?.id ?? '')})) d`)
        const extra = await as(lead).db.execute<{ n: number }>(sql`
          select count(*)::int as n from ((${rowsOf(table, after.draft?.id ?? '')})
            except all (${rowsOf(table, published?.id ?? '')})) d`)
        if (missing[0]?.n || extra[0]?.n) differences.push(table)
      }
      expect(differences).toEqual([])
      await expect(startDraft(as(lead), { version: '9.2.0' })).rejects.toBeInstanceOf(RuleError)
      // Published rows stay immutable (the guard trigger's message is the query error's cause).
      const refused = await as(lead)
        .db.execute(
          sql`update lawful_basis set name = name where release_id = ${published?.id ?? ''}`,
        )
        .then(
          () => null,
          (error: unknown) => error,
        )
      expect(messageOf(refused)).toMatch(/cannot be changed/)
    })
  })

  it('TC-C17.1-02 publishing needs a change, the review acknowledgement and no new broken references', async () => {
    await isolated(async (as) => {
      const published = (await releaseOverview(as(admin).db)).published
      await startDraft(as(lead), { version: '9.3.0' })
      await expect(publishDraft(as(lead), {})).rejects.toBeInstanceOf(AccessDeniedError)
      await expect(publishDraft(as(admin), {})).rejects.toThrow(/no changes/)
      await saveEntry(as(lead), 'sectors', {
        code: 'TST',
        title: 'Test sector',
        covers: 'Organisations used only in tests',
        regulators: 'Test regulator',
        keyPrincipals: 'Customer',
        hotspots: 'Test hotspot',
        laws: 'Test Act 2026 | Records of customers',
        retention: 'Customer file | 5 years | Test Act s.1 | verify',
      })
      await expect(publishDraft(as(admin), {})).rejects.toSatisfy(
        (error: unknown) => error instanceof ValidationError && 'acknowledge' in error.fieldErrors,
      )
      // A process pointing at a lawful basis that does not exist would break references.
      await as(lead).db.execute(sql`
        update process_template set typical_lawful_basis = array['no_such_basis']
        where code = 'HLT-01' and release_id = (select id from framework_release where version = '9.3.0')`)
      await expect(publishDraft(as(admin), { acknowledge: 'on' })).rejects.toThrow(/no_such_basis/)
      await as(lead).db.execute(sql`
        update process_template p set typical_lawful_basis = o.typical_lawful_basis
        from process_template o
        where p.code = 'HLT-01' and o.code = 'HLT-01' and o.release_id = ${published?.id ?? ''}
          and p.release_id = (select id from framework_release where version = '9.3.0')`)
      await publishDraft(as(admin), { acknowledge: 'on', notes: 'Adds a test sector' })
      const after = await releaseOverview(as(admin).db)
      expect(after.published?.version).toBe('9.3.0')
      expect(after.draft).toBeNull()
      expect(after.history.find((row) => row.id === published?.id)?.status).toBe('superseded')
      // Published entries keep their review label.
      const reviews = await releaseReviews(as(admin).db, after.published?.id ?? '', 'sectors')
      expect(reviews.map((row) => `${row.code}:${row.status}`)).toEqual(['TST:awaiting_review'])
    })
  })
})

describe('knowledge-base entries', () => {
  it('TC-C17.2-01 each editable section adds, edits and removes entries, with the change log and review status', async () => {
    await isolated(async (as) => {
      await startDraft(as(lead), { version: '9.4.0' })
      const draftId = (await releaseOverview(as(lead).db)).draft?.id ?? ''
      const cases = [
        {
          section: 'bases' as const,
          input: {
            code: 'ex17_9',
            name: 'Test exemption',
            reference: 's.17(9)',
            explanation: 'For tests.',
          },
          edit: {
            name: 'Test exemption, renamed',
            reference: 's.17(9)',
            explanation: 'For tests.',
          },
        },
        {
          section: 'data-elements' as const,
          input: {
            code: 'DE-ID-901',
            title: 'Test identifier',
            category: 'identity',
            personalData: 'yes',
            contextTags: ['gov_id'],
          },
          edit: {
            title: 'Test identifier',
            category: 'identity',
            personalData: 'yes',
            contextTags: [],
            note: 'Edited',
          },
        },
        {
          section: 'vocabularies' as const,
          input: {
            code: 'test-terms',
            title: 'Test terms',
            columns: 'Term\nMeaning\nSource',
            terms: 'Alpha | First | Act\nBeta',
          },
          edit: {
            title: 'Test terms',
            columns: 'Term\nMeaning\nSource',
            terms: 'Alpha | First | Act\nBeta | Second\nGamma',
          },
        },
        {
          section: 'processes' as const,
          input: {
            code: 'HLT-91',
            title: 'Test process',
            sectorCode: 'HLT',
            department: 'Testing',
            activities: 'Do a thing',
            typicalLawfulBasis: ['consent'],
            flags: ['children'],
            obligationCodes: ['OBL-CON-01'],
          },
          edit: {
            title: 'Test process',
            sectorCode: 'HLT',
            department: 'Testing',
            activities: 'Do a thing\nDo another',
            typicalLawfulBasis: ['consent'],
            flags: ['children'],
            obligationCodes: ['OBL-CON-01'],
          },
        },
        {
          section: 'sectors' as const,
          input: {
            code: 'TSU',
            title: 'Test sector',
            covers: 'Tests',
            laws: 'Law A | Why',
            retention: '',
          },
          edit: {
            title: 'Test sector',
            covers: 'Tests, edited',
            laws: 'Law A | Why',
            retention: 'File | 1 year | Law A | checked',
          },
        },
        {
          section: 'playbooks' as const,
          input: {
            code: 'test-guide',
            title: 'Test guide',
            docType: 'guide',
            bodyMd: '# Test\n\nBody.',
          },
          edit: { title: 'Test guide', docType: 'reference', bodyMd: '# Test\n\nBody, edited.' },
        },
      ]
      for (const item of cases) {
        const { code } = await saveEntry(as(lead), item.section, item.input)
        expect(code).toBe(item.input.code)
        await saveEntry(as(lead), item.section, item.edit, code)
        const form = await entryForm(as(lead), item.section, { code })
        // What the editor shows is what was saved (lists compare as sets of lines).
        for (const [key, value] of Object.entries(item.edit)) {
          const shown = form.values[key]
          const normalise = (raw: unknown) =>
            (Array.isArray(raw)
              ? raw
              : (typeof raw === 'string' ? raw : '').split('\n').filter(Boolean)
            )
              .map((line) => String(line).replace(/\s*\|\s*/g, ' | '))
              .sort()
          expect(normalise(shown), `${item.section}.${key}`).toEqual(normalise(value))
        }
      }
      // Every change is logged with who made it, and every entry awaits review. (Inside one
      // test transaction all timestamps are equal, so the log is compared as a set.)
      const changes = await releaseChanges(as(lead).db, draftId)
      expect(changes.map((row) => `${row.section}/${row.code}:${row.change}`).sort()).toEqual(
        cases
          .flatMap((item) => [
            `${item.section}/${item.input.code}:added`,
            `${item.section}/${item.input.code}:edited`,
          ])
          .sort(),
      )
      expect(new Set(changes.map((row) => row.actorName))).toEqual(new Set(['KB Lead']))
      const reviews = await releaseReviews(as(lead).db, draftId)
      expect(reviews.filter((row) => row.status === 'awaiting_review')).toHaveLength(cases.length)
      // The sector overlay lists its processes automatically.
      const [hlt] = await as(lead).db.execute<{ codes: string[] }>(
        sql`select process_template_codes as codes from sector_overlay where release_id = ${draftId} and code = 'HLT'`,
      )
      expect(hlt?.codes).toContain('HLT-91')
      // Review: only firm administrators sign off.
      await expect(markReviewed(as(lead), 'playbooks', 'test-guide', {})).rejects.toBeInstanceOf(
        AccessDeniedError,
      )
      await markReviewed(as(admin), 'playbooks', 'test-guide', { note: 'Checked' })
      expect(
        (await releaseReviews(as(admin).db, draftId, 'playbooks')).find(
          (row) => row.code === 'test-guide',
        )?.status,
      ).toBe('reviewed')
      // Removal is refused while something depends on the entry, then allowed.
      await expect(removeEntry(as(lead), 'sectors', 'HLT')).rejects.toThrow(/process template/)
      await expect(removeEntry(as(lead), 'bases', 'consent')).rejects.toThrow(/used by/)
      for (const item of cases) await removeEntry(as(lead), item.section, item.input.code)
      expect(await releaseReviews(as(lead).db, draftId)).toEqual([])
    })
  })

  it('TC-C17.2-02 suggested obligations follow the obligation triggers', async () => {
    const obligations: { code: string; trigger: ObligationTrigger }[] = [
      { code: 'A', trigger: { always: true } },
      { code: 'B', trigger: { basis: ['consent'] } },
      { code: 'C', trigger: { flags: ['children'] } },
      { code: 'D', trigger: { basis: ['consent'], flags: ['legacy_data'] } },
      { code: 'E', trigger: { role: ['sdf'] } },
      { code: 'F', trigger: { basis: ['s7a', 'consent'] } },
    ]
    expect(triggeredObligations(obligations, ['consent'], [])).toEqual(['B', 'F'])
    expect(triggeredObligations(obligations, ['consent'], ['legacy_data'])).toEqual(['B', 'D', 'F'])
    expect(triggeredObligations(obligations, ['s7i'], ['children'])).toEqual(['C'])
    expect(triggeredObligations(obligations, [], [])).toEqual([])
    // Against the real draft: the suggestion for a consent-based process with children's data
    // equals the obligations whose triggers those facts satisfy, read directly.
    await isolated(async (as) => {
      await startDraft(as(lead), { version: '9.5.0' })
      const suggested = await suggestObligations(as(lead), {
        typicalLawfulBasis: ['consent'],
        flags: ['children'],
      })
      const oracle = await as(lead).db.execute<{ code: string }>(sql`
        select code from obligation
        where release_id = (select id from framework_release where version = '9.5.0')
          and regime <> 'Other Indian law'
          and coalesce((trigger->>'always')::boolean, false) = false
          and not (trigger ? 'role')
          and (trigger ? 'basis' or trigger ? 'flags')
          and (not (trigger ? 'basis') or trigger->'basis' ? 'consent')
          and (not (trigger ? 'flags') or trigger->'flags' ? 'children')
        order by code`)
      expect(suggested).toEqual(oracle.map((row) => row.code).sort())
      expect(suggested.length).toBeGreaterThan(5)
    })
  })

  it('TC-C17.2-03 only editors read the draft; everyone else reads the published release', async () => {
    await isolated(async (as) => {
      const published = (await releaseOverview(as(lead).db)).published
      await startDraft(as(lead), { version: '9.6.0' })
      const viewer = person('client_viewer', 'Client Viewer')
      const read = (who: Principal) =>
        createFrameworkLibraryApi({ db: as(who).db, principal: who, kbDraft: true }).release()
      expect((await read(lead)).version).toBe('9.6.0')
      expect((await read(admin)).version).toBe('9.6.0')
      expect((await read(viewer)).version).toBe(published?.version)
      await expect(startDraft(as(viewer), { version: '9.7.0' })).rejects.toBeInstanceOf(
        AccessDeniedError,
      )
      await expect(
        saveEntry(as(viewer), 'playbooks', {
          code: 'x-y',
          title: 'X',
          docType: 'guide',
          bodyMd: 'x',
        }),
      ).rejects.toThrow()
    })
  })
})
