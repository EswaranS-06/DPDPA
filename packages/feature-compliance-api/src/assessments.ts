import { authorize, type Capability } from '@duatf/core-access'
import { sequenceScope } from '@duatf/core-utils'
import {
  and,
  ANSWERS,
  appUser,
  asc,
  assessment,
  assessmentItem,
  count,
  department,
  desc,
  domain,
  eq,
  frameworkRelease,
  inArray,
  isNull,
  ne,
  nextCode,
  question,
  tenant,
  type AssessmentStatus,
  type ComplianceState,
  type ReviewState,
  type SQL,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
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
import { syncFinding } from './findings'
import { COMPLIANCE_OF, summariseProgress } from './progress'

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

// --- Creating an assessment ---------------------------------------------------------------------

const assessmentSchema = z
  .object({
    title: requiredText('Title', 160),
    periodStart: optionalDate(),
    periodEnd: optionalDate(),
    dueDate: optionalDate(),
  })
  .refine(
    (value) => !value.periodStart || !value.periodEnd || value.periodEnd >= value.periodStart,
    {
      path: ['periodEnd'],
      message: 'The period cannot end before it starts.',
    },
  )

const publishedRelease = async (tx: Transaction) => {
  const [row] = await tx
    .select({ id: frameworkRelease.id, version: frameworkRelease.version })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  if (!row) throw new RuleError('No framework release is published yet.')
  return row
}

const clientCode = async (tx: Transaction, clientId: string) => {
  const [row] = await tx.select({ code: tenant.code }).from(tenant).where(eq(tenant.id, clientId))
  if (!row) throw new NotFoundError('Client')
  return row.code
}

/**
 * Starts an assessment cycle: pins the current framework release and creates one item for
 * every question in it.
 */
export const createAssessment = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
  options: { previousAssessmentId?: string } = {},
): Promise<{ id: string; code: string }> => {
  authorize(ctx.principal, 'assessment.create', { clientId })
  const input = parseInput(assessmentSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const release = await publishedRelease(tx)
    const questions = await tx
      .select({
        code: question.code,
        controlCode: question.controlCode,
        domainCode: question.domainCode,
        seq: question.seq,
      })
      .from(question)
      .where(eq(question.releaseId, release.id))
      .orderBy(asc(question.seq))
    if (questions.length === 0) throw new RuleError('The knowledge base has no questions yet.')
    const code = await nextCode(tx, clientId, sequenceScope('ASM', await clientCode(tx, clientId)))
    const [created] = await tx
      .insert(assessment)
      .values({
        tenantId: clientId,
        code,
        title: input.title,
        releaseId: release.id,
        periodStart: input.periodStart ?? null,
        periodEnd: input.periodEnd ?? null,
        dueDate: input.dueDate ?? null,
        previousAssessmentId: options.previousAssessmentId ?? null,
        createdBy: ctx.principal.userId,
      })
      .returning({ id: assessment.id })
    const id = created?.id ?? ''
    await tx.insert(assessmentItem).values(
      questions.map((row) => ({
        tenantId: clientId,
        assessmentId: id,
        questionCode: row.code,
        controlCode: row.controlCode,
        domainCode: row.domainCode,
        seq: row.seq,
      })),
    )
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'assessment.create',
      entity: 'assessment',
      entityId: code,
      detail: { title: input.title, release: release.version, items: questions.length },
    })
    return { id, code }
  })
}

// --- Reading ----------------------------------------------------------------------------------

const stateCounts = (tx: Transaction, where: SQL | undefined) =>
  tx
    .select({
      complianceState: assessmentItem.complianceState,
      reviewState: assessmentItem.reviewState,
      n: count(),
    })
    .from(assessmentItem)
    .where(where)
    .groupBy(assessmentItem.complianceState, assessmentItem.reviewState)

