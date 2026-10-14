import { authorize, can } from '@duatf/core-access'
import { addCalendarDays, daysBetween, isoDate } from '@duatf/core-utils'
import {
  and,
  clientProfile,
  department,
  desc,
  eq,
  rightsRequest,
  RIGHTS_KINDS,
  type RightsKind,
  type RightsStatus,
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
import { blankToUndefined, nextRegisterCode, ticked } from './registerCodes'

// The rights and grievance register (ADR-0009): requests from Data Principals under ss.11 to 14
// and withdrawals of consent under s.6(4). A grievance is answered within the period the client
// publishes, which is at most 90 days (R14(3)). The requester is recorded by the client's own
// reference, not by identity.

export const RIGHTS_KIND_INFO: Record<RightsKind, { label: string; basis: string }> = {
  access: { label: 'Access to information about personal data', basis: 's.11' },
  correction: { label: 'Correction, completion or updating', basis: 's.12(1), (2)' },
  erasure: { label: 'Erasure', basis: 's.12(3)' },
  grievance: { label: 'Grievance', basis: 's.13, R14(3)' },
  nomination: { label: 'Nomination', basis: 's.14' },
  withdrawal: { label: 'Withdrawal of consent', basis: 's.6(4)' },
}

export const RIGHTS_STATUS_LABEL: Record<RightsStatus, string> = {
  received: 'Received',
  in_progress: 'In progress',
  fulfilled: 'Fulfilled',
  refused: 'Refused',
  withdrawn: 'Withdrawn by the requester',
}

/** The longest period a grievance may take (R14(3)). */
export const GRIEVANCE_MAX_DAYS = 90
/** Used until the client's published period is recorded. */
export const DEFAULT_RESPONSE_DAYS = 90

const OPEN: readonly RightsStatus[] = ['received', 'in_progress']
export const isOpenRequest = (status: RightsStatus): boolean => OPEN.includes(status)

/** Moves a request can make; a closed request stays closed. */
export const RIGHTS_FLOW: Record<RightsStatus, RightsStatus[]> = {
  received: ['in_progress', 'fulfilled', 'refused', 'withdrawn'],
  in_progress: ['fulfilled', 'refused', 'withdrawn'],
  fulfilled: [],
  refused: [],
  withdrawn: [],
}

/** The date a request is due: the client's period from the day it came in, a grievance within 90 days. */
export const dueDateFor = (kind: RightsKind, receivedOn: string, responseDays: number): string =>
  addCalendarDays(
    receivedOn,
    kind === 'grievance' ? Math.min(responseDays, GRIEVANCE_MAX_DAYS) : responseDays,
  )

const responseDaysOf = async (tx: Transaction, clientId: string): Promise<number> => {
  const [profile] = await tx
    .select({ days: clientProfile.rightsResponseDays })
    .from(clientProfile)
    .where(eq(clientProfile.tenantId, clientId))
  return profile?.days ?? DEFAULT_RESPONSE_DAYS
}

const requestSchema = z.object({
  kind: z.enum(RIGHTS_KINDS, { error: 'Choose the kind of request.' }),
  receivedOn: z.iso.date({ error: 'Say when it was received.' }),
  dueOn: optionalDate(),
  channel: optionalText(120),
  requesterRef: requiredText('Requester reference', 120),
  principalType: optionalText(120),
  details: optionalText(4000),
  identityVerified: z.preprocess(ticked, z.boolean()),
  departmentId: z.preprocess(blankToUndefined, z.uuid().optional()),
  handler: optionalText(160),
})

type RequestInput = z.infer<typeof requestSchema>

const checkRequest = async (
  tx: Transaction,
  clientId: string,
  input: RequestInput,
): Promise<string> => {
  const today = isoDate(new Date())
  const errors: Record<string, string> = {}
  if (input.receivedOn > today) errors.receivedOn = 'This date is in the future.'
  const dueOn =
    input.dueOn ?? dueDateFor(input.kind, input.receivedOn, await responseDaysOf(tx, clientId))
  if (dueOn < input.receivedOn) errors.dueOn = 'The due date cannot be before it was received.'
  if (input.kind === 'grievance' && dueOn > addCalendarDays(input.receivedOn, GRIEVANCE_MAX_DAYS)) {
    errors.dueOn = `A grievance is answered within ${GRIEVANCE_MAX_DAYS} days of receipt (R14(3)).`
  }
  if (input.departmentId) {
    const [found] = await tx
      .select({ id: department.id })
      .from(department)
      .where(and(eq(department.id, input.departmentId), eq(department.tenantId, clientId)))
    if (!found) errors.departmentId = 'Choose a department of this client.'
  }
  if (Object.keys(errors).length) throw new ValidationError(errors)
  return dueOn
}

const valuesOf = (input: RequestInput, dueOn: string) => ({
  kind: input.kind,
  receivedOn: input.receivedOn,
  dueOn,
  channel: input.channel ?? null,
  requesterRef: input.requesterRef,
  principalType: input.principalType ?? null,
  details: input.details ?? null,
  identityVerified: input.identityVerified,
  departmentId: input.departmentId ?? null,
  handler: input.handler ?? null,
})

export const recordRightsRequest = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<{ id: string; code: string; dueOn: string }> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(requestSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const dueOn = await checkRequest(tx, clientId, input)
    const code = await nextRegisterCode(tx, clientId, 'DPR')
    const [created] = await tx
      .insert(rightsRequest)
      .values({
        ...valuesOf(input, dueOn),
        tenantId: clientId,
        code,
        createdBy: ctx.principal.userId,
      })
      .returning({ id: rightsRequest.id })
    if (!created) throw new Error('The request could not be saved.')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'rights.record',
      entity: 'rights_request',
      entityId: code,
      detail: { kind: input.kind, dueOn },
    })
    return { id: created.id, code, dueOn }
  })
}

