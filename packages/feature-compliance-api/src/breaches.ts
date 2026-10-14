import { authorize, can } from '@duatf/core-access'
import { addHours, formatIst } from '@duatf/core-utils'
import {
  and,
  appUser,
  asc,
  breach,
  breachEvent,
  BREACH_SEVERITIES,
  clientProfile,
  department,
  desc,
  eq,
  inArray,
  processingActivity,
  processor,
  tenant,
  type BreachStatus,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
import {
  NotFoundError,
  optionalCount,
  optionalText,
  parseInput,
  requiredText,
  RuleError,
  ValidationError,
} from './errors'
import { blankToUndefined, nextRegisterCode, ticked, toList } from './registerCodes'
import { refLabel } from './ropa'

// The breach register (ADR-0009). Every personal data breach is intimated to the Board and to
// each affected Data Principal (s.8(6)); there is no risk threshold. The clocks run from the time
// the organisation became aware: the detailed report to the Board within 72 hours, or the longer
// period the Board allows on a written request (R7(2)(b)), and the CERT-In report within 6 hours
// when the breach is a cyber incident (CERT-In Directions of 28 April 2022).

/** The words of s.2(u): what happened to the personal data. */
export const BREACH_NATURES = [
  { code: 'unauthorised_processing', label: 'Unauthorised processing' },
  { code: 'accidental_disclosure', label: 'Accidental disclosure' },
  { code: 'acquisition', label: 'Unauthorised acquisition' },
  { code: 'sharing', label: 'Unauthorised sharing' },
  { code: 'use', label: 'Unauthorised use' },
  { code: 'alteration', label: 'Alteration' },
  { code: 'destruction', label: 'Destruction' },
  { code: 'loss_of_access', label: 'Loss of access' },
] as const
const NATURE_CODES: readonly string[] = BREACH_NATURES.map((nature) => nature.code)

export const BOARD_REPORT_HOURS = 72
export const CERT_IN_HOURS = 6

export type ClockState = 'done' | 'done_late' | 'running' | 'overdue' | 'not_needed'

export type BreachClock = {
  key: 'board_first' | 'board_detailed' | 'principals' | 'cert_in'
  label: string
  /** The provision the clock comes from. */
  basis: string
  /** Null where the law says "without delay" and sets no hour. */
  deadline: Date | null
  doneAt: Date | null
  state: ClockState
  /** Hours left until the deadline (negative once past), for a running or overdue clock. */
  hoursLeft: number | null
  /** Hours from awareness to the intimation, or to now while it is still to be made. */
  hoursTaken: number
}

type ClockInput = {
  awareAt: Date
  cyberIncident: boolean
  boardFirstAt: Date | null
  boardDetailedAt: Date | null
  boardExtendedTo: Date | null
  principalsAt: Date | null
  certInAt: Date | null
}

const hoursBetween = (from: Date, to: Date) =>
  Math.round(((to.getTime() - from.getTime()) / 3_600_000) * 10) / 10

/** The four intimations of a breach and where each stands at a moment. */
export const breachClocks = (row: ClockInput, now: Date): BreachClock[] => {
  const clock = (
    key: BreachClock['key'],
    label: string,
    basis: string,
    deadline: Date | null,
    doneAt: Date | null,
    needed = true,
  ): BreachClock => {
    const state: ClockState = !needed
      ? 'not_needed'
      : doneAt
        ? deadline && doneAt > deadline
          ? 'done_late'
          : 'done'
        : deadline && now > deadline
          ? 'overdue'
          : 'running'
    return {
      key,
      label,
      basis,
      deadline: needed ? deadline : null,
      doneAt,
      state,
      hoursLeft: needed && !doneAt && deadline ? hoursBetween(now, deadline) : null,
      hoursTaken: hoursBetween(row.awareAt, doneAt ?? now),
    }
  }
  return [
    clock(
      'board_first',
      'First intimation to the Board',
      'R7(2)(a): without delay',
      null,
      row.boardFirstAt,
    ),
    clock(
      'principals',
      'Intimation to each affected Data Principal',
      'R7(1): without delay',
      null,
      row.principalsAt,
    ),
    clock(
      'board_detailed',
      'Detailed report to the Board',
      row.boardExtendedTo
        ? 'R7(2)(b): the longer period the Board allowed'
        : `R7(2)(b): within ${BOARD_REPORT_HOURS} hours of becoming aware`,
      row.boardExtendedTo ?? addHours(row.awareAt, BOARD_REPORT_HOURS),
      row.boardDetailedAt,
    ),
    clock(
      'cert_in',
      'Report to CERT-In',
      `CERT-In Directions 2022: within ${CERT_IN_HOURS} hours of noticing a cyber incident`,
      addHours(row.awareAt, CERT_IN_HOURS),
      row.certInAt,
      row.cyberIncident,
    ),
  ]
}

/** The deadline that needs attention first: the earliest one not yet met. */
export const nextDeadline = (clocks: readonly BreachClock[]): Date | null =>
  clocks
    .filter((clock) => (clock.state === 'running' || clock.state === 'overdue') && clock.deadline)
    .map((clock) => clock.deadline as Date)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null

export type NoticeDraft = {
  key: 'principals' | 'board_first' | 'board_detailed'
  title: string
  basis: string
  /** Each item the Rule lists, in its order, with what the record holds for it. */
  items: { rule: string; heading: string; text: string | null }[]
}

type NoticeInput = {
  code: string
  title: string
  description: string
  awareAt: Date
  occurredAt: Date | null
  place: string | null
  natures: string[]
  affectedPrincipals: number | null
  dataAffected: string | null
  likelyImpact: string | null
  measures: string | null
  safetySteps: string | null
  contact: string | null
  cause: string | null
  personResponsible: string | null
  remedial: string | null
  principalsAt: Date | null
  principalsHow: string | null
}

const natureText = (natures: readonly string[]) =>
  BREACH_NATURES.filter((nature) => natures.includes(nature.code))
    .map((nature) => nature.label.toLowerCase())
    .join(', ')

/**
 * Draft notices with every item Rule 7 lists, filled from the record. An item the record does
 * not hold yet has no text, so the page and the document can say what is still missing.
 */
export const breachNotices = (row: NoticeInput, organisation: string): NoticeDraft[] => {
  const nature = [
    row.description,
    row.natures.length ? `Nature: ${natureText(row.natures)}.` : null,
    row.dataAffected ? `Personal data affected: ${row.dataAffected}.` : null,
  ]
    .filter(Boolean)
    .join(' ')
  const extent =
    row.affectedPrincipals === null
      ? null
      : `About ${row.affectedPrincipals.toLocaleString('en-IN')} Data Principals are affected.`
  const timing = [
    row.occurredAt ? `It occurred on ${formatIst(row.occurredAt)}` : null,
    `${organisation} became aware of it on ${formatIst(row.awareAt)}`,
  ]
    .filter(Boolean)
    .join('; ')
  const description = [nature, extent, `${timing}.`, row.place ? `Location: ${row.place}.` : null]
    .filter(Boolean)
    .join(' ')
  return [
    {
      key: 'principals',
      title: 'Intimation to each affected Data Principal',
      basis:
        's.8(6) and R7(1): concise, clear and plain, without delay, through the user account or a registered mode of communication',
      items: [
        {
          rule: 'R7(1)(a)',
          heading: 'What happened: its nature, extent, timing and location',
          text: description,
        },
        {
          rule: 'R7(1)(b)',
          heading: 'What it may mean for you',
          text: row.likelyImpact,
        },
        {
          rule: 'R7(1)(c)',
          heading: 'What we have done and are doing to reduce the risk',
          text: row.measures,
        },
        {
          rule: 'R7(1)(d)',
          heading: 'What you can do to protect yourself',
          text: row.safetySteps,
        },
        {
          rule: 'R7(1)(e)',
          heading: 'Whom to contact',
          text: row.contact,
        },
      ],
    },
    {
      key: 'board_first',
      title: 'First intimation to the Data Protection Board',
      basis: 's.8(6) and R7(2)(a): without delay',
      items: [
        {
          rule: 'R7(2)(a)',
          heading: 'Description of the breach: nature, extent, timing and location',
          text: description,
        },
        { rule: 'R7(2)(a)', heading: 'Likely impact', text: row.likelyImpact },
      ],
    },
    {
      key: 'board_detailed',
      title: 'Detailed report to the Data Protection Board',
      basis: `s.8(6) and R7(2)(b): within ${BOARD_REPORT_HOURS} hours of becoming aware, or the longer period the Board allows on a written request`,
      items: [
        {
          rule: 'R7(2)(b)(i)',
          heading: 'Updated and detailed description',
          text: description,
        },
        {
          rule: 'R7(2)(b)(ii)',
          heading: 'Broad facts: the events, circumstances and reasons leading to the breach',
          text: row.cause,
        },
        {
          rule: 'R7(2)(b)(iii)',
          heading: 'Measures implemented or proposed to mitigate risk',
          text: row.measures,
        },
        {
          rule: 'R7(2)(b)(iv)',
          heading: 'Findings regarding the person who caused the breach',
          text: row.personResponsible,
        },
        {
          rule: 'R7(2)(b)(v)',
          heading: 'Remedial measures taken to prevent recurrence',
          text: row.remedial,
        },
        {
          rule: 'R7(2)(b)(vi)',
          heading: 'Report on the intimations given to affected Data Principals',
          text: row.principalsAt
            ? `Affected Data Principals were intimated on ${formatIst(row.principalsAt)}${row.principalsHow ? `, by ${row.principalsHow}` : ''}.`
            : null,
        },
      ],
    },
  ]
}

const LOCAL_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/

/**
 * Reads "YYYY-MM-DDTHH:mm" as India Standard Time; an ISO instant with a zone is taken as is.
 * Null when the text is not a date and time.
 */
export const toInstant = (value: string): Date | null => {
  const local = LOCAL_TIME.exec(value.trim())
  const parsed = new Date(local ? `${local[1]}T${local[2]}:00+05:30` : value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const instantText = (message: string) =>
  z.string({ error: message }).transform((value, issues) => {
    const parsed = toInstant(value)
    if (!parsed) {
      issues.addIssue({ code: 'custom', message: 'Enter a date and time.' })
      return z.NEVER
    }
    return parsed
  })

/** A date and time typed in a form as local Indian time ("2026-10-13T09:30"). */
const requiredInstant = (label: string) =>
  z.preprocess(blankToUndefined, instantText(`${label} is required.`))
const optionalInstant = () =>
  z.preprocess(blankToUndefined, instantText('Enter a date and time.').optional())

/** An instant as the value of a datetime-local field, in India Standard Time. */
export const toLocalInput = (value: Date | null): string =>
  value ? new Date(value.getTime() + 330 * 60_000).toISOString().slice(0, 16) : ''

const recordSchema = z.object({
  title: requiredText('Title', 200),
  description: requiredText('What happened', 4000),
  awareAt: requiredInstant('When the organisation became aware'),
  occurredAt: optionalInstant(),
  place: optionalText(300),
  natures: z.preprocess(toList, z.array(z.string()).max(NATURE_CODES.length)),
  severity: z.enum(BREACH_SEVERITIES, { error: 'Choose a severity.' }),
  cyberIncident: z.preprocess(ticked, z.boolean()),
  affectedPrincipals: optionalCount(),
  dataAffected: optionalText(2000),
  likelyImpact: optionalText(4000),
  measures: optionalText(4000),
  safetySteps: optionalText(4000),
  contact: optionalText(500),
  cause: optionalText(4000),
  personResponsible: optionalText(2000),
  remedial: optionalText(4000),
  processorId: z.preprocess(blankToUndefined, z.uuid().optional()),
  departmentId: z.preprocess(blankToUndefined, z.uuid().optional()),
  activityRefs: z.preprocess(
    (value) => toList(value).map((ref) => Number(ref.replace(/^PA-/i, ''))),
    z.array(z.number().int().positive()).max(200),
  ),
})

type RecordInput = z.infer<typeof recordSchema>

const checkRecord = async (tx: Transaction, clientId: string, input: RecordInput) => {
  const now = new Date()
  const errors: Record<string, string> = {}
  if (input.awareAt > now) errors.awareAt = 'This time is in the future.'
  if (input.occurredAt && input.occurredAt > input.awareAt) {
    errors.occurredAt = 'A breach cannot occur after the organisation became aware of it.'
  }
  if (input.natures.some((nature) => !NATURE_CODES.includes(nature))) {
    errors.natures = 'Choose from the list.'
  }
  if (input.processorId) {
    const [found] = await tx
      .select({ id: processor.id })
      .from(processor)
      .where(and(eq(processor.id, input.processorId), eq(processor.tenantId, clientId)))
    if (!found) errors.processorId = 'Choose a processor of this client.'
  }
  if (input.departmentId) {
    const [found] = await tx
      .select({ id: department.id })
      .from(department)
      .where(and(eq(department.id, input.departmentId), eq(department.tenantId, clientId)))
    if (!found) errors.departmentId = 'Choose a department of this client.'
  }
  if (input.activityRefs.length) {
    const known = await tx
      .select({ ref: processingActivity.ref })
      .from(processingActivity)
      .where(
        and(
          eq(processingActivity.tenantId, clientId),
          inArray(processingActivity.ref, input.activityRefs),
        ),
      )
    if (known.length !== new Set(input.activityRefs).size) {
      errors.activityRefs = 'Choose activities from this client’s RoPA.'
    }
  }
  if (Object.keys(errors).length) throw new ValidationError(errors)
}

const valuesOf = (input: RecordInput) => ({
  title: input.title,
  description: input.description,
  awareAt: input.awareAt,
  occurredAt: input.occurredAt ?? null,
  place: input.place ?? null,
  natures: input.natures,
  severity: input.severity,
  cyberIncident: input.cyberIncident,
  affectedPrincipals: input.affectedPrincipals ?? null,
  dataAffected: input.dataAffected ?? null,
  likelyImpact: input.likelyImpact ?? null,
  measures: input.measures ?? null,
  safetySteps: input.safetySteps ?? null,
  contact: input.contact ?? null,
  cause: input.cause ?? null,
  personResponsible: input.personResponsible ?? null,
  remedial: input.remedial ?? null,
  processorId: input.processorId ?? null,
  departmentId: input.departmentId ?? null,
  activityRefs: [...new Set(input.activityRefs)].sort((a, b) => a - b),
})

const event = (
  tx: Transaction,
  ctx: ServiceContext,
  input: {
    clientId: string
    breachId: string
    kind: string
    happenedAt?: Date | null
    note?: string | null
  },
) =>
  tx.insert(breachEvent).values({
    tenantId: input.clientId,
    breachId: input.breachId,
    actorUserId: ctx.principal.userId,
    kind: input.kind,
    happenedAt: input.happenedAt ?? null,
    note: input.note ?? null,
  })

/** The contact a notice gives when the record has none: the client's DPO, else its main contact. */
const defaultContact = async (tx: Transaction, clientId: string): Promise<string | null> => {
  const [profile] = await tx
    .select({
      dpoName: clientProfile.dpoName,
      dpoEmail: clientProfile.dpoEmail,
      dpoPhone: clientProfile.dpoPhone,
      name: clientProfile.primaryContactName,
      email: clientProfile.primaryContactEmail,
      phone: clientProfile.primaryContactPhone,
    })
    .from(clientProfile)
    .where(eq(clientProfile.tenantId, clientId))
  if (!profile) return null
  const parts = profile.dpoName
    ? [profile.dpoName, profile.dpoEmail, profile.dpoPhone]
    : [profile.name, profile.email, profile.phone]
  return parts.filter(Boolean).join(', ') || null
}

export const recordBreach = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<{ id: string; code: string }> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(recordSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    await checkRecord(tx, clientId, input)
    const code = await nextRegisterCode(tx, clientId, 'BRE')
    const values = valuesOf(input)
    const [created] = await tx
      .insert(breach)
      .values({
        ...values,
        contact: values.contact ?? (await defaultContact(tx, clientId)),
        tenantId: clientId,
        code,
        createdBy: ctx.principal.userId,
      })
      .returning({ id: breach.id })
    if (!created) throw new Error('The breach could not be saved.')
    await event(tx, ctx, {
      clientId,
      breachId: created.id,
      kind: 'recorded',
      happenedAt: input.awareAt,
      note: 'The organisation became aware of the breach.',
    })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'breach.record',
      entity: 'breach',
      entityId: code,
      detail: { awareAt: input.awareAt.toISOString(), cyberIncident: input.cyberIncident },
    })
    return { id: created.id, code }
  })
}

