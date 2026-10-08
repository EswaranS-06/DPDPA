import { authorize, can } from '@duatf/core-access'
import {
  and,
  asc,
  clientProfile,
  dataElement,
  department,
  departmentDataElement,
  desc,
  eq,
  frameworkRelease,
  inArray,
  lawfulBasis,
  max,
  processingActivity,
  processingActivityElement,
  processTemplate,
  retentionAnchor,
  sql,
  vocabularyTerm,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
import { dataFlowGraph, type DataFlowGraph, type FlowActivity } from './dataFlow'
import { isUniqueViolation, NotFoundError, parseInput, RuleError, ValidationError } from './errors'
import { listClientPeople } from './people'
import {
  defaultLevel,
  normaliseCategory,
  presetsFor,
  type Level,
  type TransferAnswer,
} from './personalData'
import {
  basisLabel,
  normaliseActivity,
  ownKey,
  ROPA_LISTS,
  type ActivityScope,
  type ActivityValues,
  type RawActivity,
  type RopaAnswer,
  type RopaKb,
  type RopaList,
  type RopaProcess,
} from './ropaKb'

// The client's record of processing, one processing activity per row (ADR-0008). Activities start
// from catalogue processes with the knowledge base's defaults, or blank, and are edited in the app
// or through the RoPA workbook.

const published = async (tx: Transaction) => {
  const [release] = await tx
    .select({ id: frameworkRelease.id, version: frameworkRelease.version })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  if (!release) throw new RuleError('No knowledge-base release is published yet.')
  return release
}

/** The published knowledge base as the RoPA of one client needs it. */
export const loadRopaKb = async (tx: Transaction, clientId: string): Promise<RopaKb> => {
  const release = await published(tx)
  const [profile] = await tx
    .select({ sectorCode: clientProfile.sectorCode })
    .from(clientProfile)
    .where(eq(clientProfile.tenantId, clientId))
  const sector = profile?.sectorCode ?? null
  const [terms, elements, bases, processes, anchors] = await Promise.all([
    tx
      .select()
      .from(vocabularyTerm)
      .where(
        and(
          eq(vocabularyTerm.releaseId, release.id),
          inArray(vocabularyTerm.vocabularyCode, Object.values(ROPA_LISTS)),
        ),
      )
      .orderBy(asc(vocabularyTerm.vocabularyCode), asc(vocabularyTerm.seq)),
    tx
      .select()
      .from(dataElement)
      .where(eq(dataElement.releaseId, release.id))
      .orderBy(asc(dataElement.code)),
    tx
      .select({ code: lawfulBasis.code, name: lawfulBasis.name, reference: lawfulBasis.reference })
      .from(lawfulBasis)
      .where(eq(lawfulBasis.releaseId, release.id))
      .orderBy(asc(lawfulBasis.code)),
    tx
      .select()
      .from(processTemplate)
      .where(
        and(
          eq(processTemplate.releaseId, release.id),
          inArray(processTemplate.sectorCode, ['CMN', ...(sector ? [sector] : [])]),
        ),
      )
      .orderBy(asc(processTemplate.code)),
    sector
      ? tx
          .select()
          .from(retentionAnchor)
          .where(
            and(
              eq(retentionAnchor.releaseId, release.id),
              eq(retentionAnchor.overlayCode, sector),
              eq(retentionAnchor.confidence, 'high'),
            ),
          )
          .orderBy(asc(retentionAnchor.seq))
      : Promise.resolve([]),
  ])
  const lists = Object.fromEntries(
    Object.entries(ROPA_LISTS).map(([key, code]) => [
      key,
      terms
        .filter((row) => row.vocabularyCode === code)
        .map((row) => ({ value: row.term, meaning: row.meaning, extra: row.extra })),
    ]),
  ) as Record<RopaList, RopaAnswer[]>
  const names = new Map(
    lists.names.flatMap((answer) => {
      const code = answer.meaning
      return code ? [[code, answer.value] as const] : []
    }),
  )
  // Consent and the s.7 legitimate uses first; the s.17 exemptions after them.
  const rank = (code: string) => (code === 'consent' ? 0 : code.startsWith('s7') ? 1 : 2)
  bases.sort((a, b) => rank(a.code) - rank(b.code) || a.code.localeCompare(b.code))
  return {
    releaseVersion: release.version,
    lists,
    sectorRetention: anchors.map((row) => ({
      value: `${row.record}: ${row.period}`,
      meaning: null,
      extra: { Reference: row.source },
    })),
    bases: bases.map((row) => ({ ...row, label: basisLabel(row) })),
    elements: elements.map((row) => ({
      code: row.code,
      title: row.title,
      name: names.get(row.code) ?? row.title.replace(/\s*\([^)]*\)/g, '').trim(),
      category: normaliseCategory(row),
      level: defaultLevel(row),
      personalData: row.personalData,
    })),
    processes: processes.map((row) => ({
      code: row.code,
      title: row.title,
      sectorCode: row.sectorCode,
      department: row.department,
      typicalSystems: row.typicalSystems,
      typicalLawfulBasis: row.typicalLawfulBasis,
      purpose: row.ropaPurpose,
      elements: row.ropaElements,
      principals: row.ropaPrincipals,
      sources: row.ropaSources,
      internal: row.ropaInternal,
      processors: row.ropaProcessors,
      recipients: row.ropaRecipients,
      retention: row.ropaRetention,
      deletion: row.ropaDeletion,
      security: row.ropaSecurity,
    })),
  }
}

