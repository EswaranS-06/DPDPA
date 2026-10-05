import { authorize, type Capability } from '@duatf/core-access'
import { sequenceScope } from '@duatf/core-utils'
import {
  and,
  appUser,
  asc,
  assessment,
  assessmentItem,
  count,
  department,
  desc,
  domain,
  eq,
  evidenceLink,
  finding,
  frameworkRelease,
  inArray,
  ne,
  nextCode,
  question,
  questionnaire,
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
import { dependentsOf, gateConflict, readGates, reconcileQuestions } from './reconcile'
import { evaluateResponse } from './responses'

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const toList = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  const list: unknown[] = Array.isArray(value) ? value : [value]
  return list.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

// --- Cycles -------------------------------------------------------------------------------------

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
  if (!row) throw new RuleError('No knowledge-base release is published yet.')
  return row
}

const clientCode = async (tx: Transaction, clientId: string) => {
  const [row] = await tx.select({ code: tenant.code }).from(tenant).where(eq(tenant.id, clientId))
  if (!row) throw new NotFoundError('Client')
  return row.code
}

type NewCycle = {
  title: string
  periodStart?: string
  periodEnd?: string
  dueDate?: string
  previousAssessmentId?: string
}

/**
 * Opens a cycle on the current release. A follow-up cycle takes over every question each
 * active department had in the previous one (when the question is still in the release).
 */
const insertCycle = async (
  tx: Transaction,
  ctx: ServiceContext,
  clientId: string,
  input: NewCycle,
): Promise<{ id: string; code: string; copied: number }> => {
  const release = await publishedRelease(tx)
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
      previousAssessmentId: input.previousAssessmentId ?? null,
      createdBy: ctx.principal.userId,
    })
    .returning({ id: assessment.id })
  const id = created?.id ?? ''
  let copied = 0
  if (input.previousAssessmentId) {
    const carried = await tx
      .select({
        questionCode: assessmentItem.questionCode,
        departmentId: assessmentItem.departmentId,
        controlCode: question.controlCode,
        domainCode: question.domainCode,
        seq: question.seq,
      })
      .from(assessmentItem)
      .innerJoin(department, eq(department.id, assessmentItem.departmentId))
      .innerJoin(
        question,
        and(eq(question.releaseId, release.id), eq(question.code, assessmentItem.questionCode)),
      )
      .where(
        and(
          eq(assessmentItem.assessmentId, input.previousAssessmentId),
          eq(department.active, true),
        ),
      )
    if (carried.length) {
      await tx
        .insert(assessmentItem)
        .values(carried.map((row) => ({ ...row, tenantId: clientId, assessmentId: id })))
    }
    copied = carried.length
  }
  await audit(tx, ctx, {
    tenantId: clientId,
    action: input.previousAssessmentId ? 'assessment.reassess' : 'assessment.create',
    entity: 'assessment',
    entityId: code,
    detail: { title: input.title, release: release.version, items: copied },
  })
  return { id, code, copied }
}

/**
 * Starts an assessment cycle pinned to the current knowledge-base release. Questions reach it
 * through the departments: each department's chosen questions become its items.
 */
export const createAssessment = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
  options: { previousAssessmentId?: string } = {},
): Promise<{ id: string; code: string; copied: number }> => {
  authorize(ctx.principal, 'assessment.create', { clientId })
  const input = parseInput(assessmentSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const open = await openCycle(tx, clientId)
    if (open) {
      throw new RuleError(`${open.code} is still open. Complete it before starting another cycle.`)
    }
    return insertCycle(tx, ctx, clientId, { ...input, ...options })
  })
}

/** The client's cycle that is not completed yet, if any. */
export const openCycle = async (tx: Transaction, clientId: string) => {
  const [row] = await tx
    .select({
      id: assessment.id,
      code: assessment.code,
      status: assessment.status,
      releaseId: assessment.releaseId,
    })
    .from(assessment)
    .where(and(eq(assessment.tenantId, clientId), ne(assessment.status, 'completed')))
    .orderBy(desc(assessment.createdAt))
    .limit(1)
  return row ?? null
}