const loadBreach = async (tx: Transaction, clientId: string, breachId: string) => {
  const [row] = await tx
    .select()
    .from(breach)
    .where(and(eq(breach.id, breachId), eq(breach.tenantId, clientId)))
  if (!row) throw new NotFoundError('Breach')
  return row
}

const assertOpen = (row: { code: string; status: BreachStatus }) => {
  if (row.status === 'closed') throw new RuleError(`${row.code} is closed. Reopen it to change it.`)
}

export const updateBreach = async (
  ctx: ServiceContext,
  clientId: string,
  breachId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(recordSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const current = await loadBreach(tx, clientId, breachId)
    assertOpen(current)
    await checkRecord(tx, clientId, input)
    await tx
      .update(breach)
      .set({ ...valuesOf(input), updatedAt: new Date() })
      .where(eq(breach.id, breachId))
    await event(tx, ctx, { clientId, breachId, kind: 'updated' })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'breach.update',
      entity: 'breach',
      entityId: current.code,
    })
  })
}

/** The steps recorded against a breach, each with the time it took place. */
export const BREACH_STEPS = {
  board_first: 'First intimation to the Board',
  board_detailed: 'Detailed report to the Board',
  principals: 'Affected Data Principals intimated',
  cert_in: 'Reported to CERT-In',
  extension: 'Longer period allowed by the Board',
  contained: 'Contained',
  note: 'Note',
} as const
export type BreachStep = keyof typeof BREACH_STEPS

