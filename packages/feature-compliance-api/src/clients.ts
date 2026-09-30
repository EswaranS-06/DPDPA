import { authorize, can, isFirmRole } from '@duatf/core-access'
import {
  and,
  APPLICABILITY_STATES,
  asc,
  CLIENT_STATUSES,
  clientProfile,
  count,
  department,
  eq,
  legalEntity,
  ORGANISATION_TYPES,
  roleAssignment,
  sql,
  tenant,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, firmWide, inClient, inUserScope, type ServiceContext } from './context'
import {
  NotFoundError,
  optionalCount,
  optionalDate,
  optionalEmail,
  optionalText,
  optionalUrl,
  parseInput,
  requiredEmail,
  requiredText,
  ValidationError,
} from './errors'

const CLIENT_CODE = /^[A-Z][A-Z0-9]{1,9}$/

const clientCodeField = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toUpperCase() || undefined : value),
  z
    .string()
    .regex(CLIENT_CODE, 'Use 2 to 10 capital letters or digits, starting with a letter.')
    .optional(),
)

const clientFields = z.object({
  code: clientCodeField,
  name: requiredText('Organisation name'),
  legalName: requiredText('Legal name'),
  industry: requiredText('Industry', 120),
  sectorCode: optionalText(20),
  organisationType: z.enum(ORGANISATION_TYPES, { error: 'Choose the organisation type.' }),
  website: optionalUrl(),
  country: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? 'India' : value),
    z.string().trim().max(80).default('India'),
  ),
  state: optionalText(80),
  address: optionalText(500),
  employeeCount: optionalCount(),
  dataPrincipalCount: optionalCount(),
  dpoName: optionalText(120),
  dpoEmail: optionalEmail(),
  dpoPhone: optionalText(40),
  primaryContactName: requiredText('Primary contact name', 120),
  primaryContactEmail: requiredEmail('Primary contact email'),
  primaryContactPhone: optionalText(40),
  assessmentPeriodStart: optionalDate(),
  assessmentPeriodEnd: optionalDate(),
  applicability: z.enum(APPLICABILITY_STATES).default('under_review'),
  applicabilityNote: optionalText(2000),
  status: z.enum(CLIENT_STATUSES).default('onboarding'),
})

const periodInOrder = (value: { assessmentPeriodStart?: string; assessmentPeriodEnd?: string }) =>
  !value.assessmentPeriodStart ||
  !value.assessmentPeriodEnd ||
  value.assessmentPeriodEnd >= value.assessmentPeriodStart
const PERIOD_ERROR = {
  path: ['assessmentPeriodEnd'],
  message: 'The period cannot end before it starts.',
}

export const clientInputSchema = clientFields.refine(periodInOrder, PERIOD_ERROR)
const clientUpdateSchema = clientFields.omit({ code: true }).refine(periodInOrder, PERIOD_ERROR)
export type ClientInput = z.input<typeof clientInputSchema>
type ProfileInput = z.infer<typeof clientUpdateSchema>

/** A short client ID from the organisation name, e.g. "Acme Health Pvt Ltd" -> "ACME". */
export const suggestClientCode = (name: string): string => {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(
      (word) => word && !['THE', 'PVT', 'PRIVATE', 'LTD', 'LIMITED', 'LLP', 'INC'].includes(word),
    )
  const first = words[0] ?? ''
  const base =
    /^[A-Z]/.test(first) && first.length >= 3 ? first : words.map((word) => word[0]).join('')
  const code = base.replace(/[^A-Z0-9]/g, '').slice(0, 8)
  return CLIENT_CODE.test(code) ? code : `CL${code}`.slice(0, 8).padEnd(2, 'X')
}

const codeTaken = async (tx: Transaction, code: string) =>
  (await tx.select({ id: tenant.id }).from(tenant).where(eq(tenant.code, code))).length > 0

