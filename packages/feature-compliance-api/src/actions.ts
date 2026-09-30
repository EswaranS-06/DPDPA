import { authorize, can, type Capability } from '@duatf/core-access'
import { isoDate, sequenceScope } from '@duatf/core-utils'
import {
  actionEvent,
  and,
  appUser,
  asc,
  assessment,
  assessmentItem,
  count,
  department,
  desc,
  eq,
  evidence,
  evidenceLink,
  finding,
  inArray,
  isNotNull,
  ne,
  nextCode,
  notInArray,
  remediationAction,
  roleAssignment,
  tenant,
  type ActionStatus,
  type Executor,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { createAssessment } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import { closeRemediatedFinding } from './findings'
import {
  NotFoundError,
  optionalDate,
  optionalText,
  parseInput,
  requiredText,
  RuleError,
  ValidationError,
} from './errors'

type Step = { to: ActionStatus; capability: Capability; label: string }

/**
 * The remediation workflow. Any other move is refused. Accepted Risk is reached only when the
 * client DPO accepts the finding's risk; Closed and Accepted Risk are final.
 */
export const ACTION_FLOW: Record<ActionStatus, Step[]> = {
  open: [{ to: 'assigned', capability: 'action.manage', label: 'Mark assigned' }],
  assigned: [
    { to: 'in_progress', capability: 'action.update', label: 'Start work' },
    { to: 'open', capability: 'action.manage', label: 'Unassign' },
  ],
  in_progress: [
    { to: 'pending_evidence', capability: 'action.update', label: 'Waiting for evidence' },
    { to: 'under_review', capability: 'action.update', label: 'Submit for review' },
  ],
  pending_evidence: [
    { to: 'in_progress', capability: 'action.update', label: 'Resume work' },
    { to: 'under_review', capability: 'action.update', label: 'Submit for review' },
  ],
  under_review: [
    { to: 'remediated', capability: 'action.verify', label: 'Verify as remediated' },
    { to: 'rejected', capability: 'action.verify', label: 'Reject' },
  ],
  rejected: [{ to: 'in_progress', capability: 'action.update', label: 'Rework' }],
  remediated: [
    { to: 'closed', capability: 'action.verify', label: 'Close' },
    { to: 'in_progress', capability: 'action.verify', label: 'Reopen' },
  ],
  closed: [],
  accepted_risk: [],
}

export const FINAL_ACTION_STATUSES: readonly ActionStatus[] = ['closed', 'accepted_risk']

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const actionSchema = z.object({
  title: requiredText('Action', 200),
  description: optionalText(4000),
  ownerUserId: z.preprocess(blankToUndefined, z.uuid('Choose an owner.').optional()),
  departmentId: z.preprocess(blankToUndefined, z.uuid('Choose a department.').optional()),
  dueDate: optionalDate(),
})

const recordEvent = (
  tx: Executor,
  ctx: ServiceContext,
  input: {
    clientId: string
    actionId: string
    from: ActionStatus | null
    to: ActionStatus
    note?: string | null
  },
) =>
  tx.insert(actionEvent).values({
    tenantId: input.clientId,
    actionId: input.actionId,
    actorUserId: ctx.principal.userId,
    fromStatus: input.from,
    toStatus: input.to,
    note: input.note ?? null,
  })

/** The owner must hold a role on this client (or be firm-wide staff) and not be disabled. */
const checkOwner = async (tx: Transaction, clientId: string, ownerUserId: string | undefined) => {
  if (!ownerUserId) return
  const roles = await tx
    .select({ tenantId: roleAssignment.tenantId })
    .from(roleAssignment)
    .innerJoin(appUser, eq(appUser.id, roleAssignment.userId))
    .where(and(eq(roleAssignment.userId, ownerUserId), ne(appUser.status, 'disabled')))
  if (!roles.some((row) => row.tenantId === null || row.tenantId === clientId)) {
    throw new ValidationError({ ownerUserId: 'Choose someone with access to this client.' })
  }
}

const checkDepartment = async (
  tx: Transaction,
  clientId: string,
  departmentId: string | undefined,
) => {
  if (!departmentId) return
  const [row] = await tx
    .select({ active: department.active })
    .from(department)
    .where(and(eq(department.id, departmentId), eq(department.tenantId, clientId)))
  if (!row?.active) throw new ValidationError({ departmentId: 'Choose an active department.' })
}

/** Plans a remediation action for a finding; with an owner it starts as Assigned. */
export const createAction = async (
  ctx: ServiceContext,
  clientId: string,
  findingId: string,
  raw: unknown,
): Promise<{ id: string; code: string }> => {
  authorize(ctx.principal, 'action.manage', { clientId })
  const input = parseInput(actionSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const [found] = await tx
      .select({ code: finding.code, clientCode: tenant.code })
      .from(finding)
      .innerJoin(tenant, eq(tenant.id, finding.tenantId))
      .where(and(eq(finding.id, findingId), eq(finding.tenantId, clientId)))
    if (!found) throw new NotFoundError('Finding')
    await checkOwner(tx, clientId, input.ownerUserId)
    await checkDepartment(tx, clientId, input.departmentId)
    const status: ActionStatus = input.ownerUserId ? 'assigned' : 'open'
    const code = await nextCode(tx, clientId, sequenceScope('REM', found.clientCode))
    const [created] = await tx
      .insert(remediationAction)
      .values({
        tenantId: clientId,
        code,
        findingId,
        title: input.title,
        description: input.description ?? null,
        ownerUserId: input.ownerUserId ?? null,
        departmentId: input.departmentId ?? null,
        dueDate: input.dueDate ?? null,
        status,
        createdBy: ctx.principal.userId,
      })
      .returning({ id: remediationAction.id })
    const id = created?.id ?? ''
    await recordEvent(tx, ctx, { clientId, actionId: id, from: null, to: status })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'action.create',
      entity: 'remediation_action',
      entityId: code,
      detail: { finding: found.code, status },
    })
    return { id, code }
  })
}