const loadRequest = async (tx: Transaction, clientId: string, requestId: string) => {
  const [row] = await tx
    .select()
    .from(rightsRequest)
    .where(and(eq(rightsRequest.id, requestId), eq(rightsRequest.tenantId, clientId)))
  if (!row) throw new NotFoundError('Request')
  return row
}

export const updateRightsRequest = async (
  ctx: ServiceContext,
  clientId: string,
  requestId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(requestSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const current = await loadRequest(tx, clientId, requestId)
    if (!isOpenRequest(current.status)) {
      throw new RuleError(`${current.code} is closed and cannot be changed.`)
    }
    const dueOn = await checkRequest(tx, clientId, input)
    await tx
      .update(rightsRequest)
      .set({ ...valuesOf(input, dueOn), updatedAt: new Date() })
      .where(eq(rightsRequest.id, requestId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'rights.update',
      entity: 'rights_request',
      entityId: current.code,
      detail: { dueOn },
    })
  })
}

const moveSchema = z
  .object({
    to: z.enum(['in_progress', 'fulfilled', 'refused', 'withdrawn'], {
      error: 'Choose what happened.',
    }),
    outcome: optionalText(4000),
    closedOn: optionalDate(),
  })
  .refine((value) => value.to !== 'refused' || (value.outcome?.length ?? 0) >= 10, {
    path: ['outcome'],
    message: 'Say why the request is refused (at least 10 characters).',
  })

