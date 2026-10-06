import {
  assessment,
  assessmentItem,
  desc,
  eq,
  finding,
  frameworkRelease,
  question,
  type Database,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { answerItem, getAssessment } from './assessments'
import { moveCycleToLatestRelease } from './cycleRelease'
import { createDepartment } from './departments'
import { RuleError } from './errors'
import { closeWorld, newClient, openWorld, type World } from './testing'

let world: World

beforeAll(() => {
  world = openWorld()
})
afterAll(async () => {
  await closeWorld(world)
})

class Rollback extends Error {}

type QuestionRow = typeof question.$inferSelect

/** Publishes a copy of a release's questions, changed by `edit`, later than every other release. */
const publishCopy = async (
  db: Database,
  fromId: string,
  version: string,
  at: Date,
  edit: (rows: QuestionRow[]) => QuestionRow[],
) => {
  // Content goes in while the release is a draft; published releases are immutable.
  const [created] = await db
    .insert(frameworkRelease)
    .values({ version, status: 'draft', source: 'test copy', createdBy: 'test' })
    .returning({ id: frameworkRelease.id })
  const id = created?.id ?? ''
  const rows = await db.select().from(question).where(eq(question.releaseId, fromId))
  await db.insert(question).values(edit(rows).map((row) => ({ ...row, releaseId: id })))
  await db
    .update(frameworkRelease)
    .set({ status: 'published', publishedBy: 'test', publishedAt: at })
    .where(eq(frameworkRelease.id, id))
  return id
}

describe('moving an open cycle to a newer question bank', () => {
  it('TC-C20.8-01 items follow their question across renumbering, keep fitting answers and findings, and nothing answered is lost', async () => {
    const client = await newClient(world, 'Move')
    await expect(
      world.owner.db.transaction(async (tx) => {
        const db = tx as unknown as Database
        const ctx = { ...world.ctx, db }
        const codes = ['A1.1', 'A1.3', 'A1.5', 'A1.6', 'B0.2']
        await createDepartment(ctx, client.id, { code: 'HR', name: 'HR', questions: codes })
        const [cycle] = await db.select().from(assessment).where(eq(assessment.tenantId, client.id))
        const items = await db
          .select()
          .from(assessmentItem)
          .where(eq(assessmentItem.assessmentId, cycle?.id ?? ''))
        const itemOf = (code: string) => items.find((row) => row.questionCode === code)?.id ?? ''
        await answerItem(ctx, client.id, itemOf('A1.1'), { answer: 'no' })
        await answerItem(ctx, client.id, itemOf('A1.3'), { answer: '3' })
        await answerItem(ctx, client.id, itemOf('B0.2'), { answer: 'Consent' })
        const [current] = await db
          .select({ id: frameworkRelease.id, version: frameworkRelease.version })
          .from(frameworkRelease)
          .where(eq(frameworkRelease.status, 'published'))
          .orderBy(desc(frameworkRelease.publishedAt))
          .limit(1)
        const fromId = current?.id ?? ''
        const swapped = (code: string) =>
          code === 'A1.1' ? 'A1.6' : code === 'A1.6' ? 'A1.1' : code

        // A release that drops an answered question is refused, and nothing changes.
        await publishCopy(db, fromId, '9.0.0', new Date(Date.now() + 60_000), (rows) =>
          rows.filter((row) => row.code !== 'A1.3'),
        )
        await expect(moveCycleToLatestRelease(ctx, client.id, cycle?.code ?? '')).rejects.toThrow(
          /HR A1\.3/,
        )
        expect((await getAssessment(ctx, client.id, cycle?.code ?? '')).releaseVersion).toBe(
          current?.version,
        )

        // A newer one: A1.1 and A1.6 swap codes, A1.5 is dropped, B0.2 loses the option chosen.
        await publishCopy(db, fromId, '9.1.0', new Date(Date.now() + 120_000), (rows) =>
          rows
            .filter((row) => row.code !== 'A1.5')
            .map((row) => ({
              ...row,
              code: swapped(row.code),
              options:
                row.code === 'B0.2'
                  ? row.options.filter((option) => option.value !== 'Consent')
                  : row.options,
            })),
        )
        expect((await getAssessment(ctx, client.id, cycle?.code ?? '')).latestRelease).toBe('9.1.0')
        const moved = await moveCycleToLatestRelease(ctx, client.id, cycle?.code ?? '')
        expect(moved).toEqual({
          from: current?.version,
          to: '9.1.0',
          kept: 4,
          renumbered: 2,
          removed: 1,
          cleared: ['HR B0.2'],
        })
        const after = await db
          .select()
          .from(assessmentItem)
          .where(eq(assessmentItem.assessmentId, cycle?.id ?? ''))
        const byId = new Map(after.map((row) => [row.id, row]))
        // The item answered under A1.1 is the same item, now under the code its question has.
        expect(byId.get(itemOf('A1.1'))).toMatchObject({ questionCode: 'A1.6', answer: 'no' })
        expect(byId.get(itemOf('A1.6'))).toMatchObject({
          questionCode: 'A1.1',
          answer: 'not_assessed',
        })
        expect(byId.get(itemOf('A1.3'))).toMatchObject({ questionCode: 'A1.3', answer: 'yes' })
        expect(byId.get(itemOf('B0.2'))).toMatchObject({ answer: 'not_assessed', response: null })
        expect(byId.has(itemOf('A1.5'))).toBe(false)
        const [raised] = await db
          .select()
          .from(finding)
          .where(eq(finding.itemId, itemOf('A1.1')))
        expect(raised?.questionCode).toBe('A1.6')
        const detail = await getAssessment(ctx, client.id, cycle?.code ?? '')
        expect([detail.releaseVersion, detail.latestRelease]).toEqual(['9.1.0', null])
        await expect(
          moveCycleToLatestRelease(ctx, client.id, cycle?.code ?? ''),
        ).rejects.toBeInstanceOf(RuleError)
        throw new Rollback()
      }),
    ).rejects.toBeInstanceOf(Rollback)
  })
})
