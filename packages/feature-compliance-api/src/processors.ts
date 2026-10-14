import { authorize, can } from '@duatf/core-access'
import { addCalendarDays, isoDate } from '@duatf/core-utils'
import {
  and,
  asc,
  CONTRACT_ANSWERS,
  department,
  eq,
  evidence,
  inArray,
  processingActivity,
  processingActivityElement,
  processor,
  PROCESSOR_KINDS,
  PROCESSOR_LOCATIONS,
  PROCESSOR_RATINGS,
  type ContractAnswer,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
import {
  isUniqueViolation,
  NotFoundError,
  optionalDate,
  optionalEmail,
  optionalText,
  parseInput,
  requiredText,
  ValidationError,
} from './errors'
import { higherLevel, type Level } from './personalData'
import { blankToUndefined, nextRegisterCode, ticked, toList } from './registerCodes'
import { refLabel } from './ropa'

// The processor register (ADR-0009): the vendors that process personal data for the client, each
// with its contract (s.8(2)), the terms that contract covers and the RoPA activities that name it.
// An entry is matched to the RoPA by name, so the RoPA keeps its plain answers.

/**
 * Terms a processor contract should cover so the Data Fiduciary can meet its own duties. Only
 * the security safeguards are named by the Rules as a contract provision (R6(1)(f)); the Act
 * leaves the rest to the contract, with the Data Fiduciary answerable either way (s.8(1)).
 */
export const CONTRACT_TERMS = [
  {
    code: 'purpose',
    label: 'Processes only for the client’s purposes and on its instructions',
    basis: 's.8(2)',
  },
  {
    code: 'safeguards',
    label: 'Takes reasonable security safeguards',
    basis: 's.8(5), R6(1)(f)',
  },
  {
    code: 'breach_notice',
    label: 'Tells the client of a personal data breach without delay',
    basis: 's.8(6), R7',
  },
  {
    code: 'cease',
    label: 'Stops processing when consent is withdrawn',
    basis: 's.6(6)',
  },
  {
    code: 'erasure',
    label: 'Erases the personal data when the purpose is served or when told to',
    basis: 's.8(7)(b)',
  },
  {
    code: 'sub_processors',
    label: 'Uses another processor only with approval and on the same terms',
    basis: 's.8(1)',
  },
  {
    code: 'rights_help',
    label: 'Helps answer Data Principals’ requests',
    basis: 's.11 to s.14',
  },
  {
    code: 'oversight',
    label: 'Allows audits or gives assurance reports',
    basis: 's.8(1)',
  },
  {
    code: 'location',
    label: 'Says where the personal data may be processed',
    basis: 's.16',
  },
] as const
export type ContractTerm = (typeof CONTRACT_TERMS)[number]['code']
const TERM_CODES: readonly string[] = CONTRACT_TERMS.map((term) => term.code)

export type ContractState =
  'none' | 'unknown' | 'not_started' | 'in_force' | 'ending_soon' | 'ended'

/** A contract is "ending soon" this many days before its end date. */
export const CONTRACT_ENDING_DAYS = 60

export const CONTRACT_STATE_LABEL: Record<ContractState, string> = {
  none: 'No contract',
  unknown: 'Contract not checked',
  not_started: 'Contract not started',
  in_force: 'Contract in force',
  ending_soon: 'Contract ending soon',
  ended: 'Contract ended',
}

/** Where a processor's contract stands on a day, from the answer and its dates. */
export const contractState = (
  row: { contract: ContractAnswer; contractStart: string | null; contractEnd: string | null },
  today: string,
): ContractState => {
  if (row.contract === 'no') return 'none'
  if (row.contract === 'unknown') return 'unknown'
  if (row.contractEnd !== null && row.contractEnd < today) return 'ended'
  if (row.contractStart !== null && row.contractStart > today) return 'not_started'
  if (row.contractEnd !== null && row.contractEnd <= addCalendarDays(today, CONTRACT_ENDING_DAYS)) {
    return 'ending_soon'
  }
  return 'in_force'
}

/** A name as it is compared: case and spacing do not matter. */
export const nameKey = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, ' ')