export const listAssessments = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const rows = await tx
      .select({ assessment, releaseVersion: frameworkRelease.version })
      .from(assessment)
      .innerJoin(frameworkRelease, eq(frameworkRelease.id, assessment.releaseId))
      .where(eq(assessment.tenantId, clientId))
      .orderBy(desc(assessment.createdAt))
    const counts = await tx
      .select({
        assessmentId: assessmentItem.assessmentId,
        complianceState: assessmentItem.complianceState,
        reviewState: assessmentItem.reviewState,
        n: count(),
      })
      .from(assessmentItem)
      .where(eq(assessmentItem.tenantId, clientId))
      .groupBy(
        assessmentItem.assessmentId,
        assessmentItem.complianceState,
        assessmentItem.reviewState,
      )
    return rows.map((row) => ({
      ...row.assessment,
      releaseVersion: row.releaseVersion,
      progress: summariseProgress(counts.filter((item) => item.assessmentId === row.assessment.id)),
    }))
  })
}
export type AssessmentSummary = Awaited<ReturnType<typeof listAssessments>>[number]

const findAssessment = async (tx: Transaction, clientId: string, code: string) => {
  const [row] = await tx
    .select({ assessment, releaseVersion: frameworkRelease.version })
    .from(assessment)
    .innerJoin(frameworkRelease, eq(frameworkRelease.id, assessment.releaseId))
    .where(and(eq(assessment.tenantId, clientId), eq(assessment.code, code.toUpperCase())))
  if (!row) throw new NotFoundError(`Assessment ${code}`)
  return { ...row.assessment, releaseVersion: row.releaseVersion }
}

/** One assessment with overall progress and progress by domain and by department. */
export const getAssessment = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const found = await findAssessment(tx, clientId, code)
    const byGroup = await tx
      .select({
        domainCode: assessmentItem.domainCode,
        departmentId: assessmentItem.departmentId,
        complianceState: assessmentItem.complianceState,
        reviewState: assessmentItem.reviewState,
        n: count(),
      })
      .from(assessmentItem)
      .where(eq(assessmentItem.assessmentId, found.id))
      .groupBy(
        assessmentItem.domainCode,
        assessmentItem.departmentId,
        assessmentItem.complianceState,
        assessmentItem.reviewState,
      )
    const domains = await tx
      .select({ code: domain.code, title: domain.title })
      .from(domain)
      .where(eq(domain.releaseId, found.releaseId))
      .orderBy(asc(domain.code))
    const departments = await tx
      .select({ id: department.id, code: department.code, name: department.name })
      .from(department)
      .where(eq(department.tenantId, clientId))
      .orderBy(asc(department.code))
    const progressWhere = (match: (row: (typeof byGroup)[number]) => boolean) =>
      summariseProgress(byGroup.filter(match))
    return {
      ...found,
      progress: summariseProgress(byGroup),
      domains: domains
        .map((row) => ({ ...row, progress: progressWhere((item) => item.domainCode === row.code) }))
        .filter((row) => row.progress.total > 0),
      departments: [
        ...departments.map((row) => ({
          ...row,
          progress: progressWhere((item) => item.departmentId === row.id),
        })),
        {
          id: null,
          code: '',
          name: 'Not assigned',
          progress: progressWhere((item) => item.departmentId === null),
        },
      ].filter((row) => row.progress.total > 0),
    }
  })
}
export type AssessmentDetail = Awaited<ReturnType<typeof getAssessment>>

export type ItemFilters = {
  domain?: string
  /** A department id, or "none" for items not yet assigned. */
  department?: string
  state?: ComplianceState
  review?: ReviewState
}

const itemColumns = {
  id: assessmentItem.id,
  questionCode: assessmentItem.questionCode,
  controlCode: assessmentItem.controlCode,
  domainCode: assessmentItem.domainCode,
  seq: assessmentItem.seq,
  departmentId: assessmentItem.departmentId,
  departmentName: department.name,
  answer: assessmentItem.answer,
  complianceState: assessmentItem.complianceState,
  reviewState: assessmentItem.reviewState,
  answeredAt: assessmentItem.answeredAt,
  text: question.text,
  riskWeight: question.riskWeight,
}