const freeCode = async (tx: Transaction, base: string) => {
  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base.slice(0, 10 - String(suffix).length)}${suffix}`
    if (!(await codeTaken(tx, candidate))) return candidate
  }
  throw new ValidationError({ code: 'Choose a client ID.' })
}

const profileValues = (input: ProfileInput) => ({
  legalName: input.legalName,
  industry: input.industry,
  sectorCode: input.sectorCode ?? null,
  organisationType: input.organisationType,
  website: input.website ?? null,
  country: input.country,
  state: input.state ?? null,
  address: input.address ?? null,
  employeeCount: input.employeeCount ?? null,
  dataPrincipalCount: input.dataPrincipalCount ?? null,
  dpoName: input.dpoName ?? null,
  dpoEmail: input.dpoEmail ?? null,
  dpoPhone: input.dpoPhone ?? null,
  primaryContactName: input.primaryContactName,
  primaryContactEmail: input.primaryContactEmail,
  primaryContactPhone: input.primaryContactPhone ?? null,
  assessmentPeriodStart: input.assessmentPeriodStart ?? null,
  assessmentPeriodEnd: input.assessmentPeriodEnd ?? null,
  applicability: input.applicability,
  applicabilityNote: input.applicabilityNote ?? null,
  status: input.status,
})

/**
 * Onboards a client: validates the profile, gives it a unique client ID and, when the creator
 * only works on specific clients, assigns them to the new one as lead auditor.
 */
export const createClient = async (
  ctx: ServiceContext,
  raw: unknown,
): Promise<{ id: string; code: string }> => {
  authorize(ctx.principal, 'client.create')
  const input = parseInput(clientInputSchema, raw)
  return firmWide(ctx, async (tx) => {
    if (input.code && (await codeTaken(tx, input.code))) {
      throw new ValidationError({ code: `Client ID ${input.code} is already used.` })
    }
    const code = input.code ?? (await freeCode(tx, suggestClientCode(input.name)))
    const [created] = await tx
      .insert(tenant)
      .values({ code, name: input.name })
      .returning({ id: tenant.id })
    const id = created?.id ?? ''
    await tx
      .insert(clientProfile)
      .values({ tenantId: id, ...profileValues(input), createdBy: ctx.principal.userId })
    await tx
      .insert(legalEntity)
      .values({ tenantId: id, code: `ORG-${code}`, legalName: input.legalName })
    const firmWideRole = ctx.principal.assignments.some(
      (assignment) => assignment.clientId === null && isFirmRole(assignment.role),
    )
    if (!firmWideRole) {
      await tx.insert(roleAssignment).values({
        userId: ctx.principal.userId,
        role: 'lead_auditor',
        tenantId: id,
        createdBy: ctx.principal.userId,
      })
    }
    await audit(tx, ctx, {
      tenantId: id,
      action: 'client.create',
      entity: 'client',
      entityId: code,
      detail: { name: input.name, status: input.status },
    })
    return { id, code }
  })
}

export const updateClient = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'client.edit', { clientId })
  const input = parseInput(clientUpdateSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const updated = await tx
      .update(tenant)
      .set({ name: input.name })
      .where(eq(tenant.id, clientId))
      .returning({ code: tenant.code })
    if (updated.length === 0) throw new NotFoundError('Client')
    await tx
      .update(clientProfile)
      .set({ ...profileValues(input), updatedAt: new Date() })
      .where(eq(clientProfile.tenantId, clientId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'client.update',
      entity: 'client',
      entityId: updated[0]?.code ?? clientId,
      detail: { status: input.status, applicability: input.applicability },
    })
  })
}

const summaryColumns = {
  id: tenant.id,
  code: tenant.code,
  name: tenant.name,
  legalName: clientProfile.legalName,
  industry: clientProfile.industry,
  status: clientProfile.status,
  applicability: clientProfile.applicability,
  assessmentPeriodStart: clientProfile.assessmentPeriodStart,
  assessmentPeriodEnd: clientProfile.assessmentPeriodEnd,
  departmentCount: sql<number>`(select count(*)::int from department d
    where d.tenant_id = "tenant"."id" and d.active)`,
}

/** The clients this user may see (row-level security decides), by name. */
export const listClients = (ctx: ServiceContext) =>
  inUserScope(ctx, (tx) =>
    tx
      .select(summaryColumns)
      .from(tenant)
      .innerJoin(clientProfile, eq(clientProfile.tenantId, tenant.id))
      .orderBy(asc(tenant.name)),
  )
export type ClientSummary = Awaited<ReturnType<typeof listClients>>[number]

/** One client by its client ID, or NotFoundError when it does not exist for this user. */
export const getClient = async (ctx: ServiceContext, code: string) => {
  const found = await inUserScope(ctx, async (tx) => {
    const [row] = await tx
      .select({ tenant, profile: clientProfile })
      .from(tenant)
      .innerJoin(clientProfile, eq(clientProfile.tenantId, tenant.id))
      .where(eq(tenant.code, code.toUpperCase()))
    if (!row) return undefined
    const [departments] = await tx
      .select({ n: count() })
      .from(department)
      .where(and(eq(department.tenantId, row.tenant.id), eq(department.active, true)))
    return { ...row.profile, ...row.tenant, departmentCount: departments?.n ?? 0 }
  })
  if (!found || !can(ctx.principal, 'client.view', { clientId: found.id })) {
    throw new NotFoundError(`Client ${code}`)
  }
  return found
}
export type ClientDetail = Awaited<ReturnType<typeof getClient>>