export const refLabel = (ref: number) => `PA-${String(ref).padStart(3, '0')}`

/** "PA-007", "pa-7" or "7" to 7. */
export const parseRef = (text: string): number | null => {
  const match = /^(?:pa-?)?0*(\d{1,6})$/i.exec(text.trim())
  return match ? Number(match[1]) : null
}

type DepartmentRow = {
  id: string
  code: string
  name: string
  headName: string | null
  headEmail: string | null
  active: boolean
}

export type RopaScope = ActivityScope & { departmentRows: DepartmentRow[] }

/** The knowledge base, the client's departments and what each department already holds. */
export const ropaScope = async (tx: Transaction, clientId: string): Promise<RopaScope> => {
  const [kb, departments, held] = await Promise.all([
    loadRopaKb(tx, clientId),
    tx
      .select({
        id: department.id,
        code: department.code,
        name: department.name,
        headName: department.headName,
        headEmail: department.headEmail,
        active: department.active,
      })
      .from(department)
      .where(eq(department.tenantId, clientId))
      .orderBy(asc(department.code)),
    tx
      .select({
        departmentId: departmentDataElement.departmentId,
        code: departmentDataElement.elementCode,
        title: departmentDataElement.title,
        category: departmentDataElement.category,
        level: departmentDataElement.level,
      })
      .from(departmentDataElement)
      .where(eq(departmentDataElement.tenantId, clientId)),
  ])
  const codeOf = new Map(departments.map((row) => [row.id, row.code]))
  const inventory = new Map<string, Map<string, { category: string; level: Level }>>()
  for (const row of held) {
    const code = codeOf.get(row.departmentId) ?? ''
    const map = inventory.get(code) ?? new Map<string, { category: string; level: Level }>()
    const kept = { category: row.category, level: row.level as Level }
    if (row.code) map.set(row.code, kept)
    map.set(ownKey(row.title), kept)
    inventory.set(code, map)
  }
  return {
    kb,
    departments: departments.map(({ code, name }) => ({ code, name })),
    departmentRows: departments,
    inventory,
  }
}

const sameKind = (a: string, b: string) => {
  const kinds = new Set(presetsFor(a).map((preset) => preset.key))
  return presetsFor(b).some((preset) => kinds.has(preset.key))
}

/** The client's departments a process's generic recipients ("Finance", "IT") stand for. */
const internalFor = (names: readonly string[], own: string, scope: RopaScope) =>
  scope.departmentRows
    .filter((row) => row.code !== own && row.active)
    .filter((row) =>
      names.some(
        (name) =>
          sameKind(`${row.name} ${row.code}`, name) ||
          row.name.toLowerCase() === name.toLowerCase(),
      ),
    )
    .map((row) => row.code)