/** Items of an assessment with their question text, in question order. */
export const listItems = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  filters: ItemFilters = {},
) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [owner] = await tx
      .select({ releaseId: assessment.releaseId })
      .from(assessment)
      .where(and(eq(assessment.id, assessmentId), eq(assessment.tenantId, clientId)))
    if (!owner) throw new NotFoundError('Assessment')
    return tx
      .select(itemColumns)
      .from(assessmentItem)
      .innerJoin(
        question,
        and(
          eq(question.releaseId, owner.releaseId),
          eq(question.code, assessmentItem.questionCode),
        ),
      )
      .leftJoin(department, eq(department.id, assessmentItem.departmentId))
      .where(
        and(
          eq(assessmentItem.assessmentId, assessmentId),
          filters.domain ? eq(assessmentItem.domainCode, filters.domain) : undefined,
          filters.department === 'none'
            ? isNull(assessmentItem.departmentId)
            : filters.department
              ? eq(assessmentItem.departmentId, filters.department)
              : undefined,
          filters.state ? eq(assessmentItem.complianceState, filters.state) : undefined,
          filters.review ? eq(assessmentItem.reviewState, filters.review) : undefined,
        ),
      )
      .orderBy(asc(assessmentItem.seq))
  })
}
export type ItemRow = Awaited<ReturnType<typeof listItems>>[number]

/** One item with everything needed to answer and review it. */
export const getItem = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentCode: string,
  questionCode: string,
) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const found = await findAssessment(tx, clientId, assessmentCode)
    const [row] = await tx
      .select({ item: assessmentItem, question, departmentName: department.name })
      .from(assessmentItem)
      .innerJoin(
        question,
        and(
          eq(question.releaseId, found.releaseId),
          eq(question.code, assessmentItem.questionCode),
        ),
      )
      .leftJoin(department, eq(department.id, assessmentItem.departmentId))
      .where(
        and(
          eq(assessmentItem.assessmentId, found.id),
          eq(assessmentItem.questionCode, questionCode.toUpperCase()),
        ),
      )
    if (!row) throw new NotFoundError(`Question ${questionCode}`)
    const people = [row.item.answeredBy, row.item.reviewedBy].filter((id) => id !== null)
    const names = people.length
      ? await tx
          .select({ id: appUser.id, name: appUser.displayName })
          .from(appUser)
          .where(inArray(appUser.id, people))
      : []
    const nameOf = (id: string | null) => names.find((person) => person.id === id)?.name ?? null
    const siblings = await tx
      .select({ code: assessmentItem.questionCode, seq: assessmentItem.seq })
      .from(assessmentItem)
      .where(eq(assessmentItem.assessmentId, found.id))
      .orderBy(asc(assessmentItem.seq))
    const index = siblings.findIndex((item) => item.code === row.item.questionCode)
    const [previous] = found.previousAssessmentId
      ? await tx
          .select({ answer: assessmentItem.answer, comment: assessmentItem.comment })
          .from(assessmentItem)
          .where(
            and(
              eq(assessmentItem.assessmentId, found.previousAssessmentId),
              eq(assessmentItem.questionCode, row.item.questionCode),
            ),
          )
      : []
    return {
      assessment: found,
      item: {
        ...row.item,
        departmentName: row.departmentName,
        answeredByName: nameOf(row.item.answeredBy),
        reviewedByName: nameOf(row.item.reviewedBy),
      },
      question: row.question,
      previousCycle: previous ?? null,
      previousCode: siblings[index - 1]?.code ?? null,
      nextCode: siblings[index + 1]?.code ?? null,
    }
  })
}
export type ItemDetail = Awaited<ReturnType<typeof getItem>>

// --- Answering and reviewing ----------------------------------------------------------------

const answerSchema = z
  .object({
    answer: z.enum(ANSWERS, { error: 'Choose an answer.' }),
    naReason: z.preprocess(blankToUndefined, z.string().trim().max(2000).optional()),
    comment: optionalText(4000),
  })
  .refine((value) => value.answer !== 'not_applicable' || (value.naReason?.length ?? 0) >= 10, {
    path: ['naReason'],
    message: 'Say why the question does not apply (at least 10 characters).',
  })