/** Every spelling a register entry answers to. */
export const spellingsOf = (row: { name: string; aliases: readonly string[] }): string[] => [
  ...new Set([row.name, ...row.aliases].map(nameKey).filter(Boolean)),
]

type RopaUse = {
  ref: number
  name: string
  departmentName: string
  processors: string[]
  elements: { title: string; category: string; level: Level }[]
}

/** The RoPA activities, with the processors each names and its personal data. */
const ropaUses = async (tx: Transaction, clientId: string): Promise<RopaUse[]> => {
  const activities = await tx
    .select({
      id: processingActivity.id,
      ref: processingActivity.ref,
      name: processingActivity.name,
      departmentName: department.name,
      processors: processingActivity.processors,
    })
    .from(processingActivity)
    .innerJoin(department, eq(department.id, processingActivity.departmentId))
    .where(eq(processingActivity.tenantId, clientId))
    .orderBy(asc(processingActivity.ref))
  const ids = activities.map((row) => row.id)
  const elements = ids.length
    ? await tx
        .select({
          activityId: processingActivityElement.activityId,
          title: processingActivityElement.title,
          category: processingActivityElement.category,
          level: processingActivityElement.level,
        })
        .from(processingActivityElement)
        .where(inArray(processingActivityElement.activityId, ids))
        .orderBy(asc(processingActivityElement.seq))
    : []
  return activities.map((row) => ({
    ref: row.ref,
    name: row.name,
    departmentName: row.departmentName,
    processors: row.processors,
    elements: elements
      .filter((element) => element.activityId === row.id)
      .map((element) => ({
        title: element.title,
        category: element.category,
        level: element.level as Level,
      })),
  }))
}

/** What the RoPA says a register entry receives: its activities, their data and its highest level. */
export const usesOf = (entry: { name: string; aliases: readonly string[] }, ropa: RopaUse[]) => {
  const spellings = new Set(spellingsOf(entry))
  const activities = ropa.filter((row) =>
    row.processors.some((name) => spellings.has(nameKey(name))),
  )
  const data = new Map<string, { title: string; category: string; level: Level }>()
  for (const element of activities.flatMap((row) => row.elements)) {
    const seen = data.get(element.title)
    data.set(
      element.title,
      seen ? { ...seen, level: higherLevel(seen.level, element.level) } : element,
    )
  }
  const elements = [...data.values()]
  return {
    activities: activities.map((row) => ({
      ref: row.ref,
      refLabel: refLabel(row.ref),
      name: row.name,
      departmentName: row.departmentName,
    })),
    elements,
    highestLevel: elements.reduce<Level | null>(
      (highest, element) => (highest ? higherLevel(highest, element.level) : element.level),
      null,
    ),
  }
}

/** Processors the RoPA names that no register entry answers to, as the RoPA spells them. */
export const unregisteredNames = (
  entries: readonly { name: string; aliases: readonly string[] }[],
  ropa: readonly { processors: readonly string[] }[],
): string[] => {
  const known = new Set(entries.flatMap((entry) => spellingsOf(entry)))
  const missing = new Map<string, string>()
  for (const name of ropa.flatMap((row) => row.processors)) {
    const key = nameKey(name)
    if (key && !known.has(key) && !missing.has(key)) missing.set(key, name.trim())
  }
  return [...missing.values()].sort((a, b) => a.localeCompare(b))
}