const stepSchema = z
  .object({
    step: z.enum(Object.keys(BREACH_STEPS) as [BreachStep, ...BreachStep[]], {
      error: 'Choose what to record.',
    }),
    at: optionalInstant(),
    note: optionalText(2000),
    reference: optionalText(200),
  })
  .superRefine((value, issues) => {
    if (value.step !== 'note' && !value.at) {
      issues.addIssue({ code: 'custom', path: ['at'], message: 'Say when.' })
    }
    if (value.step === 'note' && !value.note) {
      issues.addIssue({ code: 'custom', path: ['note'], message: 'Write the note.' })
    }
  })

/** Records an intimation, the Board's longer period, containment or a note, on the timeline. */
export const recordBreachStep = async (
  ctx: ServiceContext,
  clientId: string,
  breachId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(stepSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const current = await loadBreach(tx, clientId, breachId)
    assertOpen(current)
    const at = input.at ?? null
    const now = new Date()
    if (at && input.step !== 'extension') {
      if (at > now) throw new ValidationError({ at: 'This time is in the future.' })
      if (at < current.awareAt) {
        throw new ValidationError({ at: 'This is before the organisation became aware.' })
      }
    }
    if (input.step === 'extension' && at && at <= addHours(current.awareAt, BOARD_REPORT_HOURS)) {
      throw new ValidationError({
        at: `A longer period ends after the ${BOARD_REPORT_HOURS} hours the Rules give.`,
      })
    }
    if (input.step === 'cert_in' && !current.cyberIncident) {
      throw new RuleError('This breach is not marked as a cyber incident.')
    }
    const change =
      input.step === 'board_first'
        ? { boardFirstAt: at, boardReference: input.reference ?? current.boardReference }
        : input.step === 'board_detailed'
          ? { boardDetailedAt: at, boardReference: input.reference ?? current.boardReference }
          : input.step === 'principals'
            ? { principalsAt: at, principalsHow: input.note ?? current.principalsHow }
            : input.step === 'cert_in'
              ? { certInAt: at }
              : input.step === 'extension'
                ? { boardExtendedTo: at }
                : input.step === 'contained'
                  ? { containedAt: at, status: 'contained' as const }
                  : {}
    if (Object.keys(change).length) {
      await tx
        .update(breach)
        .set({ ...change, updatedAt: now })
        .where(eq(breach.id, breachId))
    }
    await event(tx, ctx, {
      clientId,
      breachId,
      kind: input.step,
      happenedAt: at,
      note:
        [input.note, input.reference ? `Reference ${input.reference}` : null]
          .filter(Boolean)
          .join(' ') || null,
    })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: `breach.${input.step}`,
      entity: 'breach',
      entityId: current.code,
      detail: { at: at?.toISOString() ?? null },
    })
  })
}

