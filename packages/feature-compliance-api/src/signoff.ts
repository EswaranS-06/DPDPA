import { authorize, can, CAPABILITIES } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  appUser,
  asc,
  assessment,
  assessmentSignoff,
  desc,
  eq,
  inArray,
  isNull,
  or,
  roleAssignment,
  type SignoffSnapshot,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { assertReadyToComplete, cycleProgress } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import {
  NotFoundError,
  optionalDate,
  optionalText,
  parseInput,
  RuleError,
  ValidationError,
} from './errors'
import { qualityOf } from './quality'

// Sign-off of an assessment cycle (ADR-0009). Whoever may check answers sends the cycle to a
// named approver with a deadline; the cycle is then "in review" and its answers are locked.
// Only that approver approves (the cycle completes) or asks for changes (it reopens). A person
// who may sign off can also complete their own cycle directly.

const truthy = (value: unknown) =>
  value === true || value === 'true' || value === 'yes' || value === 'on'

/** People who may be asked to sign a cycle of this client off: active staff with a login. */
const approversOf = async (tx: Transaction, clientId: string) => {
  const roles = [...CAPABILITIES['assessment.signoff'].roles]
  return tx
    .selectDistinct({ userId: appUser.id, displayName: appUser.displayName })
    .from(appUser)
    .innerJoin(roleAssignment, eq(roleAssignment.userId, appUser.id))
    .where(
      and(
        eq(appUser.status, 'active'),
        eq(appUser.loginEnabled, true),
        inArray(roleAssignment.role, roles),
        or(isNull(roleAssignment.tenantId), eq(roleAssignment.tenantId, clientId)),
      ),
    )
    .orderBy(asc(appUser.displayName))
}

export const signoffApprovers = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, (tx) => approversOf(tx, clientId))
}

const cycleOf = async (tx: Transaction, clientId: string, assessmentId: string) => {
  const [found] = await tx
    .select()
    .from(assessment)
    .where(and(eq(assessment.id, assessmentId), eq(assessment.tenantId, clientId)))
  if (!found) throw new NotFoundError('Assessment')
  return found
}

const openRequest = async (tx: Transaction, assessmentId: string) => {
  const [row] = await tx
    .select()
    .from(assessmentSignoff)
    .where(
      and(
        eq(assessmentSignoff.assessmentId, assessmentId),
        eq(assessmentSignoff.status, 'requested'),
      ),
    )
    .orderBy(desc(assessmentSignoff.requestedAt))
    .limit(1)
  return row ?? null
}

/** The quality check and the posture of the cycle at this moment. */
const snapshotOf = async (
  tx: Transaction,
  clientId: string,
  cycle: { id: string; releaseId: string },
): Promise<SignoffSnapshot> => {
  const [{ counts }, progress] = await Promise.all([
    qualityOf(tx, clientId, cycle),
    cycleProgress(tx, cycle.id),
  ])
  return {
    errors: counts.error,
    warnings: counts.warning,
    notes: counts.note,
    answered: progress.answered,
    total: progress.total,
    compliancePct: progress.compliancePct,
  }
}

/** The sign-off history of a cycle, newest first, with the names of the people involved. */
export const listSignoffs = async (ctx: ServiceContext, clientId: string, assessmentId: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const rows = await tx
      .select()
      .from(assessmentSignoff)
      .where(
        and(
          eq(assessmentSignoff.assessmentId, assessmentId),
          eq(assessmentSignoff.tenantId, clientId),
        ),
      )
      .orderBy(desc(assessmentSignoff.requestedAt))
    const ids = [...new Set(rows.flatMap((row) => [row.requestedBy, row.approverUserId]))]
    const people = ids.length
      ? await tx
          .select({ id: appUser.id, name: appUser.displayName })
          .from(appUser)
          .where(inArray(appUser.id, ids))
      : []
    const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? 'Unknown'
    const today = isoDate(new Date())
    return rows.map((row) => ({
      ...row,
      requestedByName: nameOf(row.requestedBy),
      approverName: nameOf(row.approverUserId),
      ownDecision: row.requestedBy === row.approverUserId,
      overdue: row.status === 'requested' && row.dueDate !== null && row.dueDate < today,
    }))
  })
}
export type SignoffRow = Awaited<ReturnType<typeof listSignoffs>>[number]

