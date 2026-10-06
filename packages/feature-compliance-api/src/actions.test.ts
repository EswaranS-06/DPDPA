import { assessment, eq, withTenants } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ACTION_FLOW,
  createAction,
  createReassessment,
  getAction,
  linkActionEvidence,
  transitionAction,
} from './actions'
import { answerItem, listItems } from './assessments'
import { RuleError, type ValidationError } from './errors'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { acceptRisk, listRisks } from './risks'
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

const setupFinding = async () => {
  const client = await newClient(world, 'Remediation')
  const tech = await newDepartment(world, client.id, 'IT', ['A1.1', 'A8.2', 'B0.10'])
  await answerItem(world.ctx, client.id, tech.item('A1.1').id, { answer: 'no' })
  const [found] = await listFindings(world.ctx, client.id)
  return { client, department: tech, finding: found }
}

describe('remediation workflow', () => {
  it('TC-C9.1-01 accepts only the allowed status transitions', async () => {
    const { client, finding } = await setupFinding()
    const created = await createAction(world.ctx, client.id, finding?.id ?? '', {
      title: 'Publish the DPO contact',
    })
    const move = (to: string) => transitionAction(world.ctx, client.id, created.id, { to })

    await expect(move('closed')).rejects.toBeInstanceOf(RuleError)
    await expect(move('in_progress')).rejects.toBeInstanceOf(RuleError)
    await expect(move('accepted_risk')).rejects.toBeInstanceOf(RuleError)
    await expect(move('assigned')).resolves.toBe('assigned')
    await expect(move('under_review')).rejects.toBeInstanceOf(RuleError)
    await expect(move('in_progress')).resolves.toBe('in_progress')

    const reachable = new Set(
      Object.values(ACTION_FLOW).flatMap((steps) => steps.map((step) => step.to)),
    )
    expect(reachable.has('accepted_risk')).toBe(false)
    expect(ACTION_FLOW.closed).toEqual([])

    // Recording the client's acceptance of the risk is the only way to Accepted Risk.
    const [linkedRisk] = await listRisks(world.ctx, client.id)
    await acceptRisk(world.ctx, client.id, linkedRisk?.id ?? '', {
      note: 'Accepted by the client DPO until the March migration.',
    })
    const detail = await getAction(world.ctx, client.id, created.code)
    expect(detail.status).toBe('accepted_risk')
    expect(detail.events.map((event) => event.toStatus)).toEqual([
      'open',
      'assigned',
      'in_progress',
      'accepted_risk',
    ])
  })
})

describe('verification', () => {
  it('TC-C9.2-01 refuses verifying or closing without accepted evidence, and owners are people of the client', async () => {
    const { client, department, finding } = await setupFinding()
    const itHead = await newPerson(world, 'department_owner', {
      clientId: client.id,
      departmentId: department.id,
    })
    const stranger = await newPerson(world, 'department_owner', {
      clientId: (await newClient(world, 'Other')).id,
    })
    const refused = (await createAction(world.ctx, client.id, finding?.id ?? '', {
      title: 'Publish the DPO contact',
      ownerUserId: stranger.userId,
    }).catch((error: unknown) => error)) as ValidationError
    expect(Object.keys(refused.fieldErrors)).toEqual(['ownerUserId'])

    const created = await createAction(world.ctx, client.id, finding?.id ?? '', {
      title: 'Publish the DPO contact',
      ownerUserId: itHead.userId,
      dueDate: '2026-12-31',
    })
    expect((await getAction(world.ctx, client.id, created.code)).status).toBe('assigned')
    const move = (to: string, who = world.ctx) =>
      transitionAction(who, client.id, created.id, { to })
    // The owner at the client moves their action on and attaches the evidence.
    await move('in_progress', as(world, itHead))
    await expect(move('under_review', as(world, itHead))).rejects.toThrow('Attach evidence')
    const uploaded = await uploadEvidence(
      as(world, itHead),
      client.id,
      { title: 'Website screenshot', departmentId: department.id },
      { name: 'contact.pdf', bytes: pdf('contact') },
    )
    await linkActionEvidence(as(world, itHead), client.id, created.id, uploaded.id)
    await move('under_review', as(world, itHead))
    // A file from the client waits for the audit team's review before the fix can be verified.
    await expect(move('remediated')).rejects.toThrow('must be accepted first')
    await reviewEvidence(world.ctx, client.id, uploaded.id, { decision: 'accepted' })
    await expect(move('remediated')).resolves.toBe('remediated')
    await expect(move('closed', as(world, itHead))).rejects.toThrow()
    await expect(move('closed')).resolves.toBe('closed')
    const detail = await getAction(world.ctx, client.id, created.code)
    expect([detail.status, detail.verifiedBy, detail.ownerName]).toEqual([
      'closed',
      world.ctx.principal.userId,
      'Test department_owner',
    ])
  })
})

describe('re-assessment', () => {
  it('TC-C9.3-01 links the next cycle to the previous one and refuses it before completion', async () => {
    const { client, department } = await setupFinding()
    const cycleId = department.cycle?.id ?? ''
    await expect(
      createReassessment(world.ctx, client.id, cycleId, { title: 'Too early' }),
    ).rejects.toBeInstanceOf(RuleError)
    await withTenants(world.owner.db, 'all', (tx) =>
      tx.update(assessment).set({ status: 'completed' }).where(eq(assessment.id, cycleId)),
    )
    const next = await createReassessment(world.ctx, client.id, cycleId, { title: 'Cycle 2' })
    const [row] = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ previous: assessment.previousAssessmentId })
        .from(assessment)
        .where(eq(assessment.id, next.id)),
    )
    expect(row?.previous).toBe(cycleId)
    const items = await listItems(world.ctx, client.id, next.id)
    expect(items.map((item) => item.questionCode).sort()).toEqual(['A1.1', 'A8.2', 'B0.10'])
    expect(items.every((item) => item.answer === 'not_assessed')).toBe(true)
  })
})