const latestCycle = async (tx: Transaction, clientId: string) => {
  const [row] = await tx
    .select({ code: assessment.code })
    .from(assessment)
    .where(eq(assessment.tenantId, clientId))
    .orderBy(desc(assessment.createdAt))
    .limit(1)
  return row ?? null
}

/**
 * The cycle new department questions go into: the open one; for a client with no cycle yet,
 * a first cycle is opened. After a completed cycle the next one must be started on purpose.
 */
const cycleForQuestions = async (tx: Transaction, ctx: ServiceContext, clientId: string) => {
  const open = await openCycle(tx, clientId)
  if (open) return open
  const latest = await latestCycle(tx, clientId)
  if (latest) {
    throw new RuleError(
      `${latest.code} is completed. Start the next cycle from Assessments to change questions.`,
    )
  }
  const year = new Date().getFullYear()
  const created = await insertCycle(tx, ctx, clientId, { title: `DPDP assessment ${year}` })
  const cycle = await openCycle(tx, clientId)
  if (!cycle || cycle.id !== created.id) throw new Error('The new cycle could not be read back.')
  return cycle
}

// --- The questions of a department ------------------------------------------------------------

export type PickerQuestion = {
  code: string
  title: string
  text: string
  answerType: string
  riskLevel: string
  selected: boolean
  /** Why the question cannot be taken away from the department, when it cannot. */
  locked: string | null
}
export type PickerSection = { name: string; questions: PickerQuestion[] }
export type PickerQuestionnaire = {
  code: string
  title: string
  respondent: string
  description: string
  sections: PickerSection[]
}
export type QuestionPicker = {
  release: { id: string; version: string }
  cycle: { id: string; code: string; status: AssessmentStatus } | null
  /** Set when the questions cannot be changed now (the last cycle is completed). */
  closed: string | null
  questionnaires: PickerQuestionnaire[]
}

const lockReasons = async (tx: Transaction, itemIds: string[]) => {
  if (itemIds.length === 0) return new Map<string, string>()
  const items = await tx
    .select({ id: assessmentItem.id, answer: assessmentItem.answer })
    .from(assessmentItem)
    .where(inArray(assessmentItem.id, itemIds))
  const linked = await tx
    .select({ itemId: evidenceLink.itemId })
    .from(evidenceLink)
    .where(inArray(evidenceLink.itemId, itemIds))
  const raised = await tx
    .select({ itemId: finding.itemId })
    .from(finding)
    .where(inArray(finding.itemId, itemIds))
  const reasons = new Map<string, string>()
  for (const item of items) {
    if (raised.some((row) => row.itemId === item.id)) reasons.set(item.id, 'Has a finding')
    else if (linked.some((row) => row.itemId === item.id)) reasons.set(item.id, 'Has evidence')
    else if (item.answer !== 'not_assessed') reasons.set(item.id, 'Answered')
  }
  return reasons
}

/**
 * Every question of the release, grouped by questionnaire and section, marked with the ones the
 * department already has in the open cycle. For a new department pass null.
 */