/** A new activity as a catalogue process suggests it for one department. */
export const fromProcess = (
  process: RopaProcess,
  departmentCode: string,
  scope: RopaScope,
): RawActivity => {
  const own = scope.departmentRows.find((row) => row.code === departmentCode)
  const consentBased = process.typicalLawfulBasis.includes('consent')
  const consent = scope.kb.lists.consent.map((answer) => answer.value)
  return {
    department: departmentCode,
    name: process.title,
    templateCode: process.code,
    purpose: process.purpose ?? process.title,
    lawfulBases: process.typicalLawfulBasis,
    principals: process.principals,
    elements: process.elements,
    sources: process.sources,
    systems: process.typicalSystems,
    internalRecipients: internalFor(process.internal, departmentCode, scope),
    processors: process.processors,
    recipients: process.recipients,
    retention: process.retention ?? '',
    deletion: process.deletion ?? '',
    security: process.security,
    transfersAbroad: 'unknown',
    consentStatus: consentBased
      ? (consent.find((value) => /not yet checked/i.test(value)) ?? '')
      : (consent.find((value) => /^not needed/i.test(value)) ?? ''),
    owner: own?.headName ? [own.headName, own.headEmail].filter(Boolean).join(', ') : '',
  }
}

const activitySelect = (tx: Transaction, clientId: string) =>
  tx
    .select()
    .from(processingActivity)
    .where(eq(processingActivity.tenantId, clientId))
    .orderBy(asc(processingActivity.ref))

const elementsOf = (tx: Transaction, ids: string[]) =>
  ids.length
    ? tx
        .select()
        .from(processingActivityElement)
        .where(inArray(processingActivityElement.activityId, ids))
        .orderBy(asc(processingActivityElement.seq))
    : Promise.resolve([])

export type ActivityRow = ActivityValues & {
  id: string
  ref: number
  refLabel: string
  departmentName: string
  templateTitle: string | null
  updatedAt: Date
}

/** Stored activities in their values form, with labels for showing them. */
export const activityRows = async (
  tx: Transaction,
  clientId: string,
  scope: RopaScope,
): Promise<ActivityRow[]> => {
  const rows = await activitySelect(tx, clientId)
  const elements = await elementsOf(
    tx,
    rows.map((row) => row.id),
  )
  const departments = new Map(scope.departmentRows.map((row) => [row.id, row]))
  const titles = new Map(scope.kb.processes.map((row) => [row.code, row.title]))
  return rows.map((row) => {
    const owner = departments.get(row.departmentId)
    return {
      id: row.id,
      ref: row.ref,
      refLabel: refLabel(row.ref),
      departmentCode: owner?.code ?? '',
      departmentName: owner?.name ?? '',
      name: row.name,
      templateCode: row.templateCode,
      templateTitle: row.templateCode ? (titles.get(row.templateCode) ?? null) : null,
      purpose: row.purpose,
      lawfulBases: row.lawfulBases,
      lawReference: row.lawReference,
      principals: row.principals,
      elements: elements
        .filter((item) => item.activityId === row.id)
        .map((item) => ({
          code: item.elementCode,
          title: item.title,
          category: item.category,
          level: item.level as Level,
        })),
      sources: row.sources,
      systems: row.systems,
      internalRecipients: row.internalRecipients,
      processors: row.processors,
      recipients: row.recipients,
      retention: row.retention,
      deletion: row.deletion,
      security: row.security,
      transfersAbroad: row.transfersAbroad as TransferAnswer,
      countries: row.countries,
      consentStatus: row.consentStatus,
      owner: row.owner,
      notes: row.notes,
      updatedAt: row.updatedAt,
    }
  })
}

/** Adds the activity's elements a department doesn't list yet to its personal data. */
const syncInventory = async (
  tx: Transaction,
  clientId: string,
  departmentId: string,
  values: ActivityValues,
) => {
  const held = await tx
    .select({ code: departmentDataElement.elementCode, title: departmentDataElement.title })
    .from(departmentDataElement)
    .where(eq(departmentDataElement.departmentId, departmentId))
  const codes = new Set(held.flatMap((row) => (row.code ? [row.code] : [])))
  const titles = new Set(held.map((row) => row.title.toLowerCase()))
  const missing = values.elements.filter(
    (item) => !(item.code && codes.has(item.code)) && !titles.has(item.title.toLowerCase()),
  )
  if (missing.length === 0) return 0
  const [last] = await tx
    .select({ seq: max(departmentDataElement.seq) })
    .from(departmentDataElement)
    .where(eq(departmentDataElement.departmentId, departmentId))
  const start = (last?.seq ?? 0) + 1
  await tx.insert(departmentDataElement).values(
    missing.map((item, index) => ({
      tenantId: clientId,
      departmentId,
      elementCode: item.code,
      title: item.title,
      category: item.category,
      level: item.level,
      seq: start + index,
    })),
  )
  return missing.length
}