/** Changes owner, department or due date. Giving an open action an owner assigns it. */
export const updateActionPlan = async (
  ctx: ServiceContext,
  clientId: string,
  actionId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'action.manage', { clientId })
  const input = parseInput(actionSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const [current] = await tx
      .select()
      .from(remediationAction)
      .where(and(eq(remediationAction.id, actionId), eq(remediationAction.tenantId, clientId)))
    if (!current) throw new NotFoundError('Action')
    if (FINAL_ACTION_STATUSES.includes(current.status))
      throw new RuleError('This action is finished.')
    await checkOwner(tx, clientId, input.ownerUserId)
    await checkDepartment(tx, clientId, input.departmentId)
    const status: ActionStatus =
      current.status === 'open' && input.ownerUserId ? 'assigned' : current.status
    await tx
      .update(remediationAction)
      .set({
        title: input.title,
        description: input.description ?? null,
        ownerUserId: input.ownerUserId ?? null,
        departmentId: input.departmentId ?? null,
        dueDate: input.dueDate ?? null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(remediationAction.id, actionId))
    if (status !== current.status) {
      await recordEvent(tx, ctx, { clientId, actionId, from: current.status, to: status })
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'action.plan',
      entity: 'remediation_action',
      entityId: current.code,
      detail: { owner: input.ownerUserId ?? null, due: input.dueDate ?? null },
    })
  })
}

const evidenceCounts = async (tx: Transaction, actionId: string) => {
  const rows = await tx
    .select({ status: evidence.status, n: count() })
    .from(evidenceLink)
    .innerJoin(evidence, eq(evidence.id, evidenceLink.evidenceId))
    .where(eq(evidenceLink.actionId, actionId))
    .groupBy(evidence.status)
  const total = rows.reduce((sum, row) => sum + row.n, 0)
  const accepted = rows.find((row) => row.status === 'accepted')?.n ?? 0
  return { total, accepted }
}