export const departmentQuestionPicker = async (
  ctx: ServiceContext,
  clientId: string,
  departmentId: string | null,
): Promise<QuestionPicker> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const cycle = await openCycle(tx, clientId)
    const latest = cycle ? null : await latestCycle(tx, clientId)
    const release = cycle
      ? await tx
          .select({ id: frameworkRelease.id, version: frameworkRelease.version })
          .from(frameworkRelease)
          .where(eq(frameworkRelease.id, cycle.releaseId))
          .then((rows) => rows[0] ?? null)
      : await publishedRelease(tx)
    if (!release) throw new NotFoundError('Release')
    const groups = await tx
      .select()
      .from(questionnaire)
      .where(eq(questionnaire.releaseId, release.id))
      .orderBy(asc(questionnaire.seq))
    const questions = await tx
      .select({
        code: question.code,
        title: question.title,
        text: question.text,
        answerType: question.answerType,
        riskLevel: question.riskLevel,
        questionnaireCode: question.questionnaireCode,
        section: question.section,
      })
      .from(question)
      .where(eq(question.releaseId, release.id))
      .orderBy(asc(question.seq))
    const mine =
      cycle && departmentId
        ? await tx
            .select({ id: assessmentItem.id, questionCode: assessmentItem.questionCode })
            .from(assessmentItem)
            .where(
              and(
                eq(assessmentItem.assessmentId, cycle.id),
                eq(assessmentItem.departmentId, departmentId),
              ),
            )
        : []
    const locks = await lockReasons(
      tx,
      mine.map((row) => row.id),
    )
    return {
      release,
      cycle: cycle ? { id: cycle.id, code: cycle.code, status: cycle.status } : null,
      closed: latest
        ? `${latest.code} is completed. Start the next cycle to change questions.`
        : null,
      questionnaires: groups.map((group) => {
        const own = questions.filter((row) => row.questionnaireCode === group.code)
        const sections = [...new Set(own.map((row) => row.section))]
        return {
          code: group.code,
          title: group.title,
          respondent: group.respondent,
          description: group.description,
          sections: sections.map((name) => ({
            name,
            questions: own
              .filter((row) => row.section === name)
              .map((row) => {
                const item = mine.find((entry) => entry.questionCode === row.code)
                return {
                  code: row.code,
                  title: row.title,
                  text: row.text,
                  answerType: row.answerType,
                  riskLevel: row.riskLevel,
                  selected: Boolean(item),
                  locked: item ? (locks.get(item.id) ?? null) : null,
                }
              }),
          })),
        }
      }),
    }
  })
}

const questionListSchema = z.object({
  questions: z.preprocess(toList, z.array(z.string().max(20)).max(1000).default([])),
})

export type QuestionChange = { added: number; removed: number; kept: string[] }

/**
 * Gives a department exactly the chosen questions in the open cycle: new ones become items,
 * unchosen ones are removed unless they were answered, have evidence or a finding.
 */
export const applyDepartmentQuestions = async (
  tx: Transaction,
  ctx: ServiceContext,
  clientId: string,
  departmentId: string,
  codes: readonly string[],
): Promise<QuestionChange> => {
  const wanted = [...new Set(codes.map((code) => code.trim().toUpperCase()))]
  const open = await openCycle(tx, clientId)
  if (wanted.length === 0 && !open) return { added: 0, removed: 0, kept: [] }
  const cycle = open ?? (await cycleForQuestions(tx, ctx, clientId))
  const available = await tx
    .select({
      code: question.code,
      controlCode: question.controlCode,
      domainCode: question.domainCode,
      seq: question.seq,
    })
    .from(question)
    .where(eq(question.releaseId, cycle.releaseId))
  const unknown = wanted.filter((code) => !available.some((row) => row.code === code))
  if (unknown.length) {
    throw new ValidationError({ questions: `Unknown questions: ${unknown.join(', ')}.` })
  }
  const current = await tx
    .select({ id: assessmentItem.id, questionCode: assessmentItem.questionCode })
    .from(assessmentItem)
    .where(
      and(eq(assessmentItem.assessmentId, cycle.id), eq(assessmentItem.departmentId, departmentId)),
    )
  const adding = available.filter(
    (row) => wanted.includes(row.code) && !current.some((item) => item.questionCode === row.code),
  )
  if (adding.length) {
    await tx.insert(assessmentItem).values(
      adding.map((row) => ({
        tenantId: clientId,
        assessmentId: cycle.id,
        questionCode: row.code,
        controlCode: row.controlCode,
        domainCode: row.domainCode,
        seq: row.seq,
        departmentId,
      })),
    )
  }
  await reconcileQuestions(tx, ctx, {
    clientId,
    assessmentId: cycle.id,
    releaseId: cycle.releaseId,
    codes: adding.map((row) => row.code),
  })
  const dropping = current.filter((item) => !wanted.includes(item.questionCode))
  const locks = await lockReasons(
    tx,
    dropping.map((item) => item.id),
  )
  const removable = dropping.filter((item) => !locks.has(item.id))
  if (removable.length) {
    await tx.delete(assessmentItem).where(
      inArray(
        assessmentItem.id,
        removable.map((item) => item.id),
      ),
    )
  }
  const kept = dropping
    .filter((item) => locks.has(item.id))
    .map((item) => `${item.questionCode} (${locks.get(item.id)?.toLowerCase() ?? 'in use'})`)
  if (adding.length || removable.length) {
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'department.questions',
      entity: 'assessment',
      entityId: cycle.code,
      detail: {
        departmentId,
        added: adding.map((row) => row.code),
        removed: removable.map((item) => item.questionCode),
        kept,
      },
    })
  }
  return { added: adding.length, removed: removable.length, kept }
}