const processorSchema = z
  .object({
    name: requiredText('Name', 160),
    aliases: z.preprocess(toList, z.array(z.string().max(160)).max(20)),
    kind: z.enum(PROCESSOR_KINDS, { error: 'Choose a kind.' }),
    service: optionalText(500),
    location: z.enum(PROCESSOR_LOCATIONS, { error: 'Say where the data is processed.' }),
    countries: optionalText(200),
    contactName: optionalText(160),
    contactEmail: optionalEmail(),
    contract: z.enum(CONTRACT_ANSWERS, { error: 'Say whether there is a contract.' }),
    contractStart: optionalDate(),
    contractEnd: optionalDate(),
    contractEvidenceId: z.preprocess(blankToUndefined, z.uuid('Choose evidence.').optional()),
    terms: z.preprocess(toList, z.array(z.string()).max(TERM_CODES.length)),
    rating: z.preprocess(blankToUndefined, z.enum(PROCESSOR_RATINGS).optional()),
    lastAssessedOn: optionalDate(),
    nextReviewOn: optionalDate(),
    notes: optionalText(2000),
    active: z.preprocess((value) => (value === undefined ? true : ticked(value)), z.boolean()),
  })
  .superRefine((value, issues) => {
    if (value.contractStart && value.contractEnd && value.contractEnd < value.contractStart) {
      issues.addIssue({
        code: 'custom',
        path: ['contractEnd'],
        message: 'The contract cannot end before it starts.',
      })
    }
    const unknown = value.terms.filter((term) => !TERM_CODES.includes(term))
    if (unknown.length) {
      issues.addIssue({ code: 'custom', path: ['terms'], message: 'Choose terms from the list.' })
    }
    if (value.lastAssessedOn && value.lastAssessedOn > isoDate(new Date())) {
      issues.addIssue({
        code: 'custom',
        path: ['lastAssessedOn'],
        message: 'The assessment date cannot be in the future.',
      })
    }
  })

type ProcessorInput = z.infer<typeof processorSchema>

const valuesOf = (input: ProcessorInput) => {
  const contracted = input.contract === 'yes'
  return {
    name: input.name,
    aliases: input.aliases.filter((alias) => nameKey(alias) !== nameKey(input.name)),
    kind: input.kind,
    service: input.service ?? null,
    location: input.location,
    countries: input.countries ?? null,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contract: input.contract,
    // Dates, the contract file and its terms only mean something when there is a contract.
    contractStart: contracted ? (input.contractStart ?? null) : null,
    contractEnd: contracted ? (input.contractEnd ?? null) : null,
    contractEvidenceId: contracted ? (input.contractEvidenceId ?? null) : null,
    terms: contracted ? input.terms : [],
    rating: input.rating ?? null,
    lastAssessedOn: input.lastAssessedOn ?? null,
    nextReviewOn: input.nextReviewOn ?? null,
    notes: input.notes ?? null,
    active: input.active,
  }
}

const checkEvidence = async (tx: Transaction, clientId: string, evidenceId: string | null) => {
  if (!evidenceId) return
  const [found] = await tx
    .select({ id: evidence.id })
    .from(evidence)
    .where(and(eq(evidence.id, evidenceId), eq(evidence.tenantId, clientId)))
  if (!found) throw new ValidationError({ contractEvidenceId: 'Choose evidence of this client.' })
}

const nameTaken = () =>
  new ValidationError({ name: 'A processor with this name is already listed.' })

/** The register with, for each entry, its contract state and what the RoPA says it receives. */
export const listProcessors = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const today = isoDate(new Date())
  return inClient(ctx, clientId, async (tx) => {
    const rows = await tx
      .select({ processor, contractEvidenceCode: evidence.code })
      .from(processor)
      .leftJoin(evidence, eq(evidence.id, processor.contractEvidenceId))
      .where(eq(processor.tenantId, clientId))
      .orderBy(asc(processor.name))
    const ropa = await ropaUses(tx, clientId)
    const entries = rows.map((row) => ({
      ...row.processor,
      contractEvidenceCode: row.contractEvidenceCode,
      state: contractState(row.processor, today),
      reviewDue: row.processor.nextReviewOn !== null && row.processor.nextReviewOn <= today,
      ...usesOf(row.processor, ropa),
    }))
    return {
      entries,
      unregistered: unregisteredNames(entries, ropa),
      canEdit: can(ctx.principal, 'register.manage', { clientId }),
    }
  })
}
export type ProcessorList = Awaited<ReturnType<typeof listProcessors>>
export type ProcessorRow = ProcessorList['entries'][number]

