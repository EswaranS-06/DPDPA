import { authorize, can } from '@duatf/core-access'
import { sequenceScope } from '@duatf/core-utils'
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
  processingActivity,
  processingActivityElement,
  processTemplate,
  tenant,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
import { NotFoundError, optionalText, parseInput, RuleError, ValidationError } from './errors'
import {
  CATEGORY_CODES,
  categoryInfo,
  DATA_SOURCES,
  DEPARTMENT_SOURCE,
  defaultLevel,
  higherLevel,
  LEVELS,
  normaliseCategory,
  PERSONAL_DATA_CATEGORIES,
  sourceLabel,
  suggestFor,
  type Level,
  type ProcessHint,
  type TransferAnswer,
} from './personalData'
import { refLabel } from './ropa'

// Each department's answer to "what personal data do you handle, from whom, where is it kept and
// who gets it", and the client-wide data map and record of processing (RoPA) built from them.

export type CatalogueElement = {
  code: string
  title: string
  kbCategory: string
  category: string
  level: Level
  personalData: boolean
  note: string | null
  tags: string[]
}

export type DataCatalogue = {
  releaseVersion: string
  elements: CatalogueElement[]
  processes: ProcessHint[]
  bases: { code: string; name: string; reference: string }[]
}

/** The published knowledge base's data elements, the client's process hints and lawful bases. */
const loadCatalogue = async (tx: Transaction, clientId: string): Promise<DataCatalogue> => {
  const [release] = await tx
    .select({ id: frameworkRelease.id, version: frameworkRelease.version })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  if (!release) throw new RuleError('No knowledge-base release is published yet.')
  const [profile] = await tx
    .select({ sectorCode: clientProfile.sectorCode })
    .from(clientProfile)
    .where(eq(clientProfile.tenantId, clientId))
  const sectors = ['CMN', ...(profile?.sectorCode ? [profile.sectorCode] : [])]
  const [elements, processes, bases] = await Promise.all([
    tx
      .select()
      .from(dataElement)
      .where(eq(dataElement.releaseId, release.id))
      .orderBy(asc(dataElement.code)),
    tx
      .select({
        code: processTemplate.code,
        title: processTemplate.title,
        department: processTemplate.department,
        dataPrincipals: processTemplate.dataPrincipals,
        dataCategories: processTemplate.dataCategories,
        typicalSystems: processTemplate.typicalSystems,
        typicalThirdParties: processTemplate.typicalThirdParties,
        typicalLawfulBasis: processTemplate.typicalLawfulBasis,
      })
      .from(processTemplate)
      .where(
        and(
          eq(processTemplate.releaseId, release.id),
          inArray(processTemplate.sectorCode, sectors),
        ),
      )
      .orderBy(asc(processTemplate.code)),
    tx
      .select({ code: lawfulBasis.code, name: lawfulBasis.name, reference: lawfulBasis.reference })
      .from(lawfulBasis)
      .where(eq(lawfulBasis.releaseId, release.id))
      .orderBy(asc(lawfulBasis.code)),
  ])
  // Consent and the s.7 legitimate uses first; the s.17 exemptions after them.
  const basisRank = (code: string) => (code === 'consent' ? 0 : code.startsWith('s7') ? 1 : 2)
  bases.sort((a, b) => basisRank(a.code) - basisRank(b.code) || a.code.localeCompare(b.code))
  return {
    releaseVersion: release.version,
    elements: elements.map((row) => ({
      code: row.code,
      title: row.title,
      kbCategory: row.category,
      category: normaliseCategory(row),
      level: defaultLevel(row),
      personalData: row.personalData,
      note: row.note,
      tags: row.contextTags,
    })),
    processes,
    bases,
  }
}

const departmentsOf = (tx: Transaction, clientId: string) =>
  tx
    .select({
      id: department.id,
      code: department.code,
      name: department.name,
      headName: department.headName,
      active: department.active,
    })
    .from(department)
    .where(eq(department.tenantId, clientId))
    .orderBy(asc(department.code))