/** Sets the questions of an existing department. */
export const setDepartmentQuestions = async (
  ctx: ServiceContext,
  clientId: string,
  departmentId: string,
  raw: unknown,
): Promise<QuestionChange> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  const input = parseInput(questionListSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const [target] = await tx
      .select({ active: department.active })
      .from(department)
      .where(and(eq(department.id, departmentId), eq(department.tenantId, clientId)))
    if (!target) throw new NotFoundError('Department')
    if (!target.active && input.questions.length) {
      throw new RuleError('Switch the department back on before giving it questions.')
    }
    return applyDepartmentQuestions(tx, ctx, clientId, departmentId, input.questions)
  })
}

/** Parses the question codes sent with a department form. */
export const parseQuestionList = (raw: unknown): string[] =>
  parseInput(questionListSchema, raw).questions

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

/** One assessment with progress overall, by domain, by department and by questionnaire. */
export const getAssessment = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const found = await findAssessment(tx, clientId, code)
    const byGroup = await tx
      .select({
        domainCode: assessmentItem.domainCode,
        departmentId: assessmentItem.departmentId,
        questionnaireCode: question.questionnaireCode,
        complianceState: assessmentItem.complianceState,
        reviewState: assessmentItem.reviewState,
        n: count(),
      })
      .from(assessmentItem)
      .innerJoin(
        question,
        and(
          eq(question.releaseId, found.releaseId),
          eq(question.code, assessmentItem.questionCode),
        ),
      )
      .where(eq(assessmentItem.assessmentId, found.id))
      .groupBy(
        assessmentItem.domainCode,
        assessmentItem.departmentId,
        question.questionnaireCode,
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
    const groups = await tx
      .select({ code: questionnaire.code, title: questionnaire.title })
      .from(questionnaire)
      .where(eq(questionnaire.releaseId, found.releaseId))
      .orderBy(asc(questionnaire.seq))
    const progressWhere = (match: (row: (typeof byGroup)[number]) => boolean) =>
      summariseProgress(byGroup.filter(match))
    return {
      ...found,
      progress: summariseProgress(byGroup),
      domains: domains
        .map((row) => ({ ...row, progress: progressWhere((item) => item.domainCode === row.code) }))
        .filter((row) => row.progress.total > 0),
      departments: departments
        .map((row) => ({
          ...row,
          progress: progressWhere((item) => item.departmentId === row.id),
        }))
        .filter((row) => row.progress.total > 0),
      questionnaires: groups
        .map((row) => ({
          ...row,
          progress: progressWhere((item) => item.questionnaireCode === row.code),
        }))
        .filter((row) => row.progress.total > 0),
    }
  })
}
export type AssessmentDetail = Awaited<ReturnType<typeof getAssessment>>

export type ItemFilters = {
  domain?: string
  /** A department id. */
  department?: string
  questionnaire?: string
  state?: ComplianceState
  /** "unchecked" for answered questions not yet self-checked; "checked" for checked ones. */
  check?: 'unchecked' | 'checked'
  /** Questions given to this person. */
  assignee?: string
}

const itemColumns = {
  id: assessmentItem.id,
  questionCode: assessmentItem.questionCode,
  controlCode: assessmentItem.controlCode,
  domainCode: assessmentItem.domainCode,
  seq: assessmentItem.seq,
  departmentId: assessmentItem.departmentId,
  departmentCode: department.code,
  departmentName: department.name,
  assigneeUserId: assessmentItem.assigneeUserId,
  assigneeName: appUser.displayName,
  autoNaFrom: assessmentItem.autoNaFrom,
  answer: assessmentItem.answer,
  response: assessmentItem.response,
  complianceState: assessmentItem.complianceState,
  reviewState: assessmentItem.reviewState,
  answeredAt: assessmentItem.answeredAt,
  text: question.text,
  title: question.title,
  section: question.section,
  questionnaireCode: question.questionnaireCode,
  answerType: question.answerType,
  options: question.options,
  riskLevel: question.riskLevel,
  riskWeight: question.riskWeight,
}

