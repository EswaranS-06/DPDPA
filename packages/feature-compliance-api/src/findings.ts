import { authorize } from '@duatf/core-access'
import { sequenceScope } from '@duatf/core-utils'
import {
  actionEvent,
  and,
  asc,
  assessment,
  assessmentItem,
  control,
  department,
  desc,
  eq,
  finding,
  findingEvent,
  inArray,
  isNull,
  lt,
  ne,
  nextCode,
  notExists,
  notInArray,
  question,
  remediationAction,
  risk,
  sql,
  tenant,
  type ActionStatus,
  type Answer,
  type FindingStatus,
  type GapType,
  type Transaction,
} from '@duatf/platform-db'
import { audit, inClient, type ServiceContext } from './context'
import { NotFoundError } from './errors'
import { COMPLIANCE_OF } from './progress'

type SyncInput = {
  clientId: string
  itemId: string
  answer: Answer
  comment: string | null
}

const gapTypeOf = (answer: Answer): GapType | null => {
  const state = COMPLIANCE_OF[answer]
  return state === 'gap' ? 'gap' : state === 'potential_gap' ? 'potential_gap' : null
}

const CLOSE_REASON: Partial<Record<Answer, string>> = {
  yes: 'Answered Yes',
  not_applicable: 'Answered Not applicable',
  not_assessed: 'Answer withdrawn',
}

// A first estimate the auditor refines: a gap is likely, a partial gap possible.
const DEFAULT_LIKELIHOOD: Record<GapType, number> = { gap: 4, potential_gap: 3 }

// Action statuses that need no more work (the same as FINAL_ACTION_STATUSES in actions.ts).
const FINISHED_ACTIONS: readonly ActionStatus[] = ['closed', 'accepted_risk']

const loadItemContext = async (tx: Transaction, itemId: string) => {
  const [row] = await tx
    .select({
      item: assessmentItem,
      releaseId: assessment.releaseId,
      assessmentCode: assessment.code,
      assessmentCreatedAt: assessment.createdAt,
      previousAssessmentId: assessment.previousAssessmentId,
      clientCode: tenant.code,
    })
    .from(assessmentItem)
    .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
    .innerJoin(tenant, eq(tenant.id, assessmentItem.tenantId))
    .where(eq(assessmentItem.id, itemId))
  if (!row) throw new NotFoundError('Question')
  return row
}
type ItemContext = Awaited<ReturnType<typeof loadItemContext>>
type FindingRecord = typeof finding.$inferSelect
type FindingRef = { id: string; code: string }

/** In a re-assessment, the question's open findings from earlier cycles, oldest first. */
const earlierOpenFindings = async (
  tx: Transaction,
  context: ItemContext,
): Promise<FindingRecord[]> => {
  if (!context.previousAssessmentId) return []
  const rows = await tx
    .select({ finding })
    .from(finding)
    .innerJoin(assessment, eq(assessment.id, finding.assessmentId))
    .where(
      and(
        eq(finding.tenantId, context.item.tenantId),
        eq(finding.questionCode, context.item.questionCode),
        eq(finding.status, 'open'),
        ne(finding.itemId, context.item.id),
        lt(assessment.createdAt, context.assessmentCreatedAt),
      ),
    )
    .orderBy(asc(assessment.createdAt))
  return rows.map((row) => row.finding)
}

/** Moves a finding's unfinished actions to its successor, noting the move in their history. */
const moveActions = async (
  tx: Transaction,
  ctx: ServiceContext,
  input: { clientId: string; from: FindingRef; to: FindingRef; assessmentCode: string },
) => {
  const moving = await tx
    .select({ id: remediationAction.id, status: remediationAction.status })
    .from(remediationAction)
    .where(
      and(
        eq(remediationAction.findingId, input.from.id),
        notInArray(remediationAction.status, [...FINISHED_ACTIONS]),
      ),
    )
  for (const action of moving) {
    await tx
      .update(remediationAction)
      .set({ findingId: input.to.id, updatedAt: new Date() })
      .where(eq(remediationAction.id, action.id))
    await tx.insert(actionEvent).values({
      tenantId: input.clientId,
      actionId: action.id,
      actorUserId: ctx.principal.userId,
      fromStatus: action.status,
      toStatus: action.status,
      note: `Moved from ${input.from.code} to ${input.to.code} by re-assessment ${input.assessmentCode}.`,
    })
  }
}