type DepartmentRef = Awaited<ReturnType<typeof departmentsOf>>[number]

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const elementSchema = z.object({
  code: z.preprocess(blankToUndefined, z.string().max(20).optional()),
  title: optionalText(120),
  category: z.preprocess(
    blankToUndefined,
    z.enum(CATEGORY_CODES as [string, ...string[]], { error: 'Choose a category.' }).optional(),
  ),
  level: z.preprocess(blankToUndefined, z.enum(LEVELS, { error: 'Choose a level.' }).optional()),
  source: optionalText(40),
  storage: optionalText(200),
  security: optionalText(300),
  access: optionalText(200),
})

const dataSchema = z.object({
  elements: z.array(elementSchema).max(300, 'At most 300 data elements.').default([]),
})

export type DepartmentDataInput = z.input<typeof dataSchema>
export type DataElementInput = z.input<typeof elementSchema>

type Resolved = Omit<typeof departmentDataElement.$inferInsert, 'tenantId' | 'departmentId'>

/** Turns the submitted elements into rows: knowledge-base titles, defaults, valid sources. */
const resolveElements = (
  items: z.infer<typeof elementSchema>[],
  catalogue: DataCatalogue,
  others: readonly DepartmentRef[],
): Resolved[] => {
  const known = new Map(catalogue.elements.map((row) => [row.code, row]))
  const otherCodes = new Set(others.map((row) => row.code))
  const sources = new Set(DATA_SOURCES.map((row) => row.code))
  const errors: Record<string, string> = {}
  const seen = new Set<string>()
  const rows: Resolved[] = []
  items.forEach((item, index) => {
    const entry = item.code ? known.get(item.code) : undefined
    if (item.code && !entry) {
      errors[`elements.${index}`] = `${item.code} is not in the knowledge base.`
      return
    }
    const title = entry?.title ?? item.title
    if (!title) {
      errors[`elements.${index}`] = 'Name the data element.'
      return
    }
    if (seen.has(title.toLowerCase())) return
    seen.add(title.toLowerCase())
    const source = item.source ?? null
    const validSource =
      source === null ||
      sources.has(source) ||
      (source.startsWith(DEPARTMENT_SOURCE) &&
        otherCodes.has(source.slice(DEPARTMENT_SOURCE.length)))
    if (!validSource) errors[`elements.${index}`] = `Choose where “${title}” comes from.`
    const category = item.category ?? entry?.category ?? 'other'
    rows.push({
      elementCode: entry?.code ?? null,
      title,
      category,
      level:
        item.level ??
        (entry && category === entry.category ? entry.level : categoryInfo(category).level),
      source,
      storage: item.storage ?? null,
      security: item.security ?? null,
      access: item.access ?? null,
      seq: rows.length + 1,
    })
  })
  if (Object.keys(errors).length) {
    throw new ValidationError(errors, 'Some data elements need attention.')
  }
  return rows
}

/**
 * Replaces a department's data elements. Called inside the client's transaction by the
 * department form and the personal data page.
 */
export const applyDepartmentData = async (
  tx: Transaction,
  ctx: ServiceContext,
  clientId: string,
  target: { id: string; code: string },
  raw: unknown,
): Promise<{ elements: number }> => {
  const input = parseInput(dataSchema, raw)
  const catalogue = await loadCatalogue(tx, clientId)
  const others = (await departmentsOf(tx, clientId)).filter((row) => row.id !== target.id)
  const rows = resolveElements(input.elements, catalogue, others)
  await tx.delete(departmentDataElement).where(eq(departmentDataElement.departmentId, target.id))
  if (rows.length) {
    await tx
      .insert(departmentDataElement)
      .values(rows.map((row) => ({ ...row, tenantId: clientId, departmentId: target.id })))
  }
  await audit(tx, ctx, {
    tenantId: clientId,
    action: 'department.data_update',
    entity: 'department',
    entityId: target.code,
    detail: { elements: rows.length },
  })
  return { elements: rows.length }
}

/** Saves a department's personal data page. */
export const saveDepartmentData = async (
  ctx: ServiceContext,
  clientId: string,
  departmentId: string,
  raw: unknown,
): Promise<{ elements: number }> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [target] = await tx
      .select({ id: department.id, code: department.code })
      .from(department)
      .where(and(eq(department.id, departmentId), eq(department.tenantId, clientId)))
    if (!target) throw new NotFoundError('Department')
    return applyDepartmentData(tx, ctx, clientId, target, raw)
  })
}

