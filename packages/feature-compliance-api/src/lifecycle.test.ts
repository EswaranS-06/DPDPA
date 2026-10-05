import {
  and,
  assessment,
  eq,
  finding,
  findingEvent,
  inArray,
  risk,
  withTenants,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createAction,
  createReassessment,
  getAction,
  linkActionEvidence,
  transitionAction,
} from './actions'
import { answerItem, listItems } from './assessments'
import { clientFigures } from './dashboard'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { acceptRisk, listRisks, updateRisk } from './risks'
import {
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

/** Takes an action from Assigned to Closed with accepted evidence, as the workflow requires. */
const remediate = async (clientId: string, actionId: string) => {
  const move = (to: string) => transitionAction(world.ctx, clientId, actionId, { to })
  await move('in_progress')
  const file = await uploadEvidence(
    world.ctx,
    clientId,
    { title: 'Proof of the fix' },
    { name: 'fix.pdf', bytes: pdf(actionId) },
  )
  await linkActionEvidence(world.ctx, clientId, actionId, file.id)
  await move('under_review')
  await reviewEvidence(world.ctx, clientId, file.id, { decision: 'accepted' })
  await move('remediated')
  return move('closed')
}

const findingById = (id: string) =>
  withTenants(
    world.owner.db,
    'all',
    async (tx) => (await tx.select().from(finding).where(eq(finding.id, id)))[0],
  )

const riskOf = (findingId: string) =>
  withTenants(
    world.owner.db,
    'all',
    async (tx) => (await tx.select().from(risk).where(eq(risk.findingId, findingId)))[0],
  )

describe('finding closure', () => {
  it('TC-C9.4-01 closes a finding and its risk when the last action is verified and closed', async () => {
    const client = await newClient(world, 'Closure')
    const hr = await newDepartment(world, client.id, 'HR', ['A1.3'])
    const owner = await newPerson(world, 'department_owner', {
      clientId: client.id,
      departmentId: hr.id,
    })
    await answerItem(world.ctx, client.id, hr.item('A1.3').id, { answer: '1' })
    const [gap] = await listFindings(world.ctx, client.id)
    expect(gap?.gapType).toBe('gap')
    const first = await createAction(world.ctx, client.id, gap?.id ?? '', {
      title: 'Write the policy',
      ownerUserId: owner.userId,
    })
    const second = await createAction(world.ctx, client.id, gap?.id ?? '', {
      title: 'Take it to the Board',
      ownerUserId: owner.userId,
    })

    await remediate(client.id, first.id)
    expect((await findingById(gap?.id ?? ''))?.status).toBe('open')
    await remediate(client.id, second.id)
    const closed = await findingById(gap?.id ?? '')
    expect([closed?.status, closed?.closedReason?.startsWith('Remediated')]).toEqual([
      'closed',
      true,
    ])
    expect((await riskOf(gap?.id ?? ''))?.status).toBe('closed')
    const kinds = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ kind: findingEvent.kind })
        .from(findingEvent)
        .where(eq(findingEvent.findingId, gap?.id ?? '')),
    )
    expect(kinds.map((row) => row.kind)).toEqual(['opened', 'remediated'])

    // A later low maturity on the same question reopens the finding: the answer is the evidence.
    await answerItem(world.ctx, client.id, hr.item('A1.3').id, { answer: '0' })
    expect((await findingById(gap?.id ?? ''))?.status).toBe('open')
  })

  it('TC-C9.4-02 lets a re-assessment resolve or carry forward earlier findings, per department, without double counting', async () => {
    const client = await newClient(world, 'Carry')
    const codes = ['A1.1', 'A1.3', 'A2.1', 'A8.2']
    const hr = await newDepartment(world, client.id, 'HR', codes)
    const fin = await newDepartment(world, client.id, 'FIN', ['A1.1'])
    const owner = await newPerson(world, 'department_owner', {
      clientId: client.id,
      departmentId: hr.id,
    })
    // A1.1 no, A1.3 maturity 2 (partial), A2.1 maturity 0 (gap), A8.2 maturity 2 (partial).
    const plan = { 'A1.1': 'no', 'A1.3': '2', 'A2.1': '0', 'A8.2': '2' } as const
    for (const code of codes) {
      await answerItem(world.ctx, client.id, hr.item(code).id, {
        answer: plan[code as keyof typeof plan],
      })
    }
    // Finance answers A1.1 Yes: a different department, so no finding of HR is touched by it.
    await answerItem(world.ctx, client.id, fin.item('A1.1').id, { answer: 'yes' })
    const first = await listFindings(world.ctx, client.id)
    expect(first).toHaveLength(4)
    const byQuestion = (rows: typeof first, code: string) =>
      rows.find((row) => row.questionCode === code)
    const f13 = byQuestion(first, 'A1.3')
    const f82 = byQuestion(first, 'A8.2')

    // The auditor re-rates one risk and plans an action; the client accepts another risk.
    const risks = await listRisks(world.ctx, client.id)
    const r13 = risks.find((row) => row.findingCode === f13?.code)
    await updateRisk(world.ctx, client.id, r13?.id ?? '', {
      likelihood: 5,
      impact: 5,
      treatment: 'mitigate',
      status: 'open',
      ownerName: 'Head of IT',
    })
    const action = await createAction(world.ctx, client.id, f13?.id ?? '', {
      title: 'Fix it properly',
      ownerUserId: owner.userId,
    })
    await transitionAction(world.ctx, client.id, action.id, { to: 'in_progress' })
    const r82 = risks.find((row) => row.findingCode === f82?.code)
    await acceptRisk(world.ctx, client.id, r82?.id ?? '', {
      note: 'Accepted until the new system goes live.',
    })

    const cycleId = hr.cycle?.id ?? ''
    await withTenants(world.owner.db, 'all', (tx) =>
      tx.update(assessment).set({ status: 'completed' }).where(eq(assessment.id, cycleId)),
    )
    const next = await createReassessment(world.ctx, client.id, cycleId, { title: 'Cycle 2' })
    const nextItems = await listItems(world.ctx, client.id, next.id, { department: hr.id })
    const itemFor = (code: string) => nextItems.find((item) => item.questionCode === code)?.id ?? ''
    expect((await listFindings(world.ctx, client.id, { status: 'open' })).length).toBe(4)

    await answerItem(world.ctx, client.id, itemFor('A1.1'), { answer: 'yes' })
    await answerItem(world.ctx, client.id, itemFor('A1.3'), { answer: '1' })
    await answerItem(world.ctx, client.id, itemFor('A8.2'), { answer: '2' })

    const after = await listFindings(world.ctx, client.id)
    const open = after.filter((row) => row.status === 'open')
    // A1.1 resolved, A1.3 and A8.2 carried forward to cycle 2, A2.1 (not re-answered) stays open.
    expect(open.map((row) => [row.questionCode, row.assessmentId]).sort()).toEqual(
      [
        ['A1.3', next.id],
        ['A2.1', cycleId],
        ['A8.2', next.id],
      ].sort(),
    )
    const old11 = after.find((row) => row.questionCode === 'A1.1' && row.assessmentId === cycleId)
    const old13 = after.find((row) => row.questionCode === 'A1.3' && row.assessmentId === cycleId)
    const new13 = after.find((row) => row.questionCode === 'A1.3' && row.assessmentId === next.id)
    const new82 = after.find((row) => row.questionCode === 'A8.2' && row.assessmentId === next.id)
    expect(old11?.closedReason).toBe(`Resolved in ${next.code} (answered compliant)`)
    expect(old13?.closedReason).toBe(`Carried forward to ${new13?.code ?? ''} (${next.code})`)
    expect(new13?.gapType).toBe('gap')

    // The unfinished action follows the gap, and the risk keeps its rating and acceptance.
    const moved = await getAction(world.ctx, client.id, action.code)
    expect([moved.findingId, moved.status]).toEqual([new13?.id, 'in_progress'])
    expect(moved.events.at(-1)?.note).toContain(`to ${new13?.code ?? ''}`)
    const carriedRisk = await riskOf(new13?.id ?? '')
    expect([carriedRisk?.likelihood, carriedRisk?.impact, carriedRisk?.ownerName]).toEqual([
      5,
      5,
      'Head of IT',
    ])
    const acceptedRisk = await riskOf(new82?.id ?? '')
    expect([acceptedRisk?.status, acceptedRisk?.acceptanceNote]).toEqual([
      'accepted',
      'Accepted until the new system goes live.',
    ])
    const closedRisks = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ status: risk.status })
        .from(risk)
        .where(
          and(
            eq(risk.tenantId, client.id),
            inArray(risk.findingId, [old11?.id ?? '', old13?.id ?? '']),
          ),
        ),
    )
    expect(closedRisks.map((row) => row.status)).toEqual(['closed', 'closed'])

    const figures = await clientFigures(world.ctx, client.id)
    expect(figures.openFindings.gap + figures.openFindings.potentialGap).toBe(open.length)
  })
})