/**
 * Moves an action along the workflow. Refuses moves the workflow does not allow, submitting
 * without evidence, rejecting without a note, and verification or closing by the owner or
 * without accepted evidence.
 */
export const transitionAction = async (
  ctx: ServiceContext,
  clientId: string,
  actionId: string,
  raw: unknown,
): Promise<ActionStatus> => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  const input = parseInput(
    z.object({ to: z.string().min(1, 'Choose the next step.'), note: optionalText(2000) }),
    raw,
  )
  return inClient(ctx, clientId, async (tx) => {
    const [current] = await tx
      .select()
      .from(remediationAction)
      .where(and(eq(remediationAction.id, actionId), eq(remediationAction.tenantId, clientId)))
    if (!current) throw new NotFoundError('Action')
    const step = ACTION_FLOW[current.status].find((item) => item.to === input.to)
    if (!step) {
      throw new RuleError(
        `An action that is ${current.status.replace(/_/g, ' ')} cannot move to ${input.to.replace(/_/g, ' ')}.`,
      )
    }
    authorize(ctx.principal, step.capability, { clientId, departmentId: current.departmentId })
    const verifying = step.to === 'remediated' || step.to === 'closed'
    if (verifying && current.ownerUserId === ctx.principal.userId) {
      throw new RuleError('The owner of an action cannot verify or close it.')
    }
    const counts = await evidenceCounts(tx, actionId)
    if (step.to === 'under_review' && counts.total === 0) {
      throw new RuleError('Attach evidence of the fix before submitting it for review.')
    }
    if (verifying && counts.accepted === 0) {
      throw new RuleError('At least one piece of evidence must be accepted first.')
    }
    if (step.to === 'rejected' && !input.note) {
      throw new ValidationError({ note: 'Say what is missing.' })
    }
    const now = new Date()
    await tx
      .update(remediationAction)
      .set({
        status: step.to,
        updatedAt: now,
        ...(step.to === 'remediated' ? { verifiedBy: ctx.principal.userId, verifiedAt: now } : {}),
        ...(step.to === 'closed' ? { closedAt: now } : {}),
        ...(step.to === 'in_progress' && current.status === 'remediated'
          ? { verifiedBy: null, verifiedAt: null }
          : {}),
      })
      .where(eq(remediationAction.id, actionId))
    await recordEvent(tx, ctx, {
      clientId,
      actionId,
      from: current.status,
      to: step.to,
      note: input.note,
    })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: `action.${step.to}`,
      entity: 'remediation_action',
      entityId: current.code,
      detail: { from: current.status, note: input.note ?? null },
    })
    if (step.to === 'closed') await closeRemediatedFinding(tx, ctx, clientId, current.findingId)
    return step.to
  })
}

/** When the client accepts a finding's risk, its unfinished actions become Accepted Risk. */
export const acceptActionsForFinding = async (
  tx: Transaction,
  ctx: ServiceContext,
  clientId: string,
  findingId: string,
  note: string,
): Promise<void> => {
  const open = await tx
    .select({ id: remediationAction.id, status: remediationAction.status })
    .from(remediationAction)
    .where(
      and(
        eq(remediationAction.findingId, findingId),
        notInArray(remediationAction.status, [...FINAL_ACTION_STATUSES]),
      ),
    )
  for (const row of open) {
    await tx
      .update(remediationAction)
      .set({ status: 'accepted_risk', updatedAt: new Date() })
      .where(eq(remediationAction.id, row.id))
    await recordEvent(tx, ctx, {
      clientId,
      actionId: row.id,
      from: row.status,
      to: 'accepted_risk',
      note,
    })
  }
}

