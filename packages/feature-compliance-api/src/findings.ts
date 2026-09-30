import { authorize } from '@duatf/core-access'
import { sequenceScope } from '@duatf/core-utils'
import {
  and,
  asc,
  assessment,
  assessmentItem,
  control,
  desc,
  eq,
  finding,
  findingEvent,
  nextCode,
  question,
  risk,
  tenant,
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

/**
 * The gap rule, applied in the same transaction as the answer: No or Partial opens (or reopens)
 * the item's finding and its risk; Yes, Not applicable or a withdrawn answer closes them.
 */
export const syncFinding = async (
  tx: Transaction,
  ctx: ServiceContext,
  input: SyncInput,
): Promise<void> => {
  const gapType = gapTypeOf(input.answer)
  const [existing] = await tx.select().from(finding).where(eq(finding.itemId, input.itemId))
  const event = (findingId: string, kind: string, detail: Record<string, unknown>) =>
    tx.insert(findingEvent).values({
      tenantId: input.clientId,
      findingId,
      actorUserId: ctx.principal.userId,
      kind,
      detail,
    })

  if (gapType && !existing) {
    const [row] = await tx
      .select({
        item: assessmentItem,
        releaseId: assessment.releaseId,
        clientCode: tenant.code,
      })
      .from(assessmentItem)
      .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
      .innerJoin(tenant, eq(tenant.id, assessmentItem.tenantId))
      .where(eq(assessmentItem.id, input.itemId))
    if (!row) throw new NotFoundError('Question')
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
      .where(and(eq(question.releaseId, row.releaseId), eq(question.code, row.item.questionCode)))
    if (!source) throw new NotFoundError(`Question ${row.item.questionCode}`)
    const code = await nextCode(tx, input.clientId, sequenceScope('FND', row.clientCode))
    const [created] = await tx
      .insert(finding)
      .values({
        tenantId: input.clientId,
        code,
        assessmentId: row.item.assessmentId,
        itemId: input.itemId,
        questionCode: row.item.questionCode,
        controlCode: row.item.controlCode,
        domainCode: row.item.domainCode,
        title: source.title,
        gapType,
        recommendation: source.recommendation,
        references: source.references,
      })
      .returning({ id: finding.id })
    const findingId = created?.id ?? ''
    await event(findingId, 'opened', { answer: input.answer, comment: input.comment })
    await tx.insert(risk).values({
      tenantId: input.clientId,
      code: await nextCode(tx, input.clientId, sequenceScope('RSK', row.clientCode)),
      findingId,
      title: source.title,
      likelihood: DEFAULT_LIKELIHOOD[gapType],
      impact: source.riskWeight,
    })
    await audit(tx, ctx, {
      tenantId: input.clientId,
      action: 'finding.open',
      entity: 'finding',
      entityId: code,
      detail: { gapType, question: row.item.questionCode },
    })
    return
  }
  if (!existing) return

  if (gapType && existing.status === 'closed') {
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
  } else if (gapType && existing.gapType !== gapType) {
    await tx.update(finding).set({ gapType }).where(eq(finding.id, existing.id))
    await event(existing.id, gapType === 'gap' ? 'escalated' : 'downgraded', {
      answer: input.answer,
    })
  } else if (!gapType && existing.status === 'open') {
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
}

export type FindingFilters = { status?: FindingStatus; assessmentId?: string; domain?: string }

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
      .where(
        and(
          eq(finding.tenantId, clientId),
          filters.status ? eq(finding.status, filters.status) : undefined,
          filters.assessmentId ? eq(finding.assessmentId, filters.assessmentId) : undefined,
          filters.domain ? eq(finding.domainCode, filters.domain) : undefined,
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