const loadItem = async (tx: Transaction, clientId: string, itemId: string) => {
  const [row] = await tx
    .select({ item: assessmentItem, status: assessment.status, assessmentCode: assessment.code })
    .from(assessmentItem)
    .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
    .where(and(eq(assessmentItem.id, itemId), eq(assessmentItem.tenantId, clientId)))
  if (!row) throw new NotFoundError('Question')
  return row
}

/**
 * Records an answer. Department owners may answer only their department's items. Answers are
 * locked once the assessment is under review, except for items the reviewer sent back.
 */
export const answerItem = async (
  ctx: ServiceContext,
  clientId: string,
  itemId: string,
  raw: unknown,
): Promise<{ complianceState: ComplianceState }> => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  const input = parseInput(answerSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const { item, status, assessmentCode } = await loadItem(tx, clientId, itemId)
    authorize(ctx.principal, 'assessment.answer', { clientId, departmentId: item.departmentId })
    if (status === 'completed')
      throw new RuleError('This assessment is completed; answers are locked.')
    if (status === 'in_review' && item.reviewState !== 'returned') {
      throw new RuleError(
        'This assessment is under review; only questions sent back can be changed.',
      )
    }
    const now = new Date()
    if (status === 'draft') {
      await tx
        .update(assessment)
        .set({ status: 'in_progress', startedAt: now })
        .where(eq(assessment.id, item.assessmentId))
    }
    await tx
      .update(assessmentItem)
      .set({
        answer: input.answer,
        naReason: input.answer === 'not_applicable' ? (input.naReason ?? null) : null,
        comment: input.comment ?? null,
        answeredBy: input.answer === 'not_assessed' ? null : ctx.principal.userId,
        answeredAt: input.answer === 'not_assessed' ? null : now,
        reviewState: 'not_reviewed',
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
      })
      .where(eq(assessmentItem.id, itemId))
    await syncFinding(tx, ctx, {
      clientId,
      itemId,
      answer: input.answer,
      comment: input.comment ?? null,
    })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'item.answer',
      entity: 'assessment_item',
      entityId: `${assessmentCode}/${item.questionCode}`,
      detail: { answer: input.answer, previous: item.answer },
    })
    return { complianceState: COMPLIANCE_OF[input.answer] }
  })
}

const reviewSchema = z
  .object({
    decision: z.enum(['accepted', 'returned'], { error: 'Accept or send back.' }),
    note: optionalText(2000),
  })
  .refine((value) => value.decision === 'accepted' || (value.note?.length ?? 0) > 0, {
    path: ['note'],
    message: 'Say what needs to change before it can be accepted.',
  })

/** Accepts an answer or sends it back. The person who answered cannot review it. */
export const reviewItem = async (
  ctx: ServiceContext,
  clientId: string,
  itemId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.review', { clientId })
  const input = parseInput(reviewSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const { item, status, assessmentCode } = await loadItem(tx, clientId, itemId)
    if (status === 'completed') throw new RuleError('This assessment is completed.')
    if (item.answer === 'not_assessed')
      throw new RuleError('Only answered questions can be reviewed.')
    if (item.answeredBy === ctx.principal.userId) {
      throw new RuleError('Someone other than the person who answered must review it.')
    }
    await tx
      .update(assessmentItem)
      .set({
        reviewState: input.decision,
        reviewNote: input.note ?? null,
        reviewedBy: ctx.principal.userId,
        reviewedAt: new Date(),
      })
      .where(eq(assessmentItem.id, itemId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: `item.review.${input.decision}`,
      entity: 'assessment_item',
      entityId: `${assessmentCode}/${item.questionCode}`,
    })
  })
}

// --- Assigning and moving the cycle on --------------------------------------------------------

const assignSchema = z
  .object({
    departmentId: z.preprocess(blankToUndefined, z.uuid('Choose a department.').optional()),
    domainCode: z.preprocess(blankToUndefined, z.string().max(8).optional()),
    itemIds: z.preprocess(
      (value) =>
        typeof value === 'string' ? value.split(',').filter(Boolean) : (value ?? undefined),
      z.array(z.uuid()).max(500).optional(),
    ),
  })
  .refine((value) => value.domainCode || value.itemIds?.length, {
    path: ['domainCode'],
    message: 'Choose a domain or at least one question.',
  })