/**
 * Settles the question's open findings from earlier cycles: a Yes or Not applicable resolves
 * them; a No or Partial carries them forward to this cycle's finding, with their unfinished
 * actions. Either way each gap is counted once.
 */
const settleEarlierFindings = async (
  tx: Transaction,
  ctx: ServiceContext,
  input: SyncInput,
  context: ItemContext,
  earlier: FindingRecord[],
  successor: FindingRef | null,
) => {
  for (const previous of earlier) {
    const reason = successor
      ? `Carried forward to ${successor.code} (${context.assessmentCode})`
      : input.answer === 'yes'
        ? `Resolved in ${context.assessmentCode} (answered Yes)`
        : `Not applicable in ${context.assessmentCode}`
    const now = new Date()
    await tx
      .update(finding)
      .set({ status: 'closed', closedAt: now, closedReason: reason })
      .where(eq(finding.id, previous.id))
    await tx
      .update(risk)
      .set({ status: 'closed', updatedAt: now })
      .where(and(eq(risk.findingId, previous.id), ne(risk.status, 'closed')))
    if (successor) {
      await moveActions(tx, ctx, {
        clientId: input.clientId,
        from: previous,
        to: successor,
        assessmentCode: context.assessmentCode,
      })
    }
    await tx.insert(findingEvent).values({
      tenantId: input.clientId,
      findingId: previous.id,
      actorUserId: ctx.principal.userId,
      kind: successor ? 'carried_forward' : 'resolved',
      detail: {
        assessment: context.assessmentCode,
        answer: input.answer,
        successor: successor?.code ?? null,
      },
    })
    await audit(tx, ctx, {
      tenantId: input.clientId,
      action: successor ? 'finding.carry_forward' : 'finding.resolve',
      entity: 'finding',
      entityId: previous.code,
      detail: { assessment: context.assessmentCode, successor: successor?.code ?? null },
    })
  }
}

/** The rating a new finding's risk starts with: the previous cycle's, or the default estimate. */
const startingRisk = async (
  tx: Transaction,
  gapType: GapType,
  riskWeight: number,
  previousFindingId: string | undefined,
) => {
  const [previous] = previousFindingId
    ? await tx.select().from(risk).where(eq(risk.findingId, previousFindingId))
    : []
  if (!previous) return { likelihood: DEFAULT_LIKELIHOOD[gapType], impact: riskWeight }
  const accepted = previous.status === 'accepted'
  return {
    likelihood: previous.likelihood,
    impact: previous.impact,
    treatment: previous.treatment,
    status: previous.status === 'closed' ? ('open' as const) : previous.status,
    ownerName: previous.ownerName,
    description: previous.description,
    acceptedBy: accepted ? previous.acceptedBy : null,
    acceptedAt: accepted ? previous.acceptedAt : null,
    acceptanceNote: accepted ? previous.acceptanceNote : null,
  }
}

/** Opens the item's finding and its risk; a finding carried from an earlier cycle keeps its rating. */
const openFinding = async (
  tx: Transaction,
  ctx: ServiceContext,
  input: SyncInput,
  context: ItemContext,
  gapType: GapType,
  carried: FindingRecord | undefined,
): Promise<FindingRef> => {
  const [source] = await tx
    .select({
      recommendation: question.recommendation,
      references: question.references,
      riskWeight: question.riskWeight,
      title: control.title,
    })
    .from(question)
    .innerJoin(
      control,
      and(eq(control.releaseId, question.releaseId), eq(control.code, question.controlCode)),
    )
    .where(
      and(eq(question.releaseId, context.releaseId), eq(question.code, context.item.questionCode)),
    )
  if (!source) throw new NotFoundError(`Question ${context.item.questionCode}`)
  const code = await nextCode(tx, input.clientId, sequenceScope('FND', context.clientCode))
  const [created] = await tx
    .insert(finding)
    .values({
      tenantId: input.clientId,
      code,
      assessmentId: context.item.assessmentId,
      itemId: input.itemId,
      questionCode: context.item.questionCode,
      controlCode: context.item.controlCode,
      domainCode: context.item.domainCode,
      title: source.title,
      gapType,
      recommendation: source.recommendation,
      references: source.references,
    })
    .returning({ id: finding.id })
  const findingId = created?.id ?? ''
  await tx.insert(findingEvent).values({
    tenantId: input.clientId,
    findingId,
    actorUserId: ctx.principal.userId,
    kind: 'opened',
    detail: {
      answer: input.answer,
      comment: input.comment,
      ...(carried ? { carriedFrom: carried.code } : {}),
    },
  })
  await tx.insert(risk).values({
    tenantId: input.clientId,
    code: await nextCode(tx, input.clientId, sequenceScope('RSK', context.clientCode)),
    findingId,
    title: source.title,
    ...(await startingRisk(tx, gapType, source.riskWeight, carried?.id)),
  })
  await audit(tx, ctx, {
    tenantId: input.clientId,
    action: 'finding.open',
    entity: 'finding',
    entityId: code,
    detail: { gapType, question: context.item.questionCode, carriedFrom: carried?.code ?? null },
  })
  return { id: findingId, code }
}