/** Moves a request on: work started, fulfilled, refused with its reason, or withdrawn. */
export const moveRightsRequest = async (
  ctx: ServiceContext,
  clientId: string,
  requestId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(moveSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const current = await loadRequest(tx, clientId, requestId)
    if (!RIGHTS_FLOW[current.status].includes(input.to)) {
      throw new RuleError(
        isOpenRequest(current.status)
          ? `${current.code} is already ${RIGHTS_STATUS_LABEL[current.status].toLowerCase()}.`
          : `${current.code} is closed and stays closed.`,
      )
    }
    const today = isoDate(new Date())
    const closing = input.to !== 'in_progress'
    const closedOn = closing ? (input.closedOn ?? today) : null
    if (closedOn && (closedOn > today || closedOn < current.receivedOn)) {
      throw new ValidationError({
        closedOn: 'The closing date is between the day it was received and today.',
      })
    }
    await tx
      .update(rightsRequest)
      .set({
        status: input.to,
        outcome: input.outcome ?? current.outcome,
        closedOn,
        updatedAt: new Date(),
      })
      .where(eq(rightsRequest.id, requestId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: `rights.${input.to}`,
      entity: 'rights_request',
      entityId: current.code,
      detail: { from: current.status, closedOn },
    })
  })
}

const settingSchema = z.object({
  responseDays: z.coerce
    .number({ error: 'Enter the number of days.' })
    .int('Enter whole days.')
    .min(1, 'At least one day.')
    .max(GRIEVANCE_MAX_DAYS, `At most ${GRIEVANCE_MAX_DAYS} days (R14(3)).`),
})

/** Records the response period the client publishes; new requests take their due date from it. */
export const setRightsResponseDays = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(settingSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    await tx
      .update(clientProfile)
      .set({ rightsResponseDays: input.responseDays })
      .where(eq(clientProfile.tenantId, clientId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'rights.response_days',
      entity: 'client',
      entityId: clientId,
      detail: { days: input.responseDays },
    })
  })
}

export type RightsFilters = { status?: RightsStatus; kind?: RightsKind; open?: boolean }

/** The register, most urgent first: open requests by due date, then closed ones, newest first. */
export const listRightsRequests = async (
  ctx: ServiceContext,
  clientId: string,
  filters: RightsFilters = {},
) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const today = isoDate(new Date())
  return inClient(ctx, clientId, async (tx) => {
    const rows = await tx
      .select({ request: rightsRequest, departmentName: department.name })
      .from(rightsRequest)
      .leftJoin(department, eq(department.id, rightsRequest.departmentId))
      .where(eq(rightsRequest.tenantId, clientId))
      .orderBy(desc(rightsRequest.receivedOn), desc(rightsRequest.code))
    const all = rows.map((row) => {
      const open = isOpenRequest(row.request.status)
      return {
        ...row.request,
        departmentName: row.departmentName,
        open,
        overdue: open && row.request.dueOn < today,
        daysLeft: open ? daysBetween(today, row.request.dueOn) : null,
        daysTaken: row.request.closedOn
          ? daysBetween(row.request.receivedOn, row.request.closedOn)
          : null,
      }
    })
    const requests = all
      .filter(
        (row) =>
          (!filters.status || row.status === filters.status) &&
          (!filters.kind || row.kind === filters.kind) &&
          (filters.open === undefined || row.open === filters.open),
      )
      .sort(
        (a, b) =>
          Number(b.open) - Number(a.open) ||
          (a.open ? a.dueOn.localeCompare(b.dueOn) : b.receivedOn.localeCompare(a.receivedOn)),
      )
    return {
      requests,
      responseDays: await responseDaysOf(tx, clientId),
      counts: {
        open: all.filter((row) => row.open).length,
        overdue: all.filter((row) => row.overdue).length,
        closed: all.filter((row) => !row.open).length,
      },
      canEdit: can(ctx.principal, 'incident.manage', { clientId }),
    }
  })
}
export type RightsList = Awaited<ReturnType<typeof listRightsRequests>>
export type RightsRow = RightsList['requests'][number]

export const getRightsRequest = async (ctx: ServiceContext, clientId: string, code: string) => {
  const list = await listRightsRequests(ctx, clientId)
  const found = list.requests.find((row) => row.code === code.toUpperCase())
  if (!found) throw new NotFoundError(`Request ${code}`)
  return {
    ...found,
    canEdit: list.canEdit,
    moves: RIGHTS_FLOW[found.status],
    responseDays: list.responseDays,
  }
}
export type RightsDetail = Awaited<ReturnType<typeof getRightsRequest>>