/** Items of an assessment with their question, by department then question order. */
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
      .leftJoin(appUser, eq(appUser.id, assessmentItem.assigneeUserId))
      .where(
        and(
          eq(assessmentItem.assessmentId, assessmentId),
          filters.assignee ? eq(assessmentItem.assigneeUserId, filters.assignee) : undefined,
          filters.domain ? eq(assessmentItem.domainCode, filters.domain) : undefined,
          filters.department ? eq(assessmentItem.departmentId, filters.department) : undefined,
          filters.questionnaire ? eq(question.questionnaireCode, filters.questionnaire) : undefined,
          filters.state ? eq(assessmentItem.complianceState, filters.state) : undefined,
          filters.check === 'unchecked'
            ? and(
                ne(assessmentItem.answer, 'not_assessed'),
                ne(assessmentItem.reviewState, 'accepted'),
              )
            : filters.check === 'checked'
              ? eq(assessmentItem.reviewState, 'accepted')
              : undefined,
        ),
      )
      .orderBy(asc(department.code), asc(assessmentItem.seq))
  })
}
export type ItemRow = Awaited<ReturnType<typeof listItems>>[number]

/** One item (a question for a department) with everything needed to answer and check it. */
export const getItem = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentCode: string,
  departmentCode: string,
  questionCode: string,
) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const found = await findAssessment(tx, clientId, assessmentCode)
    const [owner] = await tx
      .select({ id: department.id, code: department.code, name: department.name })
      .from(department)
      .where(
        and(eq(department.tenantId, clientId), eq(department.code, departmentCode.toUpperCase())),
      )
    if (!owner) throw new NotFoundError(`Department ${departmentCode}`)
    const [row] = await tx
      .select({ item: assessmentItem, question })
      .from(assessmentItem)
      .innerJoin(
        question,
        and(
          eq(question.releaseId, found.releaseId),
          eq(question.code, assessmentItem.questionCode),
        ),
      )
      .where(
        and(
          eq(assessmentItem.assessmentId, found.id),
          eq(assessmentItem.departmentId, owner.id),
          eq(assessmentItem.questionCode, questionCode.toUpperCase()),
        ),
      )
    if (!row) throw new NotFoundError(`Question ${questionCode}`)
    const people = [row.item.answeredBy, row.item.reviewedBy, row.item.assigneeUserId].filter(
      (id) => id !== null,
    )
    const names = people.length
      ? await tx
          .select({ id: appUser.id, name: appUser.displayName })
          .from(appUser)
          .where(inArray(appUser.id, people))
      : []
    const nameOf = (id: string | null) => names.find((person) => person.id === id)?.name ?? null
    const siblings = await tx
      .select({ code: assessmentItem.questionCode })
      .from(assessmentItem)
      .where(
        and(eq(assessmentItem.assessmentId, found.id), eq(assessmentItem.departmentId, owner.id)),
      )
      .orderBy(asc(assessmentItem.seq))
    const index = siblings.findIndex((item) => item.code === row.item.questionCode)
    const [previous] = found.previousAssessmentId
      ? await tx
          .select({
            answer: assessmentItem.answer,
            response: assessmentItem.response,
            comment: assessmentItem.comment,
          })
          .from(assessmentItem)
          .where(
            and(
              eq(assessmentItem.assessmentId, found.previousAssessmentId),
              eq(assessmentItem.departmentId, owner.id),
              eq(assessmentItem.questionCode, row.item.questionCode),
            ),
          )
      : []
    const [group] = await tx
      .select({ code: questionnaire.code, title: questionnaire.title })
      .from(questionnaire)
      .where(
        and(
          eq(questionnaire.releaseId, found.releaseId),
          eq(questionnaire.code, row.question.questionnaireCode),
        ),
      )
    return {
      assessment: found,
      department: owner,
      gates: await readGates(tx, found.id, row.question.gates),
      questionnaire: group ?? {
        code: row.question.questionnaireCode,
        title: row.question.questionnaireCode,
      },
      item: {
        ...row.item,
        departmentName: owner.name,
        answeredByName: nameOf(row.item.answeredBy),
        reviewedByName: nameOf(row.item.reviewedBy),
        assigneeName: nameOf(row.item.assigneeUserId),
      },
      question: row.question,
      previousCycle: previous ?? null,
      previousCode: siblings[index - 1]?.code ?? null,
      nextCode: siblings[index + 1]?.code ?? null,
    }
  })
}
export type ItemDetail = Awaited<ReturnType<typeof getItem>>