export const getProcessor = async (ctx: ServiceContext, clientId: string, code: string) => {
  const list = await listProcessors(ctx, clientId)
  const found = list.entries.find((row) => row.code === code.toUpperCase())
  if (!found) throw new NotFoundError(`Processor ${code}`)
  return { ...found, canEdit: list.canEdit }
}

export const createProcessor = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<{ id: string; code: string }> => {
  authorize(ctx.principal, 'register.manage', { clientId })
  const values = valuesOf(parseInput(processorSchema, raw))
  return inClient(ctx, clientId, async (tx) => {
    await checkEvidence(tx, clientId, values.contractEvidenceId)
    const code = await nextRegisterCode(tx, clientId, 'TP')
    const [created] = await tx
      .insert(processor)
      .values({ ...values, tenantId: clientId, code, updatedBy: ctx.principal.userId })
      .returning({ id: processor.id })
      .catch((error: unknown) => {
        throw isUniqueViolation(error) ? nameTaken() : error
      })
    if (!created) throw new Error('The processor could not be saved.')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'processor.create',
      entity: 'processor',
      entityId: code,
      detail: { name: values.name, contract: values.contract },
    })
    return { id: created.id, code }
  })
}

export const updateProcessor = async (
  ctx: ServiceContext,
  clientId: string,
  processorId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'register.manage', { clientId })
  const values = valuesOf(parseInput(processorSchema, raw))
  await inClient(ctx, clientId, async (tx) => {
    const [current] = await tx
      .select({ code: processor.code })
      .from(processor)
      .where(and(eq(processor.id, processorId), eq(processor.tenantId, clientId)))
    if (!current) throw new NotFoundError('Processor')
    await checkEvidence(tx, clientId, values.contractEvidenceId)
    await tx
      .update(processor)
      .set({ ...values, updatedBy: ctx.principal.userId, updatedAt: new Date() })
      .where(eq(processor.id, processorId))
      .catch((error: unknown) => {
        throw isUniqueViolation(error) ? nameTaken() : error
      })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'processor.update',
      entity: 'processor',
      entityId: current.code,
      detail: { contract: values.contract, contractEnd: values.contractEnd },
    })
  })
}

export const removeProcessor = async (
  ctx: ServiceContext,
  clientId: string,
  processorId: string,
): Promise<void> => {
  authorize(ctx.principal, 'register.manage', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const [removed] = await tx
      .delete(processor)
      .where(and(eq(processor.id, processorId), eq(processor.tenantId, clientId)))
      .returning({ code: processor.code, name: processor.name })
    if (!removed) throw new NotFoundError('Processor')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'processor.remove',
      entity: 'processor',
      entityId: removed.code,
      detail: { name: removed.name },
    })
  })
}

/** Adds a register entry for every processor the RoPA names that is not listed yet. */
export const addProcessorsFromRopa = async (
  ctx: ServiceContext,
  clientId: string,
): Promise<string[]> => {
  authorize(ctx.principal, 'register.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const entries = await tx
      .select({ name: processor.name, aliases: processor.aliases })
      .from(processor)
      .where(eq(processor.tenantId, clientId))
    const missing = unregisteredNames(entries, await ropaUses(tx, clientId))
    for (const name of missing) {
      const code = await nextRegisterCode(tx, clientId, 'TP')
      await tx
        .insert(processor)
        .values({ tenantId: clientId, code, name, updatedBy: ctx.principal.userId })
    }
    if (missing.length) {
      await audit(tx, ctx, {
        tenantId: clientId,
        action: 'processor.from_ropa',
        entity: 'processor',
        entityId: 'register',
        detail: { added: missing },
      })
    }
    return missing
  })
}
