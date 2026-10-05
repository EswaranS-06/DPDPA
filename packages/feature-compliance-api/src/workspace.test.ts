import { randomBytes } from 'node:crypto'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  assessmentItem,
  count,
  eq,
  evidence,
  evidenceRequest,
  finding,
  inArray,
  lt,
  ne,
  notExists,
  notInArray,
  remediationAction,
  risk,
  sql,
  withTenants,
  type ActionStatus,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { answerItem, checkItem } from './assessments'
import { requestEvidence } from './assignments'
import { attentionFor, type AttentionItem, type AttentionKind } from './attention'
import { uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { listBands } from './risks'
import { searchWorkspace } from './search'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  newPerson,
  openWorld,
  pdf,
  type World,
} from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

const WORKABLE: ActionStatus[] = ['open', 'assigned', 'in_progress', 'pending_evidence', 'rejected']

/**
 * A client with HR and IT departments: answers in both, one IT answer ticked as checked, an
 * overdue IT action owned by the IT head, an HR action due later, a file from the HR head
 * waiting for review and evidence requested from the IT head.
 */
const scenario = async () => {
  const client = await newClient(world, 'Workspace')
  const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'A1.3', 'A1.6'])
  const tech = await newDepartment(world, client.id, 'IT', ['A8.1', 'A8.2', 'A8.4', 'A8.6'])
  const plan: [typeof hr, string, string][] = [
    [hr, 'A1.1', 'no'],
    [hr, 'A1.3', '2'],
    [tech, 'A8.1', 'no'],
    [tech, 'A8.2', '4'],
    [tech, 'A8.4', 'no'],
  ]
  for (const [dep, code, answer] of plan) {
    await answerItem(world.ctx, client.id, dep.item(code).id, { answer })
  }
  await checkItem(world.ctx, client.id, tech.item('A8.2').id, { checked: 'true' })
  const itHead = await newPerson(world, 'department_owner', {
    clientId: client.id,
    departmentId: tech.id,
  })
  const hrHead = await newPerson(world, 'department_owner', {
    clientId: client.id,
    departmentId: hr.id,
  })
  const findings = await listFindings(world.ctx, client.id)
  const techFinding = findings.find((row) => row.questionCode === 'A8.1')
  const hrFinding = findings.find((row) => row.questionCode === 'A1.1')
  await createAction(world.ctx, client.id, techFinding?.id ?? '', {
    title: 'Encrypt the backups',
    ownerUserId: itHead.userId,
    dueDate: '2020-03-31',
  })
  await createAction(world.ctx, client.id, hrFinding?.id ?? '', {
    title: 'Adopt the charter',
    dueDate: '2099-03-31',
  })
  await uploadEvidence(
    world.ctx,
    client.id,
    { title: 'Backup report', itemIds: tech.item('A8.2').id },
    { name: 'backup.pdf', bytes: pdf('backup') },
  )
  await uploadEvidence(
    as(world, hrHead),
    client.id,
    { title: 'Draft charter', departmentId: hr.id },
    { name: 'charter.pdf', bytes: pdf('charter') },
  )
  await requestEvidence(world.ctx, client.id, tech.item('A8.1').id, {
    titles: ['Encryption settings'],
    assigneeUserId: itHead.userId,
  })
  return { client, hr, tech, itHead }
}

/** The same work counted straight from the tables, as an independent oracle. */
const directCounts = async (clientId: string, departmentId: string | null, userId: string) => {
  const today = isoDate(new Date())
  const bands = (await listBands(world.owner.db)).filter((band) => band.tone === 'severe')
  return withTenants(world.owner.db, 'all', async (tx) => {
    const n = async (query: Promise<{ n: number }[]>) => (await query)[0]?.n ?? 0
    const inDepartment = departmentId ? eq(assessmentItem.departmentId, departmentId) : undefined
    const items = (condition: ReturnType<typeof and>) =>
      n(
        tx
          .select({ n: count() })
          .from(assessmentItem)
          .where(and(eq(assessmentItem.tenantId, clientId), condition, inDepartment)),
      )
    const actions = (condition: ReturnType<typeof and>) =>
      n(
        tx
          .select({ n: count() })
          .from(remediationAction)
          .where(and(eq(remediationAction.tenantId, clientId), condition)),
      )
    return {
      overdue_actions: await actions(
        and(
          lt(remediationAction.dueDate, today),
          notInArray(remediationAction.status, ['closed', 'accepted_risk', 'remediated']),
          departmentId ? eq(remediationAction.departmentId, departmentId) : undefined,
        ),
      ),
      answers_to_check: await items(
        and(ne(assessmentItem.answer, 'not_assessed'), ne(assessmentItem.reviewState, 'accepted')),
      ),
      evidence_to_review: await n(
        tx
          .select({ n: count() })
          .from(evidence)
          .where(and(eq(evidence.tenantId, clientId), eq(evidence.status, 'pending_review'))),
      ),
      evidence_requested: await n(
        tx
          .select({ n: count() })
          .from(evidenceRequest)
          .where(
            and(eq(evidenceRequest.tenantId, clientId), eq(evidenceRequest.status, 'requested')),
          ),
      ),
      findings_without_actions: await n(
        tx
          .select({ n: count() })
          .from(finding)
          .where(
            and(
              eq(finding.tenantId, clientId),
              eq(finding.status, 'open'),
              notExists(
                tx
                  .select({ one: sql`1` })
                  .from(remediationAction)
                  .where(eq(remediationAction.findingId, finding.id)),
              ),
            ),
          ),
      ),
      serious_risks: await n(
        tx
          .select({ n: count() })
          .from(risk)
          .where(
            and(
              eq(risk.tenantId, clientId),
              eq(risk.status, 'open'),
              sql`(${sql.join(
                bands.map(
                  (band) => sql`${risk.score} between ${band.minScore} and ${band.maxScore}`,
                ),
                sql` or `,
              )})`,
            ),
          ),
      ),
      unanswered: await items(and(eq(assessmentItem.answer, 'not_assessed'))),
      actions_under_way: await actions(and(inArray(remediationAction.status, WORKABLE))),
      my_actions: await actions(
        and(eq(remediationAction.ownerUserId, userId), inArray(remediationAction.status, WORKABLE)),
      ),
      my_requests: await n(
        tx
          .select({ n: count() })
          .from(evidenceRequest)
          .where(
            and(
              eq(evidenceRequest.tenantId, clientId),
              eq(evidenceRequest.assigneeUserId, userId),
              eq(evidenceRequest.status, 'requested'),
            ),
          ),
      ),
    }
  })
}

