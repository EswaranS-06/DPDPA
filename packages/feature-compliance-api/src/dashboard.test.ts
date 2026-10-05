import { randomUUID } from 'node:crypto'
import type { Principal, Role } from '@duatf/core-access'
import {
  and,
  assessmentItem,
  count,
  eq,
  evidence,
  finding,
  inArray,
  lt,
  ne,
  notInArray,
  remediationAction,
  risk,
  withTenants,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { answerItem } from './assessments'
import { getClient } from './clients'
import { homeFor, portfolio } from './dashboard'
import { NotFoundError } from './errors'
import { uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { listBands, ratingFor } from './risks'
import { as, closeWorld, newClient, newDepartment, openWorld, pdf, type World } from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

const person = (role: Role, clientId: string | null = null): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId: null }],
})

describe('portfolio dashboard', () => {
  it('TC-C10.1-01 shows figures equal to direct counts', async () => {
    const busy = await newClient(world, 'Portfolio')
    const quiet = await newClient(world, 'Quiet')
    const codes = ['A1.1', 'A1.6', 'A2.3', 'A3.1', 'A3.2', 'A3.3', 'A3.4']
    const ops = await newDepartment(world, busy.id, 'OPS', codes)
    const answers = ['no', 'no', 'no', 'partial', 'partial', 'yes', 'not_applicable']
    for (const [index, answer] of answers.entries()) {
      await answerItem(world.ctx, busy.id, ops.item(codes[index] ?? '').id, {
        answer,
        naReason: 'Outside the scope agreed.',
      })
    }
    const [first] = await listFindings(world.ctx, busy.id)
    await createAction(world.ctx, busy.id, first?.id ?? '', {
      title: 'Late fix',
      dueDate: '2020-01-31',
    })
    await createAction(world.ctx, busy.id, first?.id ?? '', {
      title: 'Future fix',
      dueDate: '2099-01-31',
    })
    // A file from the client waits for review.
    await uploadEvidence(
      as(world, person('client_dpo', busy.id)),
      busy.id,
      { title: 'Pending policy' },
      { name: 'p.pdf', bytes: pdf('pending') },
    )

    const view = await portfolio(world.ctx)
    const bands = await listBands(world.owner.db)
    const today = new Date().toISOString().slice(0, 10)
    for (const client of [busy, quiet]) {
      const row = view.rows.find((item) => item.id === client.id)
      const direct = await withTenants(world.owner.db, 'all', async (tx) => {
        const one = async (query: Promise<{ n: number }[]>) => (await query)[0]?.n ?? 0
        const gaps = await one(
          tx
            .select({ n: count() })
            .from(finding)
            .where(
              and(
                eq(finding.tenantId, client.id),
                eq(finding.status, 'open'),
                eq(finding.gapType, 'gap'),
              ),
            ),
        )
        const potential = await one(
          tx
            .select({ n: count() })
            .from(finding)
            .where(
              and(
                eq(finding.tenantId, client.id),
                eq(finding.status, 'open'),
                eq(finding.gapType, 'potential_gap'),
              ),
            ),
        )
        const scores = await tx
          .select({ score: risk.score })
          .from(risk)
          .where(and(eq(risk.tenantId, client.id), inArray(risk.status, ['open', 'treated'])))
        const overdue = await one(
          tx
            .select({ n: count() })
            .from(remediationAction)
            .where(
              and(
                eq(remediationAction.tenantId, client.id),
                lt(remediationAction.dueDate, today),
                notInArray(remediationAction.status, ['closed', 'accepted_risk', 'remediated']),
              ),
            ),
        )
        const answered = await one(
          tx
            .select({ n: count() })
            .from(assessmentItem)
            .where(
              and(
                eq(assessmentItem.tenantId, client.id),
                ne(assessmentItem.answer, 'not_assessed'),
              ),
            ),
        )
        const pending = await one(
          tx
            .select({ n: count() })
            .from(evidence)
            .where(and(eq(evidence.tenantId, client.id), eq(evidence.status, 'pending_review'))),
        )
        const byBand: Record<string, number> = Object.fromEntries(
          bands.map((band) => [band.name, 0]),
        )
        for (const { score } of scores)
          byBand[ratingFor(score, bands).name] = (byBand[ratingFor(score, bands).name] ?? 0) + 1
        return { gaps, potential, byBand, overdue, answered, pending }
      })
      expect(row?.openFindings, client.code).toEqual({
        gap: direct.gaps,
        potentialGap: direct.potential,
      })
      expect(row?.openRisksByBand, client.code).toEqual(direct.byBand)
      expect(row?.actions.overdue, client.code).toBe(direct.overdue)
      expect(row?.latestAssessment?.progress.answered ?? 0, client.code).toBe(direct.answered)
      expect(row?.evidenceAwaitingReview, client.code).toBe(direct.pending)
    }
    const busyRow = view.rows.find((item) => item.id === busy.id)
    expect([
      busyRow?.openFindings.gap,
      busyRow?.openFindings.potentialGap,
      busyRow?.actions.overdue,
      busyRow?.evidenceAwaitingReview,
    ]).toEqual([3, 2, 1, 1])
    expect(view.totals.openGaps).toBe(view.rows.reduce((sum, row) => sum + row.openFindings.gap, 0))
    expect(view.totals.overdueActions).toBe(
      view.rows.reduce((sum, row) => sum + row.actions.overdue, 0),
    )
  })
})

describe('client portal', () => {
  it('TC-C10.2-01 sends a client user to their own client and refuses another', async () => {
    const own = await newClient(world, 'Own')
    const other = await newClient(world, 'Other')
    const dpo = person('client_dpo', own.id)
    expect(homeFor(dpo, [own.code])).toBe(`/clients/${own.code}`)
    expect(homeFor(person('lead_auditor'), [own.code])).toBeNull()
    expect(
      homeFor(
        {
          ...dpo,
          assignments: [
            ...dpo.assignments,
            { role: 'client_viewer', clientId: other.id, departmentId: null },
          ],
        },
        [own.code, other.code],
      ),
    ).toBeNull()

    const view = await portfolio(as(world, dpo))
    expect(view.rows.map((row) => row.code)).toEqual([own.code])
    await expect(getClient(as(world, dpo), other.code)).rejects.toBeInstanceOf(NotFoundError)
  })
})
