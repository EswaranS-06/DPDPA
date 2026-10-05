import { authorize } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  appUser,
  asc,
  assessment,
  assessmentItem,
  controlOwner,
  department,
  eq,
  evidence,
  evidenceRequest,
  inArray,
  isNull,
  ne,
  or,
  question,
  remediationAction,
  roleAssignment,
  type EvidenceRequestStatus,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { openCycle } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import {
  NotFoundError,
  optionalDate,
  optionalText,
  parseInput,
  requiredText,
  RuleError,
  ValidationError,
} from './errors'

// Who does what at a client: the person a question is given to, the evidence requested from
// someone, and the owner of each control. Everything stays visible to the audit team.

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const toList = (value: unknown) => {
  if (value === undefined || value === null || value === '') return []
  const list = Array.isArray(value) ? value : [value]
  return list.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

/** A person who can be given work here: a role at this client or a firm-wide role, not disabled. */
export const checkAssignable = async (
  tx: Transaction,
  clientId: string,
  userId: string | undefined,
  field = 'assigneeUserId',
) => {
  if (!userId) return
  const [row] = await tx
    .select({ id: roleAssignment.id })
    .from(roleAssignment)
    .innerJoin(appUser, eq(appUser.id, roleAssignment.userId))
    .where(
      and(
        eq(roleAssignment.userId, userId),
        or(eq(roleAssignment.tenantId, clientId), isNull(roleAssignment.tenantId)),
        ne(appUser.status, 'disabled'),
      ),
    )
    .limit(1)
  if (!row) throw new ValidationError({ [field]: 'Choose someone from this client or ComplyX.' })
}

// --- Question assignees -----------------------------------------------------------------------

const assignSchema = z.object({
  assigneeUserId: z.preprocess(blankToUndefined, z.uuid().optional()),
})

/** Gives one question of a department to a person (or takes it back). */
export const assignItem = async (
  ctx: ServiceContext,
  clientId: string,
  itemId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.assign', { clientId })
  const input = parseInput(assignSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    await checkAssignable(tx, clientId, input.assigneeUserId)
    const updated = await tx
      .update(assessmentItem)
      .set({ assigneeUserId: input.assigneeUserId ?? null })
      .where(and(eq(assessmentItem.id, itemId), eq(assessmentItem.tenantId, clientId)))
      .returning({ questionCode: assessmentItem.questionCode })
    if (updated.length === 0) throw new NotFoundError('Question')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'item.assign',
      entity: 'assessment_item',
      entityId: itemId,
      detail: { question: updated[0]?.questionCode, assignee: input.assigneeUserId ?? null },
    })
  })
}

/** Gives every question of a department in a cycle (or only the unassigned ones) to a person. */
export const assignDepartmentItems = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  departmentId: string,
  raw: unknown,
): Promise<number> => {
  authorize(ctx.principal, 'assessment.assign', { clientId })
  const input = parseInput(
    assignSchema.extend({
      onlyUnassigned: z.preprocess((value) => value === 'on' || value === true, z.boolean()),
    }),
    raw,
  )
  return inClient(ctx, clientId, async (tx) => {
    await checkAssignable(tx, clientId, input.assigneeUserId)
    const updated = await tx
      .update(assessmentItem)
      .set({ assigneeUserId: input.assigneeUserId ?? null })
      .where(
        and(
          eq(assessmentItem.tenantId, clientId),
          eq(assessmentItem.assessmentId, assessmentId),
          eq(assessmentItem.departmentId, departmentId),
          input.onlyUnassigned ? isNull(assessmentItem.assigneeUserId) : undefined,
        ),
      )
      .returning({ id: assessmentItem.id })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'item.assign_department',
      entity: 'department',
      entityId: departmentId,
      detail: { assignee: input.assigneeUserId ?? null, items: updated.length },
    })
    return updated.length
  })
}

// --- Evidence requests ------------------------------------------------------------------------