/**
 * The gap rule, applied in the same transaction as the answer: No or Partial opens (or reopens)
 * the item's finding and its risk; Yes, Not applicable or a withdrawn answer closes them. In a
 * re-assessment the answer also settles the question's open findings from earlier cycles.
 */
export const syncFinding = async (
  tx: Transaction,
  ctx: ServiceContext,
  input: SyncInput,
): Promise<void> => {
  const gapType = gapTypeOf(input.answer)
  const [existing] = await tx.select().from(finding).where(eq(finding.itemId, input.itemId))
  const context = await loadItemContext(tx, input.itemId)
  const earlier = input.answer === 'not_assessed' ? [] : await earlierOpenFindings(tx, context)
  const event = (findingId: string, kind: string, detail: Record<string, unknown>) =>
    tx.insert(findingEvent).values({
      tenantId: input.clientId,
      findingId,
      actorUserId: ctx.principal.userId,
      kind,
      detail,
    })

  let current: FindingRef | null = existing ?? null
  if (gapType && !existing) {
    current = await openFinding(tx, ctx, input, context, gapType, earlier.at(-1))
  } else if (existing && gapType && existing.status === 'closed') {
    await tx
      .update(finding)
      .set({ status: 'open', gapType, closedAt: null, closedReason: null })
      .where(eq(finding.id, existing.id))
    await tx
      .update(risk)
      .set({ status: 'open', updatedAt: new Date() })
      .where(and(eq(risk.findingId, existing.id), eq(risk.status, 'closed')))
    await event(existing.id, 'reopened', { answer: input.answer, comment: input.comment })
    await audit(tx, ctx, {
      tenantId: input.clientId,
      action: 'finding.reopen',
      entity: 'finding',
      entityId: existing.code,
    })
  } else if (existing && gapType && existing.gapType !== gapType) {
    await tx.update(finding).set({ gapType }).where(eq(finding.id, existing.id))
    await event(existing.id, gapType === 'gap' ? 'escalated' : 'downgraded', {
      answer: input.answer,
    })
  } else if (existing && !gapType && existing.status === 'open') {
    const reason = CLOSE_REASON[input.answer] ?? 'Closed'
    await tx
      .update(finding)
      .set({ status: 'closed', closedAt: new Date(), closedReason: reason })
      .where(eq(finding.id, existing.id))
    await tx
      .update(risk)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(and(eq(risk.findingId, existing.id), eq(risk.status, 'open')))
    await event(existing.id, 'closed', { answer: input.answer, reason })
    await audit(tx, ctx, {
      tenantId: input.clientId,
      action: 'finding.close',
      entity: 'finding',
      entityId: existing.code,
      detail: { reason },
    })
  }

  if (earlier.length) {
    await settleEarlierFindings(tx, ctx, input, context, earlier, gapType ? current : null)
  }
}

/**
 * Closes a finding once its remediation is finished: every action is Closed or Accepted Risk
 * and at least one was closed after verification. Its open risk closes with it; the next
 * assessment cycle confirms the fix.
 */