/** Links evidence to an action. Department owners may do this only for their department. */
export const linkActionEvidence = async (
  ctx: ServiceContext,
  clientId: string,
  actionId: string,
  evidenceId: string,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const [current] = await tx
      .select({
        code: remediationAction.code,
        departmentId: remediationAction.departmentId,
        status: remediationAction.status,
      })
      .from(remediationAction)
      .where(and(eq(remediationAction.id, actionId), eq(remediationAction.tenantId, clientId)))
    if (!current) throw new NotFoundError('Action')
    authorize(ctx.principal, 'action.update', { clientId, departmentId: current.departmentId })
    if (FINAL_ACTION_STATUSES.includes(current.status))
      throw new RuleError('This action is finished.')
    const [found] = await tx
      .select({ id: evidence.id })
      .from(evidence)
      .where(and(eq(evidence.id, evidenceId), eq(evidence.tenantId, clientId)))
    if (!found) throw new ValidationError({ evidenceId: 'Choose evidence of this client.' })
    await tx
      .insert(evidenceLink)
      .values({ tenantId: clientId, evidenceId, actionId, createdBy: ctx.principal.userId })
      .onConflictDoNothing()
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'action.evidence',
      entity: 'remediation_action',
      entityId: current.code,
      detail: { evidenceId },
    })
  })
}

export type ActionFilters = {
  status?: ActionStatus
  ownerUserId?: string
  overdue?: boolean
  findingId?: string
  departmentId?: string
}

const actionColumns = {
  id: remediationAction.id,
  code: remediationAction.code,
  title: remediationAction.title,
  status: remediationAction.status,
  dueDate: remediationAction.dueDate,
  ownerUserId: remediationAction.ownerUserId,
  ownerName: appUser.displayName,
  departmentId: remediationAction.departmentId,
  departmentName: department.name,
  findingId: remediationAction.findingId,
  findingCode: finding.code,
  findingTitle: finding.title,
  updatedAt: remediationAction.updatedAt,
}

/** Actions of a client, most urgent first (due date, then newest). */
export const listActions = async (
  ctx: ServiceContext,
  clientId: string,
  filters: ActionFilters = {},
) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  const today = isoDate(new Date())
  const rows = await inClient(ctx, clientId, (tx) =>
    tx
      .select(actionColumns)
      .from(remediationAction)
      .innerJoin(finding, eq(finding.id, remediationAction.findingId))
      .leftJoin(appUser, eq(appUser.id, remediationAction.ownerUserId))
      .leftJoin(department, eq(department.id, remediationAction.departmentId))
      .where(
        and(
          eq(remediationAction.tenantId, clientId),
          filters.status ? eq(remediationAction.status, filters.status) : undefined,
          filters.ownerUserId ? eq(remediationAction.ownerUserId, filters.ownerUserId) : undefined,
          filters.findingId ? eq(remediationAction.findingId, filters.findingId) : undefined,
          filters.departmentId
            ? eq(remediationAction.departmentId, filters.departmentId)
            : undefined,
        ),
      )
      .orderBy(asc(remediationAction.dueDate), desc(remediationAction.updatedAt)),
  )
  return rows
    .map((row) => ({
      ...row,
      overdue:
        row.dueDate !== null &&
        row.dueDate < today &&
        !FINAL_ACTION_STATUSES.includes(row.status) &&
        row.status !== 'remediated',
    }))
    .filter((row) => !filters.overdue || row.overdue)
}
export type ActionRow = Awaited<ReturnType<typeof listActions>>[number]