const byKind = (items: AttentionItem[], clientId: string) => {
  const found: Partial<Record<AttentionKind, number>> = {}
  for (const item of items.filter((row) => row.clientId === clientId)) {
    found[item.kind] = (found[item.kind] ?? 0) + item.count
  }
  return found
}

const pick = (counts: Record<string, number>, kinds: AttentionKind[]) =>
  Object.fromEntries(
    kinds.flatMap((kind) => ((counts[kind] ?? 0) > 0 ? [[kind, counts[kind]]] : [])),
  )

describe('workspace: attention and search', () => {
  it('TC-C16.3-01 what needs attention equals direct counts, and only what each role can act on', async () => {
    const { client, tech, itHead } = await scenario()

    // The senior auditor answers, checks, reviews, plans and tracks every kind of work.
    const leadDirect = await directCounts(client.id, null, world.ctx.principal.userId)
    expect(byKind(await attentionFor(world.ctx, [client.id]), client.id)).toEqual(
      pick(leadDirect, [
        'overdue_actions',
        'answers_to_check',
        'evidence_to_review',
        'evidence_requested',
        'serious_risks',
        'findings_without_actions',
        'unanswered',
        'actions_under_way',
      ]),
    )
    expect([
      leadDirect.overdue_actions,
      leadDirect.answers_to_check,
      leadDirect.evidence_to_review,
      leadDirect.evidence_requested,
    ]).toEqual([1, 4, 1, 1])

    // The IT head sees the overdue IT action, their own action and the evidence asked of them;
    // no answering or reviewing.
    const itDirect = await directCounts(client.id, tech.id, itHead.userId)
    expect(byKind(await attentionFor(as(world, itHead)), client.id)).toEqual(
      pick(itDirect, ['overdue_actions', 'my_actions', 'my_requests']),
    )
    expect([itDirect.my_actions, itDirect.my_requests]).toEqual([1, 1])

    // The DPO follows actions and decides on serious risks.
    const dpo = await newPerson(world, 'client_dpo', { clientId: client.id })
    const dpoDirect = await directCounts(client.id, null, dpo.userId)
    expect(byKind(await attentionFor(as(world, dpo)), client.id)).toEqual(
      pick(dpoDirect, ['overdue_actions', 'serious_risks']),
    )
  })

  it('TC-C16.5-01 search finds records by code or title, only in clients the user can open', async () => {
    const word = `Findme${randomBytes(3).toString('hex')}`
    const mine = await newClient(world, `${word} Clinic`)
    const other = await newClient(world, `${word} Hospital`)
    for (const client of [mine, other]) {
      const dep = await newDepartment(world, client.id, 'OPS', ['A1.1'])
      await answerItem(world.ctx, client.id, dep.item('A1.1').id, { answer: 'no' })
    }
    const [mineFinding] = await listFindings(world.ctx, mine.id)
    const dpo = as(world, await newPerson(world, 'client_dpo', { clientId: mine.id }))

    const forDpo = await searchWorkspace(dpo, word)
    expect(new Set(forDpo.map((hit) => hit.clientCode))).toEqual(new Set([mine.code]))
    expect(forDpo.some((hit) => hit.kind === 'client' && hit.code === mine.code)).toBe(true)
    // The other client's records do not appear, even by their exact code. (Its code can also
    // occur in the DPO's own client's name, which may then match, so look at whose hits they are.)
    const byOtherCode = await searchWorkspace(dpo, other.code)
    expect(byOtherCode.filter((hit) => hit.clientCode !== mine.code)).toEqual([])

    const forLead = await searchWorkspace(world.ctx, word)
    expect(new Set(forLead.map((hit) => hit.clientCode))).toEqual(new Set([mine.code, other.code]))
    const byCode = await searchWorkspace(dpo, mineFinding?.code ?? 'none')
    expect(byCode.map((hit) => [hit.kind, hit.code, hit.href])).toEqual([
      ['finding', mineFinding?.code, `/clients/${mine.code}/findings/${mineFinding?.code}`],
    ])
    // Too short a query returns nothing rather than everything.
    expect(await searchWorkspace(world.ctx, 'S')).toEqual([])
  })
})