export const closeRemediatedFinding = async (
  tx: Transaction,
  ctx: ServiceContext,
  clientId: string,
  findingId: string,
): Promise<boolean> => {
  const actions = await tx
    .select({ status: remediationAction.status })
    .from(remediationAction)
    .where(eq(remediationAction.findingId, findingId))
  const finished = actions.every((action) => FINISHED_ACTIONS.includes(action.status))
  if (!finished || !actions.some((action) => action.status === 'closed')) return false
  const now = new Date()
  const closed = await tx
    .update(finding)
    .set({
      status: 'closed',
      closedAt: now,
      closedReason: 'Remediated: every action verified and closed',
    })
    .where(and(eq(finding.id, findingId), eq(finding.status, 'open')))
    .returning({ code: finding.code })
  if (closed.length === 0) return false
  await tx
    .update(risk)
    .set({ status: 'closed', updatedAt: now })
    .where(and(eq(risk.findingId, findingId), inArray(risk.status, ['open', 'treated'])))
  await tx.insert(findingEvent).values({
    tenantId: clientId,
    findingId,
    actorUserId: ctx.principal.userId,
    kind: 'remediated',
    detail: { actions: actions.length },
  })
  await audit(tx, ctx, {
    tenantId: clientId,
    action: 'finding.remediate',
    entity: 'finding',
    entityId: closed[0]?.code ?? findingId,
  })
  return true
}

export type FindingFilters = {
  status?: FindingStatus
  assessmentId?: string
  domain?: string
  /** A department id (the department of the finding's question), or "none" for unassigned. */
  departmentId?: string
  /** Only findings with no remediation action planned. */
  withoutActions?: boolean
}

const findingColumns = {
  id: finding.id,
  code: finding.code,
  title: finding.title,
  gapType: finding.gapType,
  status: finding.status,
  questionCode: finding.questionCode,
  controlCode: finding.controlCode,
  domainCode: finding.domainCode,
  openedAt: finding.openedAt,
  closedAt: finding.closedAt,
  closedReason: finding.closedReason,
  assessmentId: finding.assessmentId,
  assessmentCode: assessment.code,
  assessmentTitle: assessment.title,
  riskId: risk.id,
  riskCode: risk.code,
  riskScore: risk.score,
  riskStatus: risk.status,
  departmentId: assessmentItem.departmentId,
  departmentName: department.name,
}

/** Findings of a client, open ones first, newest first. */
export const listFindings = async (
  ctx: ServiceContext,
  clientId: string,
  filters: FindingFilters = {},
) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, (tx) =>
    tx
      .select(findingColumns)
      .from(finding)
      .innerJoin(assessment, eq(assessment.id, finding.assessmentId))
      .leftJoin(risk, eq(risk.findingId, finding.id))
      .leftJoin(assessmentItem, eq(assessmentItem.id, finding.itemId))
      .leftJoin(department, eq(department.id, assessmentItem.departmentId))
      .where(
        and(
          eq(finding.tenantId, clientId),
          filters.status ? eq(finding.status, filters.status) : undefined,
          filters.assessmentId ? eq(finding.assessmentId, filters.assessmentId) : undefined,
          filters.domain ? eq(finding.domainCode, filters.domain) : undefined,
          filters.withoutActions
            ? notExists(
                tx
                  .select({ one: sql`1` })
                  .from(remediationAction)
                  .where(eq(remediationAction.findingId, finding.id)),
              )
            : undefined,
          filters.departmentId === 'none'
            ? isNull(assessmentItem.departmentId)
            : filters.departmentId
              ? eq(assessmentItem.departmentId, filters.departmentId)
              : undefined,
        ),
      )
      .orderBy(desc(finding.status), desc(finding.openedAt)),
  )
}
export type FindingRow = Awaited<ReturnType<typeof listFindings>>[number]

/** One finding with its history, recommendation, references and the item it came from. */
export const getFinding = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({ finding, assessmentCode: assessment.code, assessmentTitle: assessment.title })
      .from(finding)
      .innerJoin(assessment, eq(assessment.id, finding.assessmentId))
      .where(and(eq(finding.tenantId, clientId), eq(finding.code, code.toUpperCase())))
    if (!row) throw new NotFoundError(`Finding ${code}`)
    const events = await tx
      .select()
      .from(findingEvent)
      .where(eq(findingEvent.findingId, row.finding.id))
      .orderBy(asc(findingEvent.id))
    const [item] = await tx
      .select({ answer: assessmentItem.answer, comment: assessmentItem.comment })
      .from(assessmentItem)
      .where(eq(assessmentItem.id, row.finding.itemId))
    const [linkedRisk] = await tx.select().from(risk).where(eq(risk.findingId, row.finding.id))
    return {
      ...row.finding,
      assessmentCode: row.assessmentCode,
      assessmentTitle: row.assessmentTitle,
      answer: item?.answer ?? null,
      comment: item?.comment ?? null,
      events,
      risk: linkedRisk ?? null,
    }
  })
}
export type FindingDetail = Awaited<ReturnType<typeof getFinding>>