/** One action with its history and evidence. */
export const getAction = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({
        action: remediationAction,
        findingCode: finding.code,
        findingTitle: finding.title,
        recommendation: finding.recommendation,
        ownerName: appUser.displayName,
        departmentName: department.name,
      })
      .from(remediationAction)
      .innerJoin(finding, eq(finding.id, remediationAction.findingId))
      .leftJoin(appUser, eq(appUser.id, remediationAction.ownerUserId))
      .leftJoin(department, eq(department.id, remediationAction.departmentId))
      .where(
        and(
          eq(remediationAction.tenantId, clientId),
          eq(remediationAction.code, code.toUpperCase()),
        ),
      )
    if (!row) throw new NotFoundError(`Action ${code}`)
    const events = await tx
      .select({ event: actionEvent, actorName: appUser.displayName })
      .from(actionEvent)
      .leftJoin(appUser, eq(appUser.id, actionEvent.actorUserId))
      .where(eq(actionEvent.actionId, row.action.id))
      .orderBy(asc(actionEvent.id))
    const linked = await tx
      .select({
        id: evidence.id,
        code: evidence.code,
        title: evidence.title,
        status: evidence.status,
        fileName: evidence.fileName,
      })
      .from(evidenceLink)
      .innerJoin(evidence, eq(evidence.id, evidenceLink.evidenceId))
      .where(eq(evidenceLink.actionId, row.action.id))
      .orderBy(asc(evidence.code))
    return {
      ...row.action,
      findingCode: row.findingCode,
      findingTitle: row.findingTitle,
      recommendation: row.recommendation,
      ownerName: row.ownerName,
      departmentName: row.departmentName,
      events: events.map((item) => ({ ...item.event, actorName: item.actorName })),
      evidence: linked,
    }
  })
}
export type ActionDetail = Awaited<ReturnType<typeof getAction>>

/** Next steps this user may take on an action. */
export const nextSteps = (
  ctx: ServiceContext,
  clientId: string,
  action: { status: ActionStatus; departmentId: string | null },
) =>
  ACTION_FLOW[action.status].filter((step) =>
    can(ctx.principal, step.capability, { clientId, departmentId: action.departmentId }),
  )

/**
 * Starts the next cycle from a previous assessment: same client, the current knowledge-base
 * release, and the previous department assignment for every question that still exists.
 */
export const createReassessment = async (
  ctx: ServiceContext,
  clientId: string,
  previousAssessmentId: string,
  raw: unknown,
): Promise<{ id: string; code: string; copied: number }> => {
  authorize(ctx.principal, 'assessment.create', { clientId })
  const previous = await inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({ id: assessment.id, status: assessment.status })
      .from(assessment)
      .where(and(eq(assessment.id, previousAssessmentId), eq(assessment.tenantId, clientId)))
    if (!row) throw new NotFoundError('Assessment')
    return row
  })
  if (previous.status !== 'completed') {
    throw new RuleError('Complete the previous assessment before starting the next cycle.')
  }
  const created = await createAssessment(ctx, clientId, raw, { previousAssessmentId })
  const copied = await inClient(ctx, clientId, async (tx) => {
    const scope = await tx
      .select({
        questionCode: assessmentItem.questionCode,
        departmentId: assessmentItem.departmentId,
      })
      .from(assessmentItem)
      .innerJoin(department, eq(department.id, assessmentItem.departmentId))
      .where(
        and(
          eq(assessmentItem.assessmentId, previousAssessmentId),
          isNotNull(assessmentItem.departmentId),
          eq(department.active, true),
        ),
      )
    let changed = 0
    const byDepartment = new Map<string, string[]>()
    for (const row of scope) {
      if (!row.departmentId) continue
      byDepartment.set(row.departmentId, [
        ...(byDepartment.get(row.departmentId) ?? []),
        row.questionCode,
      ])
    }
    for (const [departmentId, questionCodes] of byDepartment) {
      const updated = await tx
        .update(assessmentItem)
        .set({ departmentId })
        .where(
          and(
            eq(assessmentItem.assessmentId, created.id),
            inArray(assessmentItem.questionCode, questionCodes),
          ),
        )
        .returning({ id: assessmentItem.id })
      changed += updated.length
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'assessment.reassess',
      entity: 'assessment',
      entityId: created.code,
      detail: { previous: previousAssessmentId, assignmentsCopied: changed },
    })
    return changed
  })
  return { ...created, copied }
}
