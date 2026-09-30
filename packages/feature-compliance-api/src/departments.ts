import { authorize } from '@duatf/core-access'
import { sequenceScope } from '@duatf/core-utils'
import { and, asc, department, eq, tenant } from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
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

export const createDepartment = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<{ id: string }> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  const input = parseInput(departmentFields, raw)
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
      return { id: created?.id ?? '' }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError({ code: `This client already has a department ${input.code}.` })
    }
    throw error
  }
}

export const updateDepartment = async (
  ctx: ServiceContext,
  clientId: string,
  departmentId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  const input = parseInput(
    departmentFields.omit({ code: true }).extend({ active: z.boolean() }),
    raw,
  )
  await inClient(ctx, clientId, async (tx) => {
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

/** Departments of a client with their full codes, active ones first. */
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
    return rows
      .map((row) => ({ ...row, fullCode: departmentCode(client.code, row.code) }))
      .sort((a, b) => Number(b.active) - Number(a.active))
  })
}
export type DepartmentRow = Awaited<ReturnType<typeof listDepartments>>[number]