/** What the add-department form needs to suggest personal data. */
export const dataElementPicker = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'department.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => ({
    catalogue: await loadCatalogue(tx, clientId),
    departments: (await departmentsOf(tx, clientId)).map(({ code, name }) => ({ code, name })),
  }))
}

/** A department's personal data: its elements, its processing activities and the choices to edit them. */
export const departmentData = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const all = await departmentsOf(tx, clientId)
    const own = all.find((row) => row.code === code.toUpperCase())
    if (!own) throw new NotFoundError('Department')
    const [elements, activities, catalogue] = await Promise.all([
      tx
        .select()
        .from(departmentDataElement)
        .where(eq(departmentDataElement.departmentId, own.id))
        .orderBy(asc(departmentDataElement.seq)),
      tx
        .select({
          ref: processingActivity.ref,
          name: processingActivity.name,
          purpose: processingActivity.purpose,
          templateCode: processingActivity.templateCode,
        })
        .from(processingActivity)
        .where(eq(processingActivity.departmentId, own.id))
        .orderBy(asc(processingActivity.ref)),
      loadCatalogue(tx, clientId),
    ])
    return {
      department: own,
      departments: all
        .filter((row) => row.id !== own.id)
        .map(({ code: otherCode, name, active }) => ({ code: otherCode, name, active })),
      elements: elements.map((row) => ({
        code: row.elementCode,
        title: row.title,
        category: row.category,
        level: row.level as Level,
        source: row.source,
        storage: row.storage,
        security: row.security,
        access: row.access,
      })),
      activities: activities.map((row) => ({ ...row, refLabel: refLabel(row.ref) })),
      catalogue,
      suggestion: suggestFor(own.name, own.code, catalogue.processes),
      canEdit: can(ctx.principal, 'department.manage', { clientId }),
    }
  })
}
export type DepartmentData = Awaited<ReturnType<typeof departmentData>>

const levelOf = (levels: readonly Level[]): Level =>
  levels.reduce<Level>((top, level) => higherLevel(top, level), 'L1')

/**
 * The client's data map: per department what it holds, from whom, and its processing activities,
 * with the figures of the whole map. The data flow diagram is drawn from the activities
 * (dataFlow.ts).
 */