/** What still has to be intimated before a breach can be closed without a reason. */
export const outstandingIntimations = (row: ClockInput): string[] =>
  breachClocks(row, new Date())
    .filter((clock) => clock.state === 'running' || clock.state === 'overdue')
    .map((clock) => clock.label)

/**
 * Closes a breach. With an intimation still outstanding it needs a reason, for example that the
 * investigation found no personal data was involved.
 */
export const closeBreach = async (
  ctx: ServiceContext,
  clientId: string,
  breachId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  const input = parseInput(z.object({ reason: optionalText(2000) }), raw)
  await inClient(ctx, clientId, async (tx) => {
    const current = await loadBreach(tx, clientId, breachId)
    assertOpen(current)
    const outstanding = outstandingIntimations(current)
    if (outstanding.length && (input.reason?.length ?? 0) < 10) {
      throw new ValidationError({
        reason: `Still to be done: ${outstanding.join('; ')}. Record them first, or say why the breach is closed without them (at least 10 characters).`,
      })
    }
    await tx
      .update(breach)
      .set({
        status: 'closed',
        closedAt: new Date(),
        closeReason: input.reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(breach.id, breachId))
    await event(tx, ctx, { clientId, breachId, kind: 'closed', note: input.reason })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'breach.close',
      entity: 'breach',
      entityId: current.code,
      detail: { outstanding },
    })
  })
}