const requestSchema = z.object({
  titles: z.preprocess(
    toList,
    z.array(z.string().trim().min(3).max(300)).max(30, 'Ask for at most 30 items at once.'),
  ),
  title: z.preprocess(blankToUndefined, z.string().trim().min(3).max(300).optional()),
  assigneeUserId: z.preprocess(blankToUndefined, z.uuid().optional()),
  dueDate: optionalDate(),
  note: optionalText(2000),
})

/**
 * Asks for evidence for one question: one request per item named (picked from the suggested
 * evidence, or written), optionally from a person and by a date.
 */
export const requestEvidence = async (
  ctx: ServiceContext,
  clientId: string,
  itemId: string,
  raw: unknown,
): Promise<number> => {
  authorize(ctx.principal, 'assessment.assign', { clientId })
  const input = parseInput(requestSchema, raw)
  const titles = [...new Set([...input.titles, ...(input.title ? [input.title] : [])])]
  if (titles.length === 0) {
    throw new ValidationError({ title: 'Name the evidence you need, or tick a suggestion.' })
  }
  return inClient(ctx, clientId, async (tx) => {
    const [item] = await tx
      .select({ id: assessmentItem.id, questionCode: assessmentItem.questionCode })
      .from(assessmentItem)
      .where(and(eq(assessmentItem.id, itemId), eq(assessmentItem.tenantId, clientId)))
    if (!item) throw new NotFoundError('Question')
    await checkAssignable(tx, clientId, input.assigneeUserId)
    await tx.insert(evidenceRequest).values(
      titles.map((title) => ({
        tenantId: clientId,
        itemId,
        title,
        note: input.note ?? null,
        assigneeUserId: input.assigneeUserId ?? null,
        dueDate: input.dueDate ?? null,
        requestedBy: ctx.principal.userId,
      })),
    )
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'evidence.request',
      entity: 'assessment_item',
      entityId: itemId,
      detail: { question: item.questionCode, titles, assignee: input.assigneeUserId ?? null },
    })
    return titles.length
  })
}

/** Withdraws a request that is no longer needed. */
export const cancelEvidenceRequest = async (
  ctx: ServiceContext,
  clientId: string,
  requestId: string,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.assign', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const updated = await tx
      .update(evidenceRequest)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(evidenceRequest.id, requestId),
          eq(evidenceRequest.tenantId, clientId),
          ne(evidenceRequest.status, 'accepted'),
        ),
      )
      .returning({ title: evidenceRequest.title })
    if (updated.length === 0) throw new RuleError('Only open requests can be withdrawn.')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'evidence.request_cancel',
      entity: 'evidence_request',
      entityId: requestId,
    })
  })
}

/** Marks requests met by a file: received, or accepted when the file is already accepted. */
export const fulfilRequests = async (
  tx: Transaction,
  input: { clientId: string; requestIds: string[]; evidenceId: string; accepted: boolean },
) => {
  if (input.requestIds.length === 0) return
  await tx
    .update(evidenceRequest)
    .set({
      evidenceId: input.evidenceId,
      status: input.accepted ? 'accepted' : 'received',
      fulfilledAt: new Date(),
    })
    .where(
      and(
        eq(evidenceRequest.tenantId, input.clientId),
        inArray(evidenceRequest.id, input.requestIds),
        ne(evidenceRequest.status, 'cancelled'),
      ),
    )
}

/** Follows a review of a file: accepted closes its requests; rejected opens them again. */
export const followEvidenceReview = async (
  tx: Transaction,
  evidenceId: string,
  decision: 'accepted' | 'rejected',
) => {
  await tx
    .update(evidenceRequest)
    .set(
      decision === 'accepted'
        ? { status: 'accepted' }
        : { status: 'requested', evidenceId: null, fulfilledAt: null },
    )
    .where(and(eq(evidenceRequest.evidenceId, evidenceId), ne(evidenceRequest.status, 'cancelled')))
}