export const dataMap = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [client] = await tx
      .select({ code: tenant.code, name: tenant.name })
      .from(tenant)
      .where(eq(tenant.id, clientId))
    if (!client) throw new NotFoundError('Client')
    const [departments, elements, activities, catalogue] = await Promise.all([
      departmentsOf(tx, clientId),
      tx
        .select()
        .from(departmentDataElement)
        .where(eq(departmentDataElement.tenantId, clientId))
        .orderBy(asc(departmentDataElement.seq)),
      tx
        .select()
        .from(processingActivity)
        .where(eq(processingActivity.tenantId, clientId))
        .orderBy(asc(processingActivity.ref)),
      loadCatalogue(tx, clientId),
    ])
    const activityElements = activities.length
      ? await tx
          .select()
          .from(processingActivityElement)
          .where(
            inArray(
              processingActivityElement.activityId,
              activities.map((row) => row.id),
            ),
          )
          .orderBy(asc(processingActivityElement.seq))
      : []
    const nameOf = (code: string) => departments.find((row) => row.code === code)?.name
    const basisName = new Map(catalogue.bases.map((row) => [row.code, row.name]))
    const principal = new Set(
      DATA_SOURCES.filter((row) => row.group === 'principal').map((row) => row.code),
    )
    const unique = (items: readonly string[]) => [...new Set(items.filter(Boolean))]
    const records = departments.map((row) => {
      const own = elements
        .filter((item) => item.departmentId === row.id)
        .map((item) => ({ ...item, level: item.level as Level }))
      const mine = activities.filter((item) => item.departmentId === row.id)
      const sources = unique(own.map((item) => item.source ?? ''))
      const categoryCodes = CATEGORY_CODES.filter((code) =>
        own.some((item) => item.category === code),
      )
      const transfers = mine.map((item) => item.transfersAbroad)
      return {
        department: { ...row, fullCode: sequenceScope('DEP', client.code, row.code) },
        activities: mine.map((item) => ({
          ref: item.ref,
          refLabel: refLabel(item.ref),
          name: item.name,
          purpose: item.purpose,
        })),
        elements: own.map((item) => ({
          code: item.elementCode,
          title: item.title,
          category: item.category,
          categoryTitle: categoryInfo(item.category).title,
          level: item.level,
          source: item.source,
          sourceLabel: item.source ? sourceLabel(item.source, nameOf) : 'Not recorded',
          storage: item.storage,
          security: item.security,
          access: item.access,
        })),
        mapped: own.length > 0 || mine.length > 0,
        level: own.length ? levelOf(own.map((item) => item.level)) : null,
        categories: categoryCodes.map((code) => ({
          code,
          title: categoryInfo(code).title,
          count: own.filter((item) => item.category === code).length,
          level: levelOf(own.filter((item) => item.category === code).map((item) => item.level)),
        })),
        // A department that records its activities names its data principals there.
        principals: mine.length
          ? unique(mine.flatMap((item) => item.principals))
          : sources
              .filter((source) => principal.has(source))
              .map((source) => sourceLabel(source, nameOf)),
        otherSources: sources
          .filter((source) => source && !principal.has(source))
          .map((source) => sourceLabel(source, nameOf)),
        lawfulBases: unique(mine.flatMap((item) => item.lawfulBases)).map(
          (code) => basisName.get(code) ?? code,
        ),
        systems: unique([
          ...mine.flatMap((item) => item.systems),
          ...own.flatMap((item) => (item.storage ? [item.storage] : [])),
        ]),
        sharedWith: unique(mine.flatMap((item) => item.internalRecipients)).map(
          (code) => nameOf(code) ?? code,
        ),
        recipients: unique(mine.flatMap((item) => [...item.processors, ...item.recipients])),
        transfersAbroad: transfers.includes('yes')
          ? 'yes'
          : transfers.length && transfers.every((item) => item === 'no')
            ? 'no'
            : 'unknown',
        countries: unique(mine.flatMap((item) => (item.countries ? [item.countries] : []))).join(
          '; ',
        ),
        retention: unique(mine.flatMap((item) => (item.retention ? [item.retention] : []))),
      }
    })

    const mapped = records.filter((item) => item.mapped)
    const titles = new Map<string, Level>()
    for (const item of [
      ...elements.map((row) => ({ title: row.title, level: row.level as Level })),
      ...activityElements.map((row) => ({ title: row.title, level: row.level as Level })),
    ]) {
      titles.set(item.title, levelOf([titles.get(item.title) ?? 'L1', item.level]))
    }
    return {
      client,
      releaseVersion: catalogue.releaseVersion,
      records,
      summary: {
        departments: departments.length,
        mapped: mapped.length,
        unmapped: records
          .filter((item) => !item.mapped && item.department.active)
          .map((item) => item.department),
        activities: activities.length,
        elements: titles.size,
        restricted: [...titles.values()].filter((level) => level === 'L4').length,
        categories: new Set(mapped.flatMap((record) => record.categories.map((item) => item.code)))
          .size,
        recipients: new Set(activities.flatMap((item) => [...item.processors, ...item.recipients]))
          .size,
        abroad: activities.filter((item) => item.transfersAbroad === 'yes').length,
        transfersUnknown: activities.filter((item) => item.transfersAbroad === 'unknown').length,
      },
      categories: PERSONAL_DATA_CATEGORIES.filter((category) =>
        mapped.some((record) => record.categories.some((item) => item.code === category.code)),
      ).map((category) => ({ code: category.code, title: category.title, level: category.level })),
    }
  })
}
export type DataMap = Awaited<ReturnType<typeof dataMap>>
export type DataMapRecord = DataMap['records'][number]

const TRANSFER_LABEL: Record<TransferAnswer, string> = {
  no: 'No',
  yes: 'Yes',
  unknown: 'Not yet known',
}
export const transferLabel = (answer: string | null | undefined) =>
  TRANSFER_LABEL[(answer ?? 'unknown') as TransferAnswer] ?? TRANSFER_LABEL.unknown

export const RECORD_OF_PROCESSING_NOTE =
  'The DPDP Act and Rules do not prescribe a record of processing. This one supports the Data Fiduciary’s accountability (s.8(1)), its notices and answers to access requests (s.5, s.11) and, for a Significant Data Fiduciary, the periodic DPIA and audit (s.10(2)).'