export const reopenBreach = async (
  ctx: ServiceContext,
  clientId: string,
  breachId: string,
): Promise<void> => {
  authorize(ctx.principal, 'incident.manage', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const current = await loadBreach(tx, clientId, breachId)
    if (current.status !== 'closed') throw new RuleError(`${current.code} is not closed.`)
    await tx
      .update(breach)
      .set({
        status: current.containedAt ? 'contained' : 'open',
        closedAt: null,
        closeReason: null,
        updatedAt: new Date(),
      })
      .where(eq(breach.id, breachId))
    await event(tx, ctx, { clientId, breachId, kind: 'reopened' })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'breach.reopen',
      entity: 'breach',
      entityId: current.code,
    })
  })
}

/** The register, newest first, each breach with its clocks. */
export const listBreaches = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const now = new Date()
  return inClient(ctx, clientId, async (tx) => {
    const rows = await tx
      .select({ breach, departmentName: department.name, processorName: processor.name })
      .from(breach)
      .leftJoin(department, eq(department.id, breach.departmentId))
      .leftJoin(processor, eq(processor.id, breach.processorId))
      .where(eq(breach.tenantId, clientId))
      .orderBy(desc(breach.awareAt))
    return {
      canEdit: can(ctx.principal, 'incident.manage', { clientId }),
      breaches: rows.map((row) => {
        const clocks = breachClocks(row.breach, now)
        return {
          ...row.breach,
          departmentName: row.departmentName,
          processorName: row.processorName,
          clocks,
          nextDeadline: row.breach.status === 'closed' ? null : nextDeadline(clocks),
          overdue:
            row.breach.status !== 'closed' && clocks.some((clock) => clock.state === 'overdue'),
        }
      }),
    }
  })
}
export type BreachList = Awaited<ReturnType<typeof listBreaches>>
export type BreachRow = BreachList['breaches'][number]

