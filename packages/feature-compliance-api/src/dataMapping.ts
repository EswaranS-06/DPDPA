import { authorize, can } from '@duatf/core-access'
import { formatIst, isoDate, sequenceScope } from '@duatf/core-utils'
import {
  and,
  asc,
  clientProfile,
  dataElement,
  department,
  departmentDataElement,
  departmentDataProfile,
  desc,
  eq,
  frameworkRelease,
  inArray,
  lawfulBasis,
  processTemplate,
  tenant,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
import { addTableSheet } from './excel'
import { NotFoundError, optionalText, parseInput, RuleError, ValidationError } from './errors'
import {
  CATEGORY_CODES,
  categoryInfo,
  DATA_SOURCES,
  DEPARTMENT_SOURCE,
  defaultLevel,
  higherLevel,
  LEVEL_INFO,
  LEVELS,
  normaliseCategory,
  PERSONAL_DATA_CATEGORIES,
  sourceLabel,
  suggestFor,
  TRANSFER_ANSWERS,
  type Level,
  type ProcessHint,
  type TransferAnswer,
} from './personalData'
import { newWorkbook, preparedLine, recordExport, toBuffer } from './workbooks'

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

const names = (max: number) =>
  z
    .array(z.string().trim().max(max, 'Too long.'))
    .max(80, 'Too many.')
    .default([])
    .transform((items) => [...new Set(items.filter(Boolean))])

const profileSchema = z.object({
  purposes: optionalText(2000),
  lawfulBases: names(20),
  systems: names(120),
  sharedWith: names(10),
  recipients: names(160),
  transfersAbroad: z.enum(TRANSFER_ANSWERS).default('unknown'),
  countries: optionalText(300),
  retention: optionalText(1000),
  security: optionalText(1000),
})

const dataSchema = z.object({
  elements: z.array(elementSchema).max(300, 'At most 300 data elements.').default([]),
  profile: profileSchema.optional(),
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
 * Replaces a department's data elements and, when given, its processing record. Called inside
 * the client's transaction by the department form and the personal data page.
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
  if (input.profile) {
    const bases = new Set(catalogue.bases.map((row) => row.code))
    const otherCodes = new Set(others.map((row) => row.code))
    const unknownBasis = input.profile.lawfulBases.find((code) => !bases.has(code))
    const unknownDepartment = input.profile.sharedWith.find((code) => !otherCodes.has(code))
    if (unknownBasis || unknownDepartment) {
      throw new ValidationError({
        ...(unknownBasis ? { lawfulBases: `${unknownBasis} is not a lawful basis.` } : {}),
        ...(unknownDepartment ? { sharedWith: `${unknownDepartment} is not a department.` } : {}),
      })
    }
  }
  await tx.delete(departmentDataElement).where(eq(departmentDataElement.departmentId, target.id))
  if (rows.length) {
    await tx
      .insert(departmentDataElement)
      .values(rows.map((row) => ({ ...row, tenantId: clientId, departmentId: target.id })))
  }
  if (input.profile) {
    const profile = {
      purposes: input.profile.purposes ?? null,
      lawfulBases: input.profile.lawfulBases,
      systems: input.profile.systems,
      sharedWith: input.profile.sharedWith,
      recipients: input.profile.recipients,
      transfersAbroad: input.profile.transfersAbroad,
      countries: input.profile.transfersAbroad === 'yes' ? (input.profile.countries ?? null) : null,
      retention: input.profile.retention ?? null,
      security: input.profile.security ?? null,
      updatedBy: ctx.principal.userId,
      updatedAt: new Date(),
    }
    await tx
      .insert(departmentDataProfile)
      .values({ departmentId: target.id, tenantId: clientId, ...profile })
      .onConflictDoUpdate({ target: departmentDataProfile.departmentId, set: profile })
  }
  await audit(tx, ctx, {
    tenantId: clientId,
    action: 'department.data_update',
    entity: 'department',
    entityId: target.code,
    detail: { elements: rows.length, profile: Boolean(input.profile) },
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

/** A department's personal data: its elements, processing record and the choices to edit them. */
export const departmentData = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const all = await departmentsOf(tx, clientId)
    const own = all.find((row) => row.code === code.toUpperCase())
    if (!own) throw new NotFoundError('Department')
    const [elements, [profile], catalogue] = await Promise.all([
      tx
        .select()
        .from(departmentDataElement)
        .where(eq(departmentDataElement.departmentId, own.id))
        .orderBy(asc(departmentDataElement.seq)),
      tx.select().from(departmentDataProfile).where(eq(departmentDataProfile.departmentId, own.id)),
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
      profile: profile ?? null,
      catalogue,
      suggestion: suggestFor(own.name, own.code, catalogue.processes),
      canEdit: can(ctx.principal, 'department.manage', { clientId }),
    }
  })
}
export type DepartmentData = Awaited<ReturnType<typeof departmentData>>

export type FlowKind = 'collected' | 'internal' | 'external' | 'abroad'
export type FlowNode = {
  id: string
  label: string
  kind: 'source' | 'department' | 'recipient' | 'abroad'
}
export type FlowEdge = {
  from: string
  to: string
  kind: FlowKind
  elements: string[]
  level: Level
  note: string | null
}

const UNKNOWN_SOURCE = 'src:unknown'
const ABROAD = 'abroad'
const levelOf = (levels: readonly Level[]): Level =>
  levels.reduce<Level>((top, level) => higherLevel(top, level), 'L1')

/**
 * The client's data map: per department what it holds and from whom, the flows between people,
 * departments, recipients and other countries, and one record of processing per department.
 */
export const dataMap = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [client] = await tx
      .select({ code: tenant.code, name: tenant.name })
      .from(tenant)
      .where(eq(tenant.id, clientId))
    if (!client) throw new NotFoundError('Client')
    const [departments, elements, profiles, catalogue] = await Promise.all([
      departmentsOf(tx, clientId),
      tx
        .select()
        .from(departmentDataElement)
        .where(eq(departmentDataElement.tenantId, clientId))
        .orderBy(asc(departmentDataElement.seq)),
      tx.select().from(departmentDataProfile).where(eq(departmentDataProfile.tenantId, clientId)),
      loadCatalogue(tx, clientId),
    ])
    const nameOf = (code: string) => departments.find((row) => row.code === code)?.name
    const basisName = new Map(catalogue.bases.map((row) => [row.code, row.name]))
    const principal = new Set(
      DATA_SOURCES.filter((row) => row.group === 'principal').map((row) => row.code),
    )

    const records = departments.map((row) => {
      const own = elements
        .filter((item) => item.departmentId === row.id)
        .map((item) => ({ ...item, level: item.level as Level }))
      const profile = profiles.find((item) => item.departmentId === row.id) ?? null
      const sources = [...new Set(own.map((item) => item.source ?? ''))]
      const categoryCodes = CATEGORY_CODES.filter((code) =>
        own.some((item) => item.category === code),
      )
      return {
        department: { ...row, fullCode: sequenceScope('DEP', client.code, row.code) },
        profile,
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
        mapped: own.length > 0,
        level: own.length ? levelOf(own.map((item) => item.level)) : null,
        categories: categoryCodes.map((code) => ({
          code,
          title: categoryInfo(code).title,
          count: own.filter((item) => item.category === code).length,
          level: levelOf(own.filter((item) => item.category === code).map((item) => item.level)),
        })),
        principals: sources
          .filter((source) => principal.has(source))
          .map((source) => sourceLabel(source, nameOf)),
        otherSources: sources
          .filter((source) => source && !principal.has(source))
          .map((source) => sourceLabel(source, nameOf)),
        lawfulBases: (profile?.lawfulBases ?? []).map((code) => basisName.get(code) ?? code),
        systems: [
          ...new Set([
            ...(profile?.systems ?? []),
            ...own.flatMap((item) => (item.storage ? [item.storage] : [])),
          ]),
        ],
        sharedWith: (profile?.sharedWith ?? []).map((code) => nameOf(code) ?? code),
      }
    })

    const nodes = new Map<string, FlowNode>()
    const edges = new Map<string, FlowEdge>()
    const addEdge = (
      from: FlowNode,
      to: FlowNode,
      kind: FlowKind,
      items: { title: string; level: Level }[],
      note: string | null = null,
    ) => {
      nodes.set(from.id, from)
      nodes.set(to.id, to)
      const key = `${from.id}>${to.id}`
      const edge = edges.get(key)
      const titles = [...new Set([...(edge?.elements ?? []), ...items.map((item) => item.title)])]
      const level = levelOf([...(edge ? [edge.level] : []), ...items.map((item) => item.level)])
      edges.set(key, {
        from: from.id,
        to: to.id,
        kind,
        elements: titles,
        level,
        note: edge?.note ?? note,
      })
    }
    const departmentNode = (code: string): FlowNode => ({
      id: `${DEPARTMENT_SOURCE}${code}`,
      label: nameOf(code) ?? code,
      kind: 'department',
    })
    for (const record of records.filter((item) => item.mapped)) {
      const self = departmentNode(record.department.code)
      for (const item of record.elements) {
        const from: FlowNode = !item.source
          ? { id: UNKNOWN_SOURCE, label: 'Source not recorded', kind: 'source' }
          : item.source.startsWith(DEPARTMENT_SOURCE)
            ? departmentNode(item.source.slice(DEPARTMENT_SOURCE.length))
            : { id: `src:${item.source}`, label: item.sourceLabel, kind: 'source' }
        addEdge(from, self, from.kind === 'department' ? 'internal' : 'collected', [item])
      }
      for (const code of record.profile?.sharedWith ?? []) {
        addEdge(self, departmentNode(code), 'internal', record.elements)
      }
      for (const name of record.profile?.recipients ?? []) {
        addEdge(
          self,
          { id: `ext:${name.toLowerCase()}`, label: name, kind: 'recipient' },
          'external',
          record.elements,
        )
      }
      if (record.profile?.transfersAbroad === 'yes') {
        addEdge(
          self,
          { id: ABROAD, label: 'Outside India', kind: 'abroad' },
          'abroad',
          record.elements,
          record.profile.countries,
        )
      }
    }

    const mapped = records.filter((item) => item.mapped)
    const titles = new Map<string, Level>()
    for (const item of mapped.flatMap((record) => record.elements)) {
      titles.set(item.title, levelOf([titles.get(item.title) ?? 'L1', item.level]))
    }
    return {
      client,
      releaseVersion: catalogue.releaseVersion,
      records,
      nodes: [...nodes.values()],
      edges: [...edges.values()],
      summary: {
        departments: departments.length,
        mapped: mapped.length,
        unmapped: records
          .filter((item) => !item.mapped && item.department.active)
          .map((item) => item.department),
        elements: titles.size,
        restricted: [...titles.values()].filter((level) => level === 'L4').length,
        categories: new Set(mapped.flatMap((record) => record.categories.map((item) => item.code)))
          .size,
        recipients: new Set(mapped.flatMap((record) => record.profile?.recipients ?? [])).size,
        abroad: mapped.filter((record) => record.profile?.transfersAbroad === 'yes').length,
        transfersUnknown: mapped.filter(
          (record) => (record.profile?.transfersAbroad ?? 'unknown') === 'unknown',
        ).length,
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

const FLOW_LABEL: Record<FlowKind, string> = {
  collected: 'Collected from',
  internal: 'Shared inside the organisation',
  external: 'Disclosed to a recipient',
  abroad: 'Transferred outside India',
}

const joined = (items: readonly string[]) => items.join('; ')

export const RECORD_OF_PROCESSING_NOTE =
  'The DPDP Act and Rules do not prescribe a record of processing. This one supports the Data Fiduciary’s accountability (s.8(1)), its notices and answers to access requests (s.5, s.11) and, for a Significant Data Fiduciary, the periodic DPIA and audit (s.10(2)).'

/** The record of processing as a workbook: one row per department, the inventory and the flows. */
export const buildRopaWorkbook = async (
  ctx: ServiceContext,
  clientId: string,
): Promise<{ fileName: string; content: Buffer }> => {
  authorize(ctx.principal, 'report.export', { clientId })
  const map = await dataMap(ctx, clientId)
  const workbook = newWorkbook(`${map.client.name} record of processing`)
  const nodeLabel = new Map(map.nodes.map((node) => [node.id, node.label]))

  const about = workbook.addWorksheet('About')
  about.columns = [{ width: 28 }, { width: 100 }]
  const lines: [string, string][] = [
    ['Record of processing', map.client.name],
    ['Client ID', map.client.code],
    ['Departments mapped', `${map.summary.mapped} of ${map.summary.departments}`],
    ['Data elements', String(map.summary.elements)],
    ['Restricted (L4) elements', String(map.summary.restricted)],
    ['Knowledge base', `Release ${map.releaseVersion}`],
    ['Prepared', preparedLine()],
    ['About this record', RECORD_OF_PROCESSING_NOTE],
    [
      'Classification',
      'Categories and levels are DUATF’s working classification (AI-drafted, awaiting ComplyX legal review). See the Categories sheet.',
    ],
  ]
  for (const line of lines) about.addRow(line)
  about.getColumn(1).font = { bold: true }
  about.getColumn(2).alignment = { wrapText: true, vertical: 'top' }

  addTableSheet(
    workbook,
    'RoPA',
    [
      'Department ID',
      'Department',
      'Head or contact',
      'Purposes',
      'Lawful basis',
      'Data principals',
      'Categories of personal data',
      'Data elements',
      'Restricted (L4) elements',
      'Other sources',
      'Systems and storage',
      'Shared with departments',
      'Recipients outside the organisation',
      'Transfers outside India',
      'Countries',
      'Retention',
      'Security measures',
      'Last updated',
    ],
    map.records
      .filter((record) => record.mapped || record.profile)
      .map((record) => [
        record.department.fullCode,
        record.department.name,
        record.department.headName,
        record.profile?.purposes ?? null,
        joined(record.lawfulBases),
        joined(record.principals),
        joined(record.categories.map((item) => `${item.title} (${item.level})`)),
        joined(record.elements.map((item) => item.title)),
        joined(record.elements.filter((item) => item.level === 'L4').map((item) => item.title)),
        joined(record.otherSources),
        joined(record.systems),
        joined(record.sharedWith),
        joined(record.profile?.recipients ?? []),
        transferLabel(record.profile?.transfersAbroad),
        record.profile?.countries ?? null,
        record.profile?.retention ?? null,
        record.profile?.security ?? null,
        record.profile ? formatIst(record.profile.updatedAt) : null,
      ]),
    [14, 22, 18, 40, 26, 28, 40, 50, 34, 24, 30, 24, 30, 14, 18, 30, 34, 18],
  )

  addTableSheet(
    workbook,
    'Data inventory',
    [
      'Department ID',
      'Department',
      'Element code',
      'Data element',
      'Category',
      'Level',
      'From',
      'Stored in',
      'Security',
      'Access',
    ],
    map.records.flatMap((record) =>
      record.elements.map((item) => [
        record.department.fullCode,
        record.department.name,
        item.code,
        item.title,
        item.categoryTitle,
        `${item.level} ${LEVEL_INFO[item.level].label}`,
        item.sourceLabel,
        item.storage,
        item.security,
        item.access,
      ]),
    ),
    [14, 22, 13, 40, 30, 16, 28, 26, 30, 24],
  )

  addTableSheet(
    workbook,
    'Data flows',
    ['From', 'To', 'Flow', 'Highest level', 'Data elements', 'Note'],
    map.edges.map((edge) => [
      nodeLabel.get(edge.from) ?? edge.from,
      nodeLabel.get(edge.to) ?? edge.to,
      FLOW_LABEL[edge.kind],
      `${edge.level} ${LEVEL_INFO[edge.level].label}`,
      joined(edge.elements),
      edge.note,
    ]),
    [28, 28, 30, 16, 60, 24],
  )

  addTableSheet(
    workbook,
    'Categories',
    ['Category', 'What it covers', 'Examples', 'Default level'],
    PERSONAL_DATA_CATEGORIES.map((category) => [
      category.title,
      category.description,
      category.examples,
      `${category.level} ${LEVEL_INFO[category.level].label}`,
    ]),
    [34, 60, 60, 16],
  )

  const content = await toBuffer(workbook)
  await recordExport(ctx, clientId, 'record-of-processing', {
    departments: map.summary.mapped,
    elements: map.summary.elements,
  })
  return {
    fileName: `${map.client.code}-record-of-processing-${isoDate(new Date())}.xlsx`,
    content,
  }
}