export type RequestFilters = {
  itemId?: string
  assigneeUserId?: string
  departmentId?: string
  /** Requested or received (not yet accepted or withdrawn). */
  open?: boolean
}

/** Evidence requests of a client with their question, department, person and file. */
export const listEvidenceRequests = async (
  ctx: ServiceContext,
  clientId: string,
  filters: RequestFilters = {},
) => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  const today = isoDate(new Date())
  const rows = await inClient(ctx, clientId, (tx) =>
    tx
      .select({
        id: evidenceRequest.id,
        title: evidenceRequest.title,
        note: evidenceRequest.note,
        status: evidenceRequest.status,
        dueDate: evidenceRequest.dueDate,
        requestedAt: evidenceRequest.requestedAt,
        itemId: evidenceRequest.itemId,
        questionCode: assessmentItem.questionCode,
        assessmentCode: assessment.code,
        departmentCode: department.code,
        departmentName: department.name,
        assigneeUserId: evidenceRequest.assigneeUserId,
        assigneeName: appUser.displayName,
        evidenceId: evidenceRequest.evidenceId,
        evidenceCode: evidence.code,
      })
      .from(evidenceRequest)
      .innerJoin(assessmentItem, eq(assessmentItem.id, evidenceRequest.itemId))
      .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
      .leftJoin(department, eq(department.id, assessmentItem.departmentId))
      .leftJoin(appUser, eq(appUser.id, evidenceRequest.assigneeUserId))
      .leftJoin(evidence, eq(evidence.id, evidenceRequest.evidenceId))
      .where(
        and(
          eq(evidenceRequest.tenantId, clientId),
          filters.itemId ? eq(evidenceRequest.itemId, filters.itemId) : undefined,
          filters.assigneeUserId
            ? eq(evidenceRequest.assigneeUserId, filters.assigneeUserId)
            : undefined,
          filters.departmentId ? eq(assessmentItem.departmentId, filters.departmentId) : undefined,
          filters.open
            ? inArray(evidenceRequest.status, [
                'requested',
                'received',
              ] satisfies EvidenceRequestStatus[])
            : ne(evidenceRequest.status, 'cancelled'),
        ),
      )
      .orderBy(asc(evidenceRequest.dueDate), asc(evidenceRequest.requestedAt)),
  )
  return rows.map((row) => ({
    ...row,
    overdue: row.status === 'requested' && row.dueDate !== null && row.dueDate < today,
  }))
}
export type EvidenceRequestRow = Awaited<ReturnType<typeof listEvidenceRequests>>[number]

// --- Control owners ---------------------------------------------------------------------------

/**
 * The knowledge-base controls behind the client's questions in its open (or latest) cycle,
 * with their owner and how many of those questions are answered.
 */
export const listClientControls = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const cycle =
      (await openCycle(tx, clientId)) ??
      (await tx
        .select({ id: assessment.id, releaseId: assessment.releaseId })
        .from(assessment)
        .where(eq(assessment.tenantId, clientId))
        .orderBy(asc(assessment.createdAt))
        .then((rows) => rows.at(-1) ?? null))
    if (!cycle) return []
    const items = await tx
      .select({
        answer: assessmentItem.answer,
        complianceState: assessmentItem.complianceState,
        controlCodes: question.controlCodes,
      })
      .from(assessmentItem)
      .innerJoin(
        question,
        and(
          eq(question.releaseId, cycle.releaseId),
          eq(question.code, assessmentItem.questionCode),
        ),
      )
      .where(eq(assessmentItem.assessmentId, cycle.id))
    const owners = await tx
      .select({
        controlCode: controlOwner.controlCode,
        userId: controlOwner.userId,
        name: appUser.displayName,
      })
      .from(controlOwner)
      .leftJoin(appUser, eq(appUser.id, controlOwner.userId))
      .where(eq(controlOwner.tenantId, clientId))
    const codes = [...new Set(items.flatMap((item) => item.controlCodes))].sort()
    return codes.map((code) => {
      const own = items.filter((item) => item.controlCodes.includes(code))
      const owner = owners.find((row) => row.controlCode === code)
      return {
        code,
        questions: own.length,
        answered: own.filter((item) => item.answer !== 'not_assessed').length,
        gaps: own.filter(
          (item) => item.complianceState === 'gap' || item.complianceState === 'potential_gap',
        ).length,
        ownerUserId: owner?.userId ?? null,
        ownerName: owner?.name ?? null,
      }
    })
  })
}
export type ClientControlRow = Awaited<ReturnType<typeof listClientControls>>[number]