const requestSchema = z.object({
  approverUserId: z.uuid('Choose who signs off.'),
  dueDate: optionalDate(),
  note: optionalText(2000),
})

/** Sends a cycle to a named approver. Every question must be answered and checked first. */
export const requestSignoff = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.review', { clientId })
  const input = parseInput(requestSchema, raw)
  if (input.dueDate && input.dueDate < isoDate(new Date())) {
    throw new ValidationError({ dueDate: 'The deadline cannot be in the past.' })
  }
  await inClient(ctx, clientId, async (tx) => {
    const cycle = await cycleOf(tx, clientId, assessmentId)
    if (cycle.status !== 'in_progress') {
      throw new RuleError(
        cycle.status === 'in_review'
          ? `${cycle.code} is already waiting for sign-off.`
          : `${cycle.code} is ${cycle.status.replace('_', ' ')}; only a cycle in progress is sent for sign-off.`,
      )
    }
    assertReadyToComplete(await cycleProgress(tx, cycle.id))
    const approvers = await approversOf(tx, clientId)
    if (!approvers.some((person) => person.userId === input.approverUserId)) {
      throw new ValidationError({
        approverUserId: 'Choose a Senior auditor or an Administrator with a login.',
      })
    }
    await tx.insert(assessmentSignoff).values({
      tenantId: clientId,
      assessmentId: cycle.id,
      requestedBy: ctx.principal.userId,
      approverUserId: input.approverUserId,
      dueDate: input.dueDate ?? null,
      note: input.note ?? null,
    })
    await tx.update(assessment).set({ status: 'in_review' }).where(eq(assessment.id, cycle.id))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'assessment.signoff_requested',
      entity: 'assessment',
      entityId: cycle.code,
      detail: { approverUserId: input.approverUserId, dueDate: input.dueDate ?? null },
    })
  })
}

const decisionSchema = z
  .object({
    decision: z.enum(['approve', 'changes'], { error: 'Approve, or ask for changes.' }),
    note: optionalText(2000),
    acknowledge: z.preprocess(truthy, z.boolean()),
  })
  .refine((value) => value.decision === 'approve' || (value.note?.length ?? 0) >= 10, {
    path: ['note'],
    message: 'Say what should change (at least 10 characters).',
  })

const errorsMessage = (errors: number) =>
  `The quality check shows ${errors} ${errors === 1 ? 'error' : 'errors'}. Tick the box to confirm you have read ${errors === 1 ? 'it' : 'them'}, or have ${errors === 1 ? 'it' : 'them'} dealt with first.`

const complete = async (
  tx: Transaction,
  ctx: ServiceContext,
  clientId: string,
  cycle: { id: string; code: string; status: string },
  snapshot: SignoffSnapshot,
) => {
  await tx
    .update(assessment)
    .set({ status: 'completed', completedAt: new Date() })
    .where(eq(assessment.id, cycle.id))
  await audit(tx, ctx, {
    tenantId: clientId,
    action: 'assessment.completed',
    entity: 'assessment',
    entityId: cycle.code,
    detail: { from: cycle.status, ...snapshot },
  })
}

/**
 * The approver's decision on an open request: approve (the cycle completes, with the quality
 * check and posture of that moment kept) or ask for changes (the cycle reopens).
 */