// --- Answering and the self-check -------------------------------------------------------------

const answerSchema = z
  .object({
    answer: z.preprocess(blankToUndefined, z.string().max(200).optional()),
    choices: z.preprocess(toList, z.array(z.string().max(200)).max(50).optional()),
    text: z.preprocess(blankToUndefined, z.string().max(4000).optional()),
    naReason: z.preprocess(blankToUndefined, z.string().trim().max(2000).optional()),
    comment: optionalText(4000),
  })
  .refine((value) => value.answer !== 'not_applicable' || (value.naReason?.length ?? 0) >= 10, {
    path: ['naReason'],
    message: 'Say why the question does not apply (at least 10 characters).',
  })

const loadItem = async (tx: Transaction, clientId: string, itemId: string) => {
  const [row] = await tx
    .select({
      item: assessmentItem,
      status: assessment.status,
      assessmentCode: assessment.code,
      releaseId: assessment.releaseId,
      answerType: question.answerType,
      options: question.options,
      gates: question.gates,
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
    .where(and(eq(assessmentItem.id, itemId), eq(assessmentItem.tenantId, clientId)))
  if (!row) throw new NotFoundError('Question')
  return row
}

/**
 * Records an answer: the chosen option (Yes/Partial/No, a maturity level or a choice), several
 * choices, free text, or Not applicable with a reason. The option decides the scored meaning;
 * a gap raises a finding in the same transaction. Answers are locked once the cycle completes.
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
    const { item, status, assessmentCode, releaseId, answerType, options, gates } = await loadItem(
      tx,
      clientId,
      itemId,
    )
    authorize(ctx.principal, 'assessment.answer', { clientId, departmentId: item.departmentId })
    if (status === 'completed') {
      throw new RuleError('This assessment is completed; answers are locked.')
    }
    const evaluated = evaluateResponse(
      { answerType, options },
      {
        choice: input.answer,
        choices: input.choices,
        text: input.text,
        notApplicable: input.answer === 'not_applicable',
        clear: input.answer === 'not_assessed',
      },
    )
    // Self-reconciliation: an answer may not contradict the question's gates.
    const conflict = gateConflict(await readGates(tx, item.assessmentId, gates), evaluated.answer)
    if (conflict) throw new ValidationError(conflict)
    const now = new Date()
    if (status === 'draft') {
      await tx
        .update(assessment)
        .set({ status: 'in_progress', startedAt: now })
        .where(eq(assessment.id, item.assessmentId))
    }
    const answered = evaluated.answer !== 'not_assessed'
    await tx
      .update(assessmentItem)
      .set({
        answer: evaluated.answer,
        response: evaluated.response,
        naReason: evaluated.answer === 'not_applicable' ? (input.naReason ?? null) : null,
        autoNaFrom: null,
        comment: input.comment ?? null,
        answeredBy: answered ? ctx.principal.userId : null,
        answeredAt: answered ? now : null,
        reviewState: 'not_reviewed',
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
      })
      .where(eq(assessmentItem.id, itemId))
    await syncFinding(tx, ctx, {
      clientId,
      itemId,
      answer: evaluated.answer,
      comment: input.comment ?? null,
    })
    // Questions this one gates follow its new answer, in every department of the cycle.
    await reconcileQuestions(tx, ctx, {
      clientId,
      assessmentId: item.assessmentId,
      releaseId,
      codes: (await dependentsOf(tx, releaseId, item.questionCode)).map((row) => row.code),
    })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'item.answer',
      entity: 'assessment_item',
      entityId: `${assessmentCode}/${item.questionCode}`,
      detail: {
        answer: evaluated.answer,
        response: evaluated.response,
        previous: item.answer,
        departmentId: item.departmentId,
      },
    })
    return { complianceState: COMPLIANCE_OF[evaluated.answer] }
  })
}

const checkSchema = z.object({
  checked: z.preprocess(
    (value) => value === true || value === 'true' || value === 'yes' || value === 'on',
    z.boolean(),
  ),
  note: optionalText(2000),
})

/**
 * The self-check: the auditor ticks an answer once its evidence has been looked at, or takes
 * the tick away. Changing the answer clears the tick.
 */
export const checkItem = async (
  ctx: ServiceContext,
  clientId: string,
  itemId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.review', { clientId })
  const input = parseInput(checkSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const { item, status, assessmentCode } = await loadItem(tx, clientId, itemId)
    if (status === 'completed') throw new RuleError('This assessment is completed.')
    if (item.answer === 'not_assessed') {
      throw new RuleError('Answer the question before checking it.')
    }
    await tx
      .update(assessmentItem)
      .set({
        reviewState: input.checked ? 'accepted' : 'not_reviewed',
        reviewNote: input.note ?? null,
        reviewedBy: input.checked ? ctx.principal.userId : null,
        reviewedAt: input.checked ? new Date() : null,
      })
      .where(eq(assessmentItem.id, itemId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: input.checked ? 'item.check' : 'item.uncheck',
      entity: 'assessment_item',
      entityId: `${assessmentCode}/${item.questionCode}`,
      detail: { departmentId: item.departmentId },
    })
  })
}

/** Ticks every answered, unchecked item of a cycle (optionally of one department). */
export const checkAnswered = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentId: string,
  departmentId?: string,
): Promise<number> => {
  authorize(ctx.principal, 'assessment.review', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [found] = await tx
      .select({ code: assessment.code, status: assessment.status })
      .from(assessment)
      .where(and(eq(assessment.id, assessmentId), eq(assessment.tenantId, clientId)))
    if (!found) throw new NotFoundError('Assessment')
    if (found.status === 'completed') throw new RuleError('This assessment is completed.')
    const updated = await tx
      .update(assessmentItem)
      .set({ reviewState: 'accepted', reviewedBy: ctx.principal.userId, reviewedAt: new Date() })
      .where(
        and(
          eq(assessmentItem.assessmentId, assessmentId),
          departmentId ? eq(assessmentItem.departmentId, departmentId) : undefined,
          ne(assessmentItem.answer, 'not_assessed'),
          ne(assessmentItem.reviewState, 'accepted'),
        ),
      )
      .returning({ id: assessmentItem.id })
    if (updated.length) {
      await audit(tx, ctx, {
        tenantId: clientId,
        action: 'item.check_all',
        entity: 'assessment',
        entityId: found.code,
        detail: { departmentId: departmentId ?? null, items: updated.length },
      })
    }
    return updated.length
  })
}