/**
 * The next activity number. Numbers are never reused, so an old export can't touch a newer
 * activity; the sequence starts above any number already in use.
 */
const nextRef = async (tx: Transaction, clientId: string) => {
  const rows = await tx.execute<{ last_value: number }>(sql`
    insert into code_sequence (tenant_id, scope, last_value)
    values (${clientId}, 'PA', (
      select coalesce(max(ref), 0) + 1 from processing_activity where tenant_id = ${clientId}))
    on conflict (tenant_id, scope)
    do update set last_value = greatest(code_sequence.last_value + 1, excluded.last_value)
    returning last_value`)
  const value = rows[0]?.last_value
  if (value === undefined) throw new Error('No activity number returned')
  return Number(value)
}

/**
 * Creates (ref null) or replaces one activity in the client's transaction, then makes sure its
 * department lists the activity's personal data. Returns the activity's ref.
 */
export const writeActivity = async (
  tx: Transaction,
  ctx: ServiceContext,
  clientId: string,
  scope: RopaScope,
  ref: number | null,
  values: ActivityValues,
): Promise<number> => {
  const owner = scope.departmentRows.find((row) => row.code === values.departmentCode)
  if (!owner) throw new ValidationError({ departmentCode: 'Choose the department.' })
  const row = {
    departmentId: owner.id,
    templateCode: values.templateCode,
    name: values.name,
    purpose: values.purpose,
    lawfulBases: values.lawfulBases,
    lawReference: values.lawReference,
    principals: values.principals,
    sources: values.sources,
    systems: values.systems,
    internalRecipients: values.internalRecipients,
    processors: values.processors,
    recipients: values.recipients,
    retention: values.retention,
    deletion: values.deletion,
    security: values.security,
    transfersAbroad: values.transfersAbroad,
    countries: values.countries,
    consentStatus: values.consentStatus,
    owner: values.owner,
    notes: values.notes,
    updatedBy: ctx.principal.userId,
    updatedAt: new Date(),
  }
  let id: string
  let saved: number
  try {
    if (ref === null) {
      saved = await nextRef(tx, clientId)
      const [created] = await tx
        .insert(processingActivity)
        .values({ tenantId: clientId, ref: saved, ...row })
        .returning({ id: processingActivity.id })
      id = created?.id ?? ''
    } else {
      const [updated] = await tx
        .update(processingActivity)
        .set(row)
        .where(and(eq(processingActivity.tenantId, clientId), eq(processingActivity.ref, ref)))
        .returning({ id: processingActivity.id })
      if (!updated) throw new NotFoundError('Processing activity')
      id = updated.id
      saved = ref
      await tx.delete(processingActivityElement).where(eq(processingActivityElement.activityId, id))
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError({
        name: `${owner.name} already has a processing activity called “${values.name}”.`,
      })
    }
    throw error
  }
  if (values.elements.length) {
    await tx.insert(processingActivityElement).values(
      values.elements.map((item, index) => ({
        tenantId: clientId,
        activityId: id,
        elementCode: item.code,
        title: item.title,
        category: item.category,
        level: item.level,
        seq: index + 1,
      })),
    )
  }
  await syncInventory(tx, clientId, owner.id, values)
  return saved
}

/** The client's record of processing, one row per activity. */
export const listActivities = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const scope = await ropaScope(tx, clientId)
    return {
      kb: scope.kb,
      departments: scope.departmentRows,
      activities: await activityRows(tx, clientId, scope),
      canEdit: can(ctx.principal, 'department.manage', { clientId }),
    }
  })
}
export type ActivityList = Awaited<ReturnType<typeof listActivities>>

