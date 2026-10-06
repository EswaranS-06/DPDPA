import { authorize } from '@duatf/core-access'
import { sequenceScope } from '@duatf/core-utils'
import {
  and,
  asc,
  assessment,
  assessmentItem,
  count,
  department,
  eq,
  ne,
  tenant,
} from '@duatf/platform-db'
import { z } from 'zod'
import { applyDepartmentQuestions, parseQuestionList, type QuestionChange } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import { applyDepartmentData } from './dataMapping'
import {
  isUniqueViolation,
  NotFoundError,
  optionalEmail,
  optionalText,
  parseInput,
  requiredText,
  ValidationError,
} from './errors'

const departmentFields = z.object({
  code: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
    z
      .string({ error: 'Department code is required.' })
      .regex(/^[A-Z][A-Z0-9]{1,9}$/, 'Use 2 to 10 capital letters or digits, e.g. HR or FIN.'),
  ),
  name: requiredText('Department name', 120),
  headName: optionalText(120),
  headEmail: optionalEmail(),
  description: optionalText(1000),
})
export type DepartmentInput = z.input<typeof departmentFields>

/** DEP-ACME-HR for department HR of client ACME. */
export const departmentCode = (clientCode: string, code: string): string =>
  sequenceScope('DEP', clientCode, code)

/** True when the form sent a question list (an empty list clears the questions). */
const sentQuestions = (raw: unknown) =>
  typeof raw === 'object' && raw !== null && 'questions' in raw

/** The personal data the add-department form chose, if it sent any. */
const sentPersonalData = (raw: unknown): unknown[] | null =>
  typeof raw === 'object' &&
  raw !== null &&
  'personalData' in raw &&
  Array.isArray(raw.personalData)
    ? raw.personalData
    : null

/**
 * Creates a department and gives it the chosen questions: they become its items in the open
 * assessment cycle (the client's first cycle is opened when there is none). The personal data
 * it handles, when sent, becomes its data inventory.
 */
export const createDepartment = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<{ id: string; questions: QuestionChange }> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  const input = parseInput(departmentFields, raw)
  const codes = sentQuestions(raw) ? parseQuestionList(raw) : []
  const personalData = sentPersonalData(raw)
  try {
    return await inClient(ctx, clientId, async (tx) => {
      const [created] = await tx
        .insert(department)
        .values({
          tenantId: clientId,
          code: input.code,
          name: input.name,
          headName: input.headName ?? null,
          headEmail: input.headEmail ?? null,
          description: input.description ?? null,
        })
        .returning({ id: department.id })
      await audit(tx, ctx, {
        tenantId: clientId,
        action: 'department.create',
        entity: 'department',
        entityId: input.code,
        detail: { name: input.name },
      })
      const id = created?.id ?? ''
      const questions = await applyDepartmentQuestions(tx, ctx, clientId, id, codes)
      if (personalData?.length) {
        await applyDepartmentData(
          tx,
          ctx,
          clientId,
          { id, code: input.code },
          { elements: personalData },
        )
      }
      return { id, questions }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError({ code: `This client already has a department ${input.code}.` })
    }
    throw error
  }
}

/** Updates a department; when the form sends a question list, its questions too. */
export const updateDepartment = async (
  ctx: ServiceContext,
  clientId: string,
  departmentId: string,
  raw: unknown,
): Promise<QuestionChange | null> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  const input = parseInput(
    departmentFields.omit({ code: true }).extend({ active: z.boolean() }),
    raw,
  )
  const codes = sentQuestions(raw) ? parseQuestionList(raw) : null
  return inClient(ctx, clientId, async (tx) => {
    const updated = await tx
      .update(department)
      .set({
        name: input.name,
        headName: input.headName ?? null,
        headEmail: input.headEmail ?? null,
        description: input.description ?? null,
        active: input.active,
      })
      .where(and(eq(department.id, departmentId), eq(department.tenantId, clientId)))
      .returning({ code: department.code })
    if (updated.length === 0) throw new NotFoundError('Department')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'department.update',
      entity: 'department',
      entityId: updated[0]?.code ?? departmentId,
      detail: { active: input.active },
    })
    return codes === null
      ? null
      : applyDepartmentQuestions(tx, ctx, clientId, departmentId, input.active ? codes : [])
  })
}

/** Switches a department on or off; inactive departments get no new assessment items. */
export const setDepartmentActive = async (
  ctx: ServiceContext,
  clientId: string,
  departmentId: string,
  active: boolean,
): Promise<void> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const updated = await tx
      .update(department)
      .set({ active })
      .where(and(eq(department.id, departmentId), eq(department.tenantId, clientId)))
      .returning({ code: department.code })
    if (updated.length === 0) throw new NotFoundError('Department')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: active ? 'department.activate' : 'department.deactivate',
      entity: 'department',
      entityId: updated[0]?.code ?? departmentId,
    })
  })
}

/** Departments of a client with their full codes and question counts in the open cycle. */
export const listDepartments = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [client] = await tx
      .select({ code: tenant.code })
      .from(tenant)
      .where(eq(tenant.id, clientId))
    if (!client) throw new NotFoundError('Client')
    const rows = await tx
      .select()
      .from(department)
      .where(eq(department.tenantId, clientId))
      .orderBy(asc(department.code))
    const counts = await tx
      .select({
        departmentId: assessmentItem.departmentId,
        answer: assessmentItem.answer,
        n: count(),
      })
      .from(assessmentItem)
      .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
      .where(and(eq(assessment.tenantId, clientId), ne(assessment.status, 'completed')))
      .groupBy(assessmentItem.departmentId, assessmentItem.answer)
    const tally = (departmentId: string, answered: boolean) =>
      counts
        .filter(
          (row) =>
            row.departmentId === departmentId && (row.answer !== 'not_assessed') === answered,
        )
        .reduce((sum, row) => sum + row.n, 0)
    return rows
      .map((row) => {
        const answered = tally(row.id, true)
        return {
          ...row,
          fullCode: departmentCode(client.code, row.code),
          questionCount: answered + tally(row.id, false),
          answeredCount: answered,
        }
      })
      .sort((a, b) => Number(b.active) - Number(a.active))
  })
}
export type DepartmentRow = Awaited<ReturnType<typeof listDepartments>>[number]