// --- Moving the cycle on ----------------------------------------------------------------------

type Transition = { to: AssessmentStatus; capability: Capability; label: string }

/** Allowed moves of an assessment cycle. There is no separate review stage: the self-check is per answer. */
export const TRANSITIONS: Record<AssessmentStatus, Transition[]> = {
  draft: [{ to: 'in_progress', capability: 'assessment.assign', label: 'Start' }],
  in_progress: [{ to: 'completed', capability: 'assessment.review', label: 'Complete' }],
  in_review: [{ to: 'in_progress', capability: 'assessment.review', label: 'Reopen' }],
  completed: [{ to: 'in_progress', capability: 'assessment.create', label: 'Reopen' }],
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
    if (transition.to === 'completed') {
      if (progress.total === 0) throw new RuleError('This assessment has no questions yet.')
      if (progress.pending > 0) {
        throw new RuleError(`${progress.pending} questions are not answered yet.`)
      }
      const unchecked = progress.answered - progress.accepted
      if (unchecked > 0) throw new RuleError(`${unchecked} answers are not checked yet.`)
    }
    if (transition.to === 'in_progress' && found.status === 'completed') {
      const open = await openCycle(tx, clientId)
      if (open) {
        throw new RuleError(`${open.code} is open. Only one cycle can be open at a time.`)
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

/** Review states shown for the self-check. */
export const CHECK_STATES: readonly ReviewState[] = ['not_reviewed', 'accepted']