/** Gives questions (a whole domain, or chosen items) to a department; empty department unassigns. */
export const assignItems = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  raw: unknown,
): Promise<number> => {
  authorize(ctx.principal, 'assessment.assign', { clientId })
  const input = parseInput(assignSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const [found] = await tx
      .select({ code: assessment.code, status: assessment.status })
      .from(assessment)
      .where(and(eq(assessment.id, assessmentId), eq(assessment.tenantId, clientId)))
    if (!found) throw new NotFoundError('Assessment')
    if (found.status === 'completed') throw new RuleError('This assessment is completed.')
    if (input.departmentId) {
      const [target] = await tx
        .select({ active: department.active })
        .from(department)
        .where(and(eq(department.id, input.departmentId), eq(department.tenantId, clientId)))
      if (!target?.active)
        throw new ValidationError({ departmentId: 'Choose an active department.' })
    }
    const updated = await tx
      .update(assessmentItem)
      .set({ departmentId: input.departmentId ?? null })
      .where(
        and(
          eq(assessmentItem.assessmentId, assessmentId),
          input.domainCode ? eq(assessmentItem.domainCode, input.domainCode) : undefined,
          input.itemIds?.length ? inArray(assessmentItem.id, input.itemIds) : undefined,
        ),
      )
      .returning({ id: assessmentItem.id })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'item.assign',
      entity: 'assessment',
      entityId: found.code,
      detail: {
        departmentId: input.departmentId ?? null,
        domain: input.domainCode ?? null,
        items: updated.length,
      },
    })
    return updated.length
  })
}

type Transition = { to: AssessmentStatus; capability: Capability; label: string }

/** Allowed moves of an assessment cycle and who may make them. */
export const TRANSITIONS: Record<AssessmentStatus, Transition[]> = {
  draft: [{ to: 'in_progress', capability: 'assessment.assign', label: 'Start' }],
  in_progress: [{ to: 'in_review', capability: 'assessment.assign', label: 'Submit for review' }],
  in_review: [
    { to: 'completed', capability: 'assessment.review', label: 'Complete' },
    { to: 'in_progress', capability: 'assessment.review', label: 'Reopen for answers' },
  ],
  completed: [{ to: 'in_review', capability: 'assessment.create', label: 'Reopen review' }],
}

export const changeAssessmentStatus = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  target: string,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const [found] = await tx
      .select()
      .from(assessment)
      .where(and(eq(assessment.id, assessmentId), eq(assessment.tenantId, clientId)))
    if (!found) throw new NotFoundError('Assessment')
    const transition = TRANSITIONS[found.status].find((item) => item.to === target)
    if (!transition)
      throw new RuleError(
        `An assessment that is ${found.status.replace('_', ' ')} cannot move to ${target.replace('_', ' ')}.`,
      )
    authorize(ctx.principal, transition.capability, { clientId })
    const progress = summariseProgress(
      await stateCounts(tx, eq(assessmentItem.assessmentId, assessmentId)),
    )
    if (transition.to === 'in_review' && found.status === 'in_progress' && progress.pending > 0) {
      throw new RuleError(`${progress.pending} questions are not answered yet.`)
    }
    if (transition.to === 'completed') {
      const [open] = await tx
        .select({ n: count() })
        .from(assessmentItem)
        .where(
          and(
            eq(assessmentItem.assessmentId, assessmentId),
            ne(assessmentItem.reviewState, 'accepted'),
          ),
        )
      if ((open?.n ?? 0) > 0) {
        throw new RuleError(`${open?.n ?? 0} answers are not accepted yet.`)
      }
    }
    const now = new Date()
    await tx
      .update(assessment)
      .set({
        status: transition.to,
        startedAt: found.startedAt ?? (transition.to === 'in_progress' ? now : null),
        completedAt: transition.to === 'completed' ? now : null,
      })
      .where(eq(assessment.id, assessmentId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: `assessment.${transition.to}`,
      entity: 'assessment',
      entityId: found.code,
      detail: { from: found.status, progress: progress.progressPct },
    })
  })
}