/** One breach with its clocks, timeline, draft notices and the activities it affects. */
export const getBreach = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const now = new Date()
  return inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({
        breach,
        departmentName: department.name,
        processorName: processor.name,
        processorCode: processor.code,
        clientName: tenant.name,
        legalName: clientProfile.legalName,
      })
      .from(breach)
      .innerJoin(tenant, eq(tenant.id, breach.tenantId))
      .leftJoin(clientProfile, eq(clientProfile.tenantId, breach.tenantId))
      .leftJoin(department, eq(department.id, breach.departmentId))
      .leftJoin(processor, eq(processor.id, breach.processorId))
      .where(and(eq(breach.tenantId, clientId), eq(breach.code, code.toUpperCase())))
    if (!row) throw new NotFoundError(`Breach ${code}`)
    const events = await tx
      .select({
        id: breachEvent.id,
        at: breachEvent.at,
        kind: breachEvent.kind,
        happenedAt: breachEvent.happenedAt,
        note: breachEvent.note,
        actorName: appUser.displayName,
      })
      .from(breachEvent)
      .leftJoin(appUser, eq(appUser.id, breachEvent.actorUserId))
      .where(eq(breachEvent.breachId, row.breach.id))
      .orderBy(asc(breachEvent.id))
    const activities = row.breach.activityRefs.length
      ? await tx
          .select({ ref: processingActivity.ref, name: processingActivity.name })
          .from(processingActivity)
          .where(
            and(
              eq(processingActivity.tenantId, clientId),
              inArray(processingActivity.ref, row.breach.activityRefs),
            ),
          )
          .orderBy(asc(processingActivity.ref))
      : []
    const clocks = breachClocks(row.breach, now)
    return {
      ...row.breach,
      departmentName: row.departmentName,
      processorName: row.processorName,
      processorCode: row.processorCode,
      clocks,
      outstanding: row.breach.status === 'closed' ? [] : outstandingIntimations(row.breach),
      events,
      activities: activities.map((activity) => ({ ...activity, refLabel: refLabel(activity.ref) })),
      notices: breachNotices(row.breach, row.legalName ?? row.clientName),
      canEdit: can(ctx.principal, 'incident.manage', { clientId }),
    }
  })
}
export type BreachDetail = Awaited<ReturnType<typeof getBreach>>

/** Departments, processors and RoPA activities a breach can be tied to. */
export const breachFormOptions = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => ({
    departments: await tx
      .select({ id: department.id, name: department.name })
      .from(department)
      .where(and(eq(department.tenantId, clientId), eq(department.active, true)))
      .orderBy(asc(department.name)),
    processors: await tx
      .select({ id: processor.id, name: processor.name })
      .from(processor)
      .where(eq(processor.tenantId, clientId))
      .orderBy(asc(processor.name)),
    activities: (
      await tx
        .select({ ref: processingActivity.ref, name: processingActivity.name })
        .from(processingActivity)
        .where(eq(processingActivity.tenantId, clientId))
        .orderBy(asc(processingActivity.ref))
    ).map((activity) => ({ ...activity, refLabel: refLabel(activity.ref) })),
    contact: await defaultContact(tx, clientId),
  }))
}
export type BreachFormOptions = Awaited<ReturnType<typeof breachFormOptions>>