/** Names the owner of a control at the client (or clears it). */
export const setControlOwner = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.assign', { clientId })
  const input = parseInput(
    z.object({
      controlCode: requiredText('Control', 20),
      userId: z.preprocess(blankToUndefined, z.uuid().optional()),
    }),
    raw,
  )
  await inClient(ctx, clientId, async (tx) => {
    await checkAssignable(tx, clientId, input.userId, 'userId')
    if (input.userId) {
      await tx
        .insert(controlOwner)
        .values({
          tenantId: clientId,
          controlCode: input.controlCode,
          userId: input.userId,
          assignedBy: ctx.principal.userId,
        })
        .onConflictDoUpdate({
          target: [controlOwner.tenantId, controlOwner.controlCode],
          set: { userId: input.userId, assignedBy: ctx.principal.userId, assignedAt: new Date() },
        })
    } else {
      await tx
        .delete(controlOwner)
        .where(
          and(eq(controlOwner.tenantId, clientId), eq(controlOwner.controlCode, input.controlCode)),
        )
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'control.owner',
      entity: 'control',
      entityId: input.controlCode,
      detail: { owner: input.userId ?? null },
    })
  })
}

// --- My work ----------------------------------------------------------------------------------

/** What is given to the signed-in person at a client: questions, evidence requests, actions, controls. */
export const myWork = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const userId = ctx.principal.userId
  const [items, requests, controls] = await Promise.all([
    inClient(ctx, clientId, async (tx) => {
      const cycle = await openCycle(tx, clientId)
      if (!cycle) return []
      return tx
        .select({
          id: assessmentItem.id,
          questionCode: assessmentItem.questionCode,
          title: question.title,
          answer: assessmentItem.answer,
          complianceState: assessmentItem.complianceState,
          departmentCode: department.code,
          departmentName: department.name,
          assessmentCode: assessment.code,
        })
        .from(assessmentItem)
        .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
        .innerJoin(
          question,
          and(
            eq(question.releaseId, assessment.releaseId),
            eq(question.code, assessmentItem.questionCode),
          ),
        )
        .leftJoin(department, eq(department.id, assessmentItem.departmentId))
        .where(
          and(eq(assessmentItem.assessmentId, cycle.id), eq(assessmentItem.assigneeUserId, userId)),
        )
        .orderBy(asc(department.code), asc(assessmentItem.seq))
    }),
    listEvidenceRequests(ctx, clientId, { assigneeUserId: userId, open: true }),
    listClientControls(ctx, clientId),
  ])
  const actions = await inClient(ctx, clientId, (tx) =>
    tx
      .select({
        code: remediationAction.code,
        title: remediationAction.title,
        status: remediationAction.status,
        dueDate: remediationAction.dueDate,
      })
      .from(remediationAction)
      .where(
        and(
          eq(remediationAction.tenantId, clientId),
          eq(remediationAction.ownerUserId, userId),
          ne(remediationAction.status, 'closed'),
          ne(remediationAction.status, 'accepted_risk'),
        ),
      )
      .orderBy(asc(remediationAction.dueDate)),
  )
  return {
    items,
    requests,
    actions,
    controls: controls.filter((row) => row.ownerUserId === userId),
  }
}
export type MyWork = Awaited<ReturnType<typeof myWork>>