export const decideSignoff = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.signoff', { clientId })
  const input = parseInput(decisionSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const cycle = await cycleOf(tx, clientId, assessmentId)
    const request = await openRequest(tx, cycle.id)
    if (cycle.status !== 'in_review' || !request) {
      throw new RuleError(`${cycle.code} is not waiting for sign-off.`)
    }
    if (request.approverUserId !== ctx.principal.userId) {
      throw new RuleError('This cycle was sent to someone else for sign-off.')
    }
    const snapshot = await snapshotOf(tx, clientId, cycle)
    if (input.decision === 'approve' && snapshot.errors > 0 && !input.acknowledge) {
      throw new ValidationError({ acknowledge: errorsMessage(snapshot.errors) })
    }
    await tx
      .update(assessmentSignoff)
      .set({
        status: input.decision === 'approve' ? 'approved' : 'changes_requested',
        decidedAt: new Date(),
        decisionNote: input.note ?? null,
        acknowledged: input.decision === 'approve' && snapshot.errors > 0,
        snapshot,
      })
      .where(eq(assessmentSignoff.id, request.id))
    if (input.decision === 'approve') {
      await complete(tx, ctx, clientId, cycle, snapshot)
      return
    }
    await tx.update(assessment).set({ status: 'in_progress' }).where(eq(assessment.id, cycle.id))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'assessment.signoff_changes',
      entity: 'assessment',
      entityId: cycle.code,
      detail: { note: input.note ?? null },
    })
  })
}

/** Takes an open request back, so answers can change. By the requester, or anyone who may check answers. */
export const withdrawSignoff = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.review', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const cycle = await cycleOf(tx, clientId, assessmentId)
    const request = await openRequest(tx, cycle.id)
    if (cycle.status !== 'in_review' || !request) {
      throw new RuleError(`${cycle.code} is not waiting for sign-off.`)
    }
    await tx
      .update(assessmentSignoff)
      .set({ status: 'withdrawn', decidedAt: new Date() })
      .where(eq(assessmentSignoff.id, request.id))
    await tx.update(assessment).set({ status: 'in_progress' }).where(eq(assessment.id, cycle.id))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'assessment.signoff_withdrawn',
      entity: 'assessment',
      entityId: cycle.code,
    })
  })
}

const ownSchema = z.object({
  note: optionalText(2000),
  acknowledge: z.preprocess(truthy, z.boolean()),
})

/**
 * Signs a cycle off without sending it to anyone: for a person who may sign off, on a cycle in
 * progress. Recorded as a request they approved themselves.
 */
export const signOffCycle = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  raw: unknown = {},
): Promise<void> => {
  authorize(ctx.principal, 'assessment.signoff', { clientId })
  const input = parseInput(ownSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const cycle = await cycleOf(tx, clientId, assessmentId)
    if (cycle.status !== 'in_progress') {
      throw new RuleError(
        cycle.status === 'in_review'
          ? `${cycle.code} is waiting for another person's sign-off.`
          : `${cycle.code} is ${cycle.status.replace('_', ' ')}; only a cycle in progress is signed off.`,
      )
    }
    assertReadyToComplete(await cycleProgress(tx, cycle.id))
    const snapshot = await snapshotOf(tx, clientId, cycle)
    if (snapshot.errors > 0 && !input.acknowledge) {
      throw new ValidationError({ acknowledge: errorsMessage(snapshot.errors) })
    }
    const now = new Date()
    await tx.insert(assessmentSignoff).values({
      tenantId: clientId,
      assessmentId: cycle.id,
      requestedBy: ctx.principal.userId,
      requestedAt: now,
      approverUserId: ctx.principal.userId,
      status: 'approved',
      decidedAt: now,
      decisionNote: input.note ?? null,
      acknowledged: snapshot.errors > 0,
      snapshot,
    })
    await complete(tx, ctx, clientId, cycle, snapshot)
  })
}

/** What the signed-in person may do about a cycle's sign-off now. */
export const signoffOptions = (
  ctx: ServiceContext,
  clientId: string,
  cycle: { status: string },
  open: Pick<SignoffRow, 'approverUserId'> | null,
) => {
  const scope = { clientId }
  const mayCheck = can(ctx.principal, 'assessment.review', scope)
  const maySignOff = can(ctx.principal, 'assessment.signoff', scope)
  return {
    request: cycle.status === 'in_progress' && mayCheck,
    signOffNow: cycle.status === 'in_progress' && maySignOff,
    decide:
      cycle.status === 'in_review' && maySignOff && open?.approverUserId === ctx.principal.userId,
    withdraw: cycle.status === 'in_review' && open !== null && mayCheck,
  }
}