/** People at the client, as "Name, title, email", for the owner field. */
export const ownerOptions = async (ctx: ServiceContext, clientId: string) =>
  (await listClientPeople(ctx, clientId))
    .filter((person) => person.kind === 'client' && person.status !== 'disabled')
    .map((person) => [person.displayName, person.jobTitle, person.email].filter(Boolean).join(', '))

/**
 * What the activity form needs: the activity (or a new one, blank or from a catalogue process)
 * and every list it picks from.
 */
export const activityForm = async (
  ctx: ServiceContext,
  clientId: string,
  ref: number | null,
  start: { department?: string; process?: string } = {},
) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const owners = await ownerOptions(ctx, clientId)
  return inClient(ctx, clientId, async (tx) => {
    const scope = await ropaScope(tx, clientId)
    let values: ActivityValues
    let id: string | null = null
    let updatedAt: Date | null = null
    if (ref !== null) {
      const found = (await activityRows(tx, clientId, scope)).find((row) => row.ref === ref)
      if (!found) throw new NotFoundError('Processing activity')
      values = found
      id = found.id
      updatedAt = found.updatedAt
    } else {
      const process = scope.kb.processes.find((row) => row.code === start.process)
      const departmentCode =
        scope.departmentRows.find((row) => row.code === start.department?.toUpperCase())?.code ?? ''
      values = normaliseActivity(
        process ? fromProcess(process, departmentCode, scope) : { department: departmentCode },
        scope,
      ).values
    }
    return {
      ref,
      refLabel: ref === null ? null : refLabel(ref),
      id,
      updatedAt,
      values,
      kb: scope.kb,
      /** Department code -> the knowledge-base elements it already lists. */
      held: Object.fromEntries(
        [...scope.inventory].map(([code, map]) => [
          code,
          [...map.keys()].filter((key) => !key.startsWith('own:')),
        ]),
      ),
      departments: scope.departmentRows.filter(
        (row) => row.active || row.code === values.departmentCode,
      ),
      owners,
      canEdit: can(ctx.principal, 'department.manage', { clientId }),
    }
  })
}
export type ActivityForm = Awaited<ReturnType<typeof activityForm>>

/** Saves one activity from the form. Returns its ref. */
export const saveActivity = async (
  ctx: ServiceContext,
  clientId: string,
  ref: number | null,
  raw: unknown,
): Promise<{ ref: number; warnings: Record<string, string> }> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const scope = await ropaScope(tx, clientId)
    const { values, errors, warnings } = normaliseActivity(
      typeof raw === 'object' && raw !== null ? raw : {},
      scope,
    )
    if (Object.keys(errors).length) throw new ValidationError(errors)
    const saved = await writeActivity(tx, ctx, clientId, scope, ref, values)
    await audit(tx, ctx, {
      tenantId: clientId,
      action: ref === null ? 'ropa.activity_create' : 'ropa.activity_update',
      entity: 'processing_activity',
      entityId: refLabel(saved),
      detail: { department: values.departmentCode, elements: values.elements.length },
    })
    return { ref: saved, warnings }
  })
}

export const deleteActivity = async (ctx: ServiceContext, clientId: string, ref: number) => {
  authorize(ctx.principal, 'department.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [removed] = await tx
      .delete(processingActivity)
      .where(and(eq(processingActivity.tenantId, clientId), eq(processingActivity.ref, ref)))
      .returning({ name: processingActivity.name })
    if (!removed) throw new NotFoundError('Processing activity')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'ropa.activity_delete',
      entity: 'processing_activity',
      entityId: refLabel(ref),
      detail: { name: removed.name },
    })
  })
}

/** Each department's suggested catalogue processes, and which it already records. */
export const ropaCatalogue = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const scope = await ropaScope(tx, clientId)
    const activities = await activitySelect(tx, clientId)
    const words = (value: string) =>
      ` ${value
        .toLowerCase()
        .replace(/[^a-z0-9&]+/g, ' ')
        .trim()} `
    const departments = scope.departmentRows
      .filter((row) => row.active)
      .map((row) => {
        const kinds = new Set(
          presetsFor(row.name, row.code).flatMap((preset) => preset.processDepartments),
        )
        const name = words(`${row.name} ${row.code}`)
        const adopted = new Set(
          activities
            .filter((item) => item.departmentId === row.id && item.templateCode)
            .map((item) => item.templateCode ?? ''),
        )
        return {
          code: row.code,
          name: row.name,
          suggested: scope.kb.processes
            .filter(
              (process) =>
                kinds.has(process.department) || name.includes(words(process.department)),
            )
            .map((process) => process.code),
          adopted: [...adopted],
          activities: activities.filter((item) => item.departmentId === row.id).length,
        }
      })
    return {
      kb: scope.kb,
      departments,
      processes: scope.kb.processes.map((process) => ({
        code: process.code,
        title: process.title,
        department: process.department,
        sectorCode: process.sectorCode,
        purpose: process.purpose,
        elements: process.elements.length,
      })),
      canEdit: can(ctx.principal, 'department.manage', { clientId }),
    }
  })
}
export type RopaCatalogue = Awaited<ReturnType<typeof ropaCatalogue>>

const adoptSchema = z.object({
  picks: z
    .array(z.object({ department: z.string().trim().min(1), process: z.string().trim().min(1) }))
    .min(1, 'Choose at least one process.')
    .max(400, 'At most 400 at a time.'),
})

/**
 * Starts one activity per picked (department, process) with the knowledge base's defaults. A
 * department that already records a process keeps its activity; nothing is overwritten.
 */
export const adoptProcesses = async (ctx: ServiceContext, clientId: string, raw: unknown) => {
  authorize(ctx.principal, 'department.manage', { clientId })
  const input = parseInput(adoptSchema, raw)
  return inClient(ctx, clientId, async (tx) => {
    const scope = await ropaScope(tx, clientId)
    const existing = await activitySelect(tx, clientId)
    const departmentId = new Map(scope.departmentRows.map((row) => [row.code, row.id]))
    const created: string[] = []
    const skipped: string[] = []
    const seen = new Set<string>()
    for (const pick of input.picks) {
      const departmentCode = pick.department.toUpperCase()
      const process = scope.kb.processes.find((row) => row.code === pick.process)
      const owner = departmentId.get(departmentCode)
      if (!process || !owner) {
        throw new ValidationError({ picks: `${pick.department} ${pick.process} is not available.` })
      }
      const key = `${departmentCode}:${process.code}`
      const already = existing.some(
        (row) =>
          row.departmentId === owner &&
          (row.templateCode === process.code ||
            row.name.toLowerCase() === process.title.toLowerCase()),
      )
      if (already || seen.has(key)) {
        skipped.push(key)
        continue
      }
      seen.add(key)
      const { values, errors } = normaliseActivity(
        fromProcess(process, departmentCode, scope),
        scope,
      )
      if (Object.keys(errors).length) {
        throw new ValidationError(
          errors,
          `${process.code} could not be added for ${departmentCode}.`,
        )
      }
      const ref = await writeActivity(tx, ctx, clientId, scope, null, values)
      created.push(refLabel(ref))
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'ropa.adopt',
      entity: 'processing_activity',
      entityId: created[0] ?? 'none',
      detail: { created: created.length, skipped: skipped.length },
    })
    return { created, skipped }
  })
}

/** The record of processing as the data flow diagram takes it, elements by their RoPA names. */
export const flowActivitiesOf = (list: Pick<ActivityList, 'activities' | 'kb'>): FlowActivity[] => {
  const names = new Map(list.kb.elements.map((row) => [row.code, row.name]))
  return list.activities.map((row) => ({
    refLabel: row.refLabel,
    name: row.name,
    departmentCode: row.departmentCode,
    principals: row.principals,
    sources: row.sources,
    elements: row.elements.map((item) => ({
      name: (item.code ? names.get(item.code) : undefined) ?? item.title,
      level: item.level,
    })),
    systems: row.systems,
    internalRecipients: row.internalRecipients,
    processors: row.processors,
    recipients: row.recipients,
    transfersAbroad: row.transfersAbroad,
    countries: row.countries,
  }))
}

/** The data flow diagram of the client's record of processing. */
export const dataFlowOf = (
  list: Pick<ActivityList, 'activities' | 'departments' | 'kb'>,
): DataFlowGraph => dataFlowGraph(flowActivitiesOf(list), list.departments)
