import { createHash } from 'node:crypto'
import { authorize } from '@duatf/core-access'
import { formatIst, isoDate } from '@duatf/core-utils'
import {
  and,
  departmentDataElement,
  eq,
  max,
  processingActivity,
  tenant,
  type Transaction,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { audit, inClient, type ServiceContext } from './context'
import { FLOW_KIND_LABEL } from './dataFlow'
import { addTableSheet } from './excel'
import { XL } from './excel'
import { RuleError } from './errors'
import {
  categoryInfo,
  DATA_SOURCES,
  DEPARTMENT_SOURCE,
  LEVEL_INFO,
  LEVELS,
  PERSONAL_DATA_CATEGORIES,
  type Level,
} from './personalData'
import {
  activityRows,
  dataFlowOf,
  ownerOptions,
  parseRef,
  refLabel,
  ropaScope,
  writeActivity,
  type ActivityRow,
  type RopaScope,
} from './ropa'
import {
  ACTIVITY_LABELS,
  changedFields,
  elementMatcher,
  matcherOf,
  normaliseActivity,
  spellingKey,
  TRANSFER_TEXT,
  type ActivityValues,
  type RawActivity,
  type RopaAnswer,
} from './ropaKb'
import { newWorkbook, preparedLine, recordExport, toBuffer } from './workbooks'

// The RoPA and data element workbooks (ADR-0008). Exported with dropdowns drawn from the
// knowledge base, edited in Excel, and imported back: DUATF shows what will change, and saves
// only when the same file is confirmed.

export type ImportKind = 'ropa' | 'elements'

export type ImportIssue = { row: number; field: string; message: string }
export type ImportChange = {
  row: number
  action: 'create' | 'update' | 'remove'
  label: string
  detail: string
}
export type ImportPlan = {
  kind: ImportKind
  /** A problem with the file as a whole; nothing else is read. */
  fatal: string | null
  counts: { create: number; update: number; remove: number; unchanged: number }
  changes: ImportChange[]
  errors: ImportIssue[]
  warnings: ImportIssue[]
  /** Identifies this exact set of changes; applying needs the same file. */
  fingerprint: string
}

const SHEETS = { readMe: 'Read me', ropa: 'RoPA', elements: 'Data elements', lists: 'Lists' }
const MULTI_PROMPT = 'Pick one, or type several separated by semicolons (;).'
const EXTRA_ROWS = 200

type Mode = 'strict' | 'pick' | 'multi'
type ListColumn = { title: string; values: string[] }

const solid = (argb: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
})

/** Column letters A, B, ... AA for a 1-based column number. */
const letter = (column: number): string =>
  column <= 26
    ? String.fromCharCode(64 + column)
    : `${letter(Math.floor((column - 1) / 26))}${letter(((column - 1) % 26) + 1)}`

/** Where each list will sit on the Lists sheet, for the dropdowns that point at it. */
const listRanges = (lists: ListColumn[]) =>
  new Map(
    lists.flatMap((list, index) =>
      list.values.length
        ? [
            [
              list.title,
              `'${SHEETS.lists}'!$${letter(index + 1)}$2:$${letter(index + 1)}$${list.values.length + 1}`,
            ] as const,
          ]
        : [],
    ),
  )

/** The Lists sheet: one column per dropdown. */
const listsSheet = (workbook: ExcelJS.Workbook, lists: ListColumn[]) => {
  const sheet = workbook.addWorksheet(SHEETS.lists, { views: [{ state: 'frozen', ySplit: 1 }] })
  lists.forEach((list, index) => {
    sheet.getColumn(index + 1).width = Math.min(
      60,
      Math.max(18, ...list.values.map((value) => value.length + 2)),
    )
    const head = sheet.getCell(1, index + 1)
    head.value = list.title
    head.font = { bold: true, color: { argb: XL.white } }
    head.fill = solid(XL.accent)
    list.values.forEach((value, at) => {
      sheet.getCell(at + 2, index + 1).value = value
    })
  })
  sheet.getCell(1, lists.length + 2).value =
    'These are the answers the dropdowns offer, from DUATF’s knowledge base. Change them in DUATF, not here.'
}

/** The worksheet's data validations, which ExcelJS's types leave out. */
type ValidationList = {
  add: (address: string, validation: ExcelJS.DataValidation) => void
}
const validationsOf = (sheet: ExcelJS.Worksheet) =>
  (sheet as unknown as { dataValidations: ValidationList }).dataValidations

type SheetColumn = {
  header: string
  width: number
  list?: string
  mode?: Mode
  locked?: boolean
  prompt?: string
}

/** A data sheet with its header, rows and a dropdown on every cell of a list column. */
const dataSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  columns: SheetColumn[],
  rows: (string | null)[][],
  ranges: Map<string, string>,
) => {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] })
  sheet.columns = columns.map((column) => ({ header: column.header, width: column.width }))
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: XL.white } }
  header.fill = solid(XL.accent)
  header.alignment = { vertical: 'middle', wrapText: true }
  header.height = 30
  for (const row of rows) sheet.addRow(row)
  const last = rows.length + 1 + EXTRA_ROWS
  columns.forEach((column, index) => {
    for (let at = 2; at <= last; at += 1) {
      const cell = sheet.getCell(at, index + 1)
      cell.alignment = { vertical: 'top', wrapText: true }
      if (column.locked) {
        cell.fill = solid(XL.folio)
        cell.font = { color: { argb: XL.pencil } }
      }
    }
    const range = column.list ? ranges.get(column.list) : undefined
    if (!range) return
    // One range per column. Set cell by cell, ExcelJS merges the cells into overlapping ranges
    // (it sorts C10 before C2), which Excel reports as damaged.
    validationsOf(sheet).add(`${letter(index + 1)}2:${letter(index + 1)}${last}`, {
      type: 'list',
      allowBlank: true,
      formulae: [range],
      showErrorMessage: column.mode === 'strict',
      errorStyle: 'stop',
      errorTitle: column.header,
      error: `Choose ${column.header} from the list.`,
      showInputMessage: true,
      promptTitle: column.header,
      prompt: column.prompt ?? (column.mode === 'multi' ? MULTI_PROMPT : 'Choose from the list.'),
    })
  })
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  return sheet
}

/** The Read me sheet: what the file is, whose it is, and how to fill it. */
const readMeSheet = (
  workbook: ExcelJS.Workbook,
  title: string,
  client: { code: string; name: string },
  release: string,
  steps: string[],
  fields: RopaAnswer[],
) => {
  const sheet = workbook.addWorksheet(SHEETS.readMe)
  sheet.columns = [{ width: 26 }, { width: 70 }, { width: 40 }, { width: 40 }]
  sheet.addRow([title]).font = { bold: true, size: 14 }
  sheet.addRow([])
  for (const [label, value] of [
    ['Client', client.name],
    ['Client ID', client.code],
    ['Knowledge base', `Release ${release}`],
    ['Prepared', preparedLine()],
  ] as const) {
    const row = sheet.addRow([label, value])
    row.getCell(1).font = { bold: true }
  }
  sheet.addRow([])
  sheet.addRow(['How to use this workbook']).font = { bold: true }
  steps.forEach((step, index) => {
    const row = sheet.addRow([`${index + 1}.`, step])
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' }
  })
  if (fields.length) {
    sheet.addRow([])
    const head = sheet.addRow(['Field', 'What to record', 'Example', 'Answers from'])
    head.font = { bold: true }
    for (const field of fields) {
      const row = sheet.addRow([
        field.value,
        field.meaning ?? '',
        field.extra.Example ?? '',
        field.extra['Answers from'] ?? '',
      ])
      row.alignment = { wrapText: true, vertical: 'top' }
    }
  }
  return sheet
}

const clientOf = async (tx: Transaction, clientId: string) => {
  const [row] = await tx
    .select({ code: tenant.code, name: tenant.name })
    .from(tenant)
    .where(eq(tenant.id, clientId))
  if (!row) throw new RuleError('The client was not found.')
  return row
}

const joined = (items: readonly string[]) => items.join('; ')

// --- RoPA workbook -----------------------------------------------------------------------------

const ROPA_COLUMNS: (SheetColumn & {
  key: keyof ActivityValues | 'ref' | 'updatedAt' | 'remove'
})[] = [
  {
    key: 'ref',
    header: 'Activity ID',
    width: 11,
    locked: true,
    prompt: 'Set by DUATF. Leave blank on a new row.',
  },
  { key: 'name', header: 'Processing activity', width: 30 },
  { key: 'departmentCode', header: 'Department', width: 22, list: 'Departments', mode: 'strict' },
  {
    key: 'templateCode',
    header: 'Catalogue process',
    width: 34,
    list: 'Catalogue processes',
    mode: 'strict',
  },
  { key: 'purpose', header: 'Purpose', width: 36 },
  { key: 'lawfulBases', header: 'Lawful basis', width: 32, list: 'Lawful bases', mode: 'multi' },
  { key: 'lawReference', header: 'Law relied on', width: 24 },
  {
    key: 'principals',
    header: 'Data principals',
    width: 26,
    list: 'Data principals',
    mode: 'multi',
  },
  { key: 'elements', header: 'Personal data', width: 44, list: 'Personal data', mode: 'multi' },
  { key: 'sources', header: 'Source of data', width: 28, list: 'Sources', mode: 'multi' },
  { key: 'systems', header: 'Systems', width: 24, list: 'Systems', mode: 'multi' },
  {
    key: 'internalRecipients',
    header: 'Internal recipients',
    width: 24,
    list: 'Departments',
    mode: 'multi',
  },
  {
    key: 'processors',
    header: 'Processors',
    width: 28,
    list: 'Processors and recipients',
    mode: 'multi',
  },
  {
    key: 'recipients',
    header: 'Other recipients',
    width: 28,
    list: 'Processors and recipients',
    mode: 'multi',
  },
  {
    key: 'retention',
    header: 'Retention period',
    width: 34,
    list: 'Retention periods',
    mode: 'pick',
  },
  { key: 'deletion', header: 'Deletion', width: 30, list: 'Deletion', mode: 'strict' },
  {
    key: 'security',
    header: 'Security measures',
    width: 34,
    list: 'Security measures',
    mode: 'multi',
  },
  {
    key: 'transfersAbroad',
    header: 'Cross-border transfer',
    width: 16,
    list: 'Cross-border transfer',
    mode: 'strict',
  },
  { key: 'countries', header: 'Countries', width: 22 },
  {
    key: 'consentStatus',
    header: 'Consent status',
    width: 26,
    list: 'Consent status',
    mode: 'strict',
  },
  { key: 'owner', header: 'Owner or DPO contact', width: 30, list: 'Owners', mode: 'pick' },
  { key: 'notes', header: 'Notes', width: 34 },
  { key: 'updatedAt', header: 'Last updated', width: 18, locked: true, prompt: 'Set by DUATF.' },
  {
    key: 'remove',
    header: 'Remove',
    width: 10,
    list: 'Remove',
    mode: 'strict',
    prompt: 'Choose Remove to delete this activity on import.',
  },
]

const processLabel = (scope: RopaScope, code: string | null) => {
  const process = code ? scope.kb.processes.find((row) => row.code === code) : undefined
  return process ? `${process.code} ${process.title}` : (code ?? '')
}

/** One activity as the RoPA sheet shows it. */
const ropaCells = (row: ActivityRow, scope: RopaScope): (string | null)[] => {
  const names = new Map(scope.kb.elements.map((item) => [item.code, item.name]))
  const departments = new Map(scope.departmentRows.map((item) => [item.code, item.name]))
  const bases = new Map(scope.kb.bases.map((item) => [item.code, item.label]))
  const cell: Record<(typeof ROPA_COLUMNS)[number]['key'], string | null> = {
    ref: row.refLabel,
    name: row.name,
    departmentCode: row.departmentName,
    templateCode: processLabel(scope, row.templateCode),
    purpose: row.purpose,
    lawfulBases: joined(row.lawfulBases.map((code) => bases.get(code) ?? code)),
    lawReference: row.lawReference,
    principals: joined(row.principals),
    elements: joined(
      row.elements.map((item) => (item.code ? names.get(item.code) : null) ?? item.title),
    ),
    sources: joined(row.sources),
    systems: joined(row.systems),
    internalRecipients: joined(row.internalRecipients.map((code) => departments.get(code) ?? code)),
    processors: joined(row.processors),
    recipients: joined(row.recipients),
    retention: row.retention,
    deletion: row.deletion,
    security: joined(row.security),
    transfersAbroad: TRANSFER_TEXT[row.transfersAbroad],
    countries: row.countries,
    consentStatus: row.consentStatus,
    owner: row.owner,
    notes: row.notes,
    updatedAt: formatIst(row.updatedAt),
    remove: null,
  }
  return ROPA_COLUMNS.map((column) => cell[column.key])
}

const ropaLists = (scope: RopaScope, owners: string[]): ListColumn[] => {
  const values = (answers: readonly RopaAnswer[]) => answers.map((answer) => answer.value)
  return [
    {
      title: 'Departments',
      values: scope.departmentRows.filter((row) => row.active).map((row) => row.name),
    },
    {
      title: 'Catalogue processes',
      values: scope.kb.processes.map((row) => `${row.code} ${row.title}`),
    },
    { title: 'Lawful bases', values: scope.kb.bases.map((row) => row.label) },
    { title: 'Data principals', values: values(scope.kb.lists.principals) },
    {
      title: 'Personal data',
      values: scope.kb.elements.filter((row) => row.personalData).map((row) => row.name),
    },
    { title: 'Sources', values: values(scope.kb.lists.sources) },
    { title: 'Systems', values: values(scope.kb.lists.systems) },
    { title: 'Processors and recipients', values: values(scope.kb.lists.recipients) },
    {
      title: 'Retention periods',
      values: [...values(scope.kb.lists.retention), ...values(scope.kb.sectorRetention)],
    },
    { title: 'Deletion', values: values(scope.kb.lists.deletion) },
    { title: 'Security measures', values: values(scope.kb.lists.security) },
    { title: 'Cross-border transfer', values: Object.values(TRANSFER_TEXT) },
    { title: 'Consent status', values: values(scope.kb.lists.consent) },
    { title: 'Owners', values: owners },
    { title: 'Remove', values: ['Remove'] },
  ]
}

/**
 * The data flow diagram as a table: one row per flow between a party, an activity, a system or a
 * recipient. Read only; the import reads the RoPA sheet.
 */
const flowsSheet = (workbook: ExcelJS.Workbook, rows: ActivityRow[], scope: RopaScope) => {
  const graph = dataFlowOf({ activities: rows, departments: scope.departmentRows, kb: scope.kb })
  const label = new Map(graph.nodes.map((node) => [node.id, node.label]))
  addTableSheet(
    workbook,
    'Data flows',
    ['From', 'To', 'Flow', 'Highest level', 'Personal data', 'Activities', 'Countries'],
    graph.edges.map((edge) => [
      label.get(edge.source) ?? edge.source,
      label.get(edge.target) ?? edge.target,
      FLOW_KIND_LABEL[edge.kind],
      `${edge.level} ${LEVEL_INFO[edge.level].label}`,
      edge.elements.join('; '),
      edge.activities.join('; '),
      edge.note,
    ]),
    [30, 30, 26, 18, 60, 24, 24],
  )
}

const ROPA_STEPS = [
  'One row per processing activity. Keep the Activity ID of an existing row; leave it blank on a new row and DUATF numbers it.',
  'Cells with a dropdown take their answers from DUATF’s knowledge base. Where a field takes several answers (lawful basis, data principals, personal data, sources, systems, recipients, security), pick one or type several separated by semicolons (;).',
  'Department, catalogue process, deletion, cross-border transfer and consent status must be one of the listed answers. Systems, processors, recipients, retention and owner can also be typed.',
  'To delete an activity, choose Remove in the last column. Deleting a row from the sheet does not delete the activity.',
  'Import the file on the Data mapping page (Record of processing, Import). DUATF lists every change before anything is saved.',
  'Keep the sheet names and column headings as they are.',
]

/** The process-focused record of processing, ready to edit and import back. */
export const buildRopaWorkbook = async (
  ctx: ServiceContext,
  clientId: string,
): Promise<{ fileName: string; content: Buffer }> => {
  authorize(ctx.principal, 'report.export', { clientId })
  const owners = await ownerOptions(ctx, clientId)
  const { client, scope, rows } = await inClient(ctx, clientId, async (tx) => {
    const scope = await ropaScope(tx, clientId)
    return {
      client: await clientOf(tx, clientId),
      scope,
      rows: await activityRows(tx, clientId, scope),
    }
  })
  const workbook = newWorkbook(`${client.name} record of processing`)
  readMeSheet(
    workbook,
    'Record of processing (RoPA)',
    client,
    scope.kb.releaseVersion,
    ROPA_STEPS,
    scope.kb.lists.fields,
  )
  const lists = ropaLists(scope, owners)
  dataSheet(
    workbook,
    SHEETS.ropa,
    ROPA_COLUMNS,
    rows.map((row) => ropaCells(row, scope)),
    listRanges(lists),
  )
  flowsSheet(workbook, rows, scope)
  listsSheet(workbook, lists)
  workbook.views = [
    { x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 1, visibility: 'visible' },
  ]
  const content = await toBuffer(workbook)
  await recordExport(ctx, clientId, 'record-of-processing', { activities: rows.length })
  return { fileName: `${client.code}-RoPA-${isoDate(new Date())}.xlsx`, content }
}

// --- Data element workbook ---------------------------------------------------------------------

const ELEMENT_COLUMNS: (SheetColumn & { key: string })[] = [
  { key: 'department', header: 'Department', width: 22, list: 'Departments', mode: 'strict' },
  {
    key: 'title',
    header: 'Data element',
    width: 44,
    list: 'Data elements',
    mode: 'pick',
    prompt:
      'Choose from the list, or type the department’s own data element and give its category.',
  },
  {
    key: 'code',
    header: 'Code',
    width: 12,
    locked: true,
    prompt: 'Set by DUATF from the knowledge base.',
  },
  { key: 'category', header: 'Category', width: 32, list: 'Categories', mode: 'strict' },
  { key: 'level', header: 'Level', width: 16, list: 'Levels', mode: 'strict' },
  { key: 'source', header: 'Comes from', width: 30, list: 'Comes from', mode: 'strict' },
  { key: 'storage', header: 'Stored in', width: 26 },
  { key: 'security', header: 'Security', width: 30 },
  { key: 'access', header: 'Access', width: 24 },
  {
    key: 'remove',
    header: 'Remove',
    width: 10,
    list: 'Remove',
    mode: 'strict',
    prompt: 'Choose Remove to take this data element off the department.',
  },
]

const levelText = (level: Level) => `${level} ${LEVEL_INFO[level].label}`
const fromDepartment = (name: string) => `Another department: ${name}`

const elementSourceLabel = (source: string | null, departments: Map<string, string>) => {
  if (!source) return null
  if (source.startsWith(DEPARTMENT_SOURCE)) {
    const code = source.slice(DEPARTMENT_SOURCE.length)
    return fromDepartment(departments.get(code) ?? code)
  }
  return DATA_SOURCES.find((row) => row.code === source)?.label ?? source
}

type InventoryRow = {
  id: string
  departmentId: string
  departmentCode: string
  departmentName: string
  code: string | null
  title: string
  category: string
  level: Level
  source: string | null
  storage: string | null
  security: string | null
  access: string | null
}

const inventoryRows = async (
  tx: Transaction,
  clientId: string,
  scope: RopaScope,
): Promise<InventoryRow[]> => {
  const rows = await tx
    .select()
    .from(departmentDataElement)
    .where(eq(departmentDataElement.tenantId, clientId))
  const departments = new Map(scope.departmentRows.map((row) => [row.id, row]))
  return rows
    .map((row) => {
      const owner = departments.get(row.departmentId)
      return {
        id: row.id,
        departmentId: row.departmentId,
        departmentCode: owner?.code ?? '',
        departmentName: owner?.name ?? '',
        code: row.elementCode,
        title: row.title,
        category: row.category,
        level: row.level as Level,
        source: row.source,
        storage: row.storage,
        security: row.security,
        access: row.access,
        seq: row.seq,
      }
    })
    .sort((a, b) => a.departmentCode.localeCompare(b.departmentCode) || a.seq - b.seq)
}

const sourceChoices = (scope: RopaScope) => [
  ...DATA_SOURCES.map((row) => row.label),
  ...scope.departmentRows.filter((row) => row.active).map((row) => fromDepartment(row.name)),
]

const ELEMENT_STEPS = [
  'One row per data element a department holds. To add one, add a row: choose the department and the data element, or type the department’s own and give its category.',
  'Category, level and where it comes from must be one of the listed answers; the level defaults to the knowledge base’s.',
  'To take a data element off a department, choose Remove in the last column. Deleting a row from the sheet does not remove it.',
  'Import the file on the Data mapping page (Data elements, Import). DUATF lists every change before anything is saved.',
  'Keep the sheet names and column headings as they are.',
]

/** Every department's data elements, ready to edit and import back. */
export const buildDataElementWorkbook = async (
  ctx: ServiceContext,
  clientId: string,
): Promise<{ fileName: string; content: Buffer }> => {
  authorize(ctx.principal, 'report.export', { clientId })
  const { client, scope, rows } = await inClient(ctx, clientId, async (tx) => {
    const scope = await ropaScope(tx, clientId)
    return {
      client: await clientOf(tx, clientId),
      scope,
      rows: await inventoryRows(tx, clientId, scope),
    }
  })
  const names = new Map(scope.departmentRows.map((row) => [row.code, row.name]))
  const workbook = newWorkbook(`${client.name} data elements`)
  readMeSheet(
    workbook,
    'Data elements by department',
    client,
    scope.kb.releaseVersion,
    ELEMENT_STEPS,
    [],
  )
  const lists: ListColumn[] = [
    {
      title: 'Departments',
      values: scope.departmentRows.filter((row) => row.active).map((row) => row.name),
    },
    { title: 'Data elements', values: scope.kb.elements.map((row) => row.title) },
    { title: 'Categories', values: PERSONAL_DATA_CATEGORIES.map((row) => row.title) },
    { title: 'Levels', values: LEVELS.map(levelText) },
    { title: 'Comes from', values: sourceChoices(scope) },
    { title: 'Remove', values: ['Remove'] },
  ]
  dataSheet(
    workbook,
    SHEETS.elements,
    ELEMENT_COLUMNS,
    rows.map((row) => [
      row.departmentName,
      row.title,
      row.code,
      categoryInfo(row.category).title,
      levelText(row.level),
      elementSourceLabel(row.source, names),
      row.storage,
      row.security,
      row.access,
      null,
    ]),
    listRanges(lists),
  )
  listsSheet(workbook, lists)
  workbook.views = [
    { x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 1, visibility: 'visible' },
  ]
  const content = await toBuffer(workbook)
  await recordExport(ctx, clientId, 'data-elements', { elements: rows.length })
  return { fileName: `${client.code}-data-elements-${isoDate(new Date())}.xlsx`, content }
}

// --- Reading a workbook back ---------------------------------------------------------------------

type SheetRow = { row: number; cells: Map<string, string> }

const cellText = (cell: ExcelJS.Cell) => {
  const value = cell.value
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return isoDate(value)
  return (cell.text ?? '').trim()
}

/** Rows of a sheet keyed by heading; an empty row is skipped. */
const readSheet = (sheet: ExcelJS.Worksheet, headers: readonly string[]) => {
  const byKey = new Map(headers.map((header) => [spellingKey(header), header]))
  const columns = new Map<number, string>()
  sheet.getRow(1).eachCell((cell, column) => {
    const header = byKey.get(spellingKey(cellText(cell)))
    if (header) columns.set(column, header)
  })
  const rows: SheetRow[] = []
  sheet.eachRow((row, index) => {
    if (index === 1) return
    const cells = new Map<string, string>()
    for (const [column, header] of columns) {
      const value = cellText(row.getCell(column))
      if (value) cells.set(header, value)
    }
    if (cells.size) rows.push({ row: index, cells })
  })
  return { found: new Set(columns.values()), rows }
}

const clientIdOf = (workbook: ExcelJS.Workbook) => {
  const sheet = workbook.getWorksheet(SHEETS.readMe)
  let code = ''
  sheet?.eachRow((row) => {
    if (cellText(row.getCell(1)) === 'Client ID') code = cellText(row.getCell(2))
  })
  return code
}

const loadWorkbook = async (content: Buffer) => {
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(content as unknown as ArrayBuffer)
  } catch {
    return null
  }
  return workbook
}

const emptyPlan = (kind: ImportKind, fatal: string): ImportPlan => ({
  kind,
  fatal,
  counts: { create: 0, update: 0, remove: 0, unchanged: 0 },
  changes: [],
  errors: [],
  warnings: [],
  fingerprint: '',
})

const fingerprintOf = (work: unknown) =>
  createHash('sha256').update(JSON.stringify(work)).digest('hex').slice(0, 32)

const isRemove = (value: string | undefined) => /^(remove|yes|delete)$/i.test(value ?? '')

type RopaWork =
  | { action: 'create'; row: number; values: ActivityValues }
  | { action: 'update'; row: number; ref: number; values: ActivityValues }
  | { action: 'remove'; row: number; ref: number }

/** Reads a RoPA workbook into the changes it would make. */
const planRopa = (
  workbook: ExcelJS.Workbook,
  scope: RopaScope,
  existing: ActivityRow[],
): { plan: ImportPlan; work: RopaWork[] } => {
  const sheet = workbook.getWorksheet(SHEETS.ropa)
  if (!sheet)
    return {
      plan: emptyPlan(
        'ropa',
        'The file has no RoPA sheet. Export the RoPA workbook from DUATF and fill that in.',
      ),
      work: [],
    }
  const headers = ROPA_COLUMNS.map((column) => column.header)
  const { found, rows } = readSheet(sheet, headers)
  const missing = ['Processing activity', 'Department'].filter((header) => !found.has(header))
  if (missing.length) {
    return {
      plan: emptyPlan('ropa', `The RoPA sheet has no ${missing.join(' or ')} column.`),
      work: [],
    }
  }
  const plan = emptyPlan('ropa', '')
  plan.fatal = null
  const work: RopaWork[] = []
  const byRef = new Map(existing.map((row) => [row.ref, row]))
  const seenRefs = new Set<number>()
  const seenNames = new Set<string>()
  for (const { row, cells } of rows) {
    const get = (header: string) => cells.get(header)
    const issue = (list: ImportIssue[], field: string, message: string) =>
      list.push({ row, field, message })
    const idText = get('Activity ID')
    const ref = idText ? parseRef(idText) : null
    const current = ref === null ? undefined : byRef.get(ref)
    if (idText && !current) {
      issue(
        plan.errors,
        'Activity ID',
        `${idText} is not an activity of this client. Clear the Activity ID to add the row as a new activity.`,
      )
      continue
    }
    if (ref !== null && seenRefs.has(ref)) {
      issue(plan.errors, 'Activity ID', `${refLabel(ref)} appears on more than one row.`)
      continue
    }
    if (ref !== null) seenRefs.add(ref)
    if (isRemove(get('Remove'))) {
      if (current) {
        work.push({ action: 'remove', row, ref: current.ref })
        plan.changes.push({
          row,
          action: 'remove',
          label: `${current.refLabel} ${current.name}`,
          detail: 'Removed',
        })
      } else {
        issue(plan.warnings, 'Remove', 'A new row marked Remove is ignored.')
      }
      continue
    }
    const raw: RawActivity = {
      department: get('Department'),
      name: get('Processing activity'),
      templateCode: get('Catalogue process'),
      purpose: get('Purpose'),
      lawfulBases: get('Lawful basis'),
      lawReference: get('Law relied on'),
      principals: get('Data principals'),
      elements: get('Personal data'),
      sources: get('Source of data'),
      systems: get('Systems'),
      internalRecipients: get('Internal recipients'),
      processors: get('Processors'),
      recipients: get('Other recipients'),
      retention: get('Retention period'),
      deletion: get('Deletion'),
      security: get('Security measures'),
      transfersAbroad: get('Cross-border transfer'),
      countries: get('Countries'),
      consentStatus: get('Consent status'),
      owner: get('Owner or DPO contact'),
      notes: get('Notes'),
    }
    // A column left out of the file keeps the stored answer.
    if (current) {
      for (const column of ROPA_COLUMNS) {
        if (found.has(column.header) || !(column.key in ACTIVITY_LABELS)) continue
        const key = column.key as keyof ActivityValues
        ;(raw as Record<string, unknown>)[rawKey(key)] = storedRaw(current, key)
      }
    }
    const { values, errors, warnings } = normaliseActivity(raw, scope)
    for (const [field, message] of Object.entries(errors))
      issue(plan.errors, ACTIVITY_LABELS[field as keyof ActivityValues], message)
    // Text kept as typed is worth a warning only where the import changes it.
    const warn = (fields: readonly string[]) => {
      for (const [field, message] of Object.entries(warnings)) {
        if (fields.includes(field)) {
          issue(plan.warnings, ACTIVITY_LABELS[field as keyof ActivityValues], message)
        }
      }
    }
    if (Object.keys(errors).length) continue
    const nameKey = `${values.departmentCode}:${values.name.toLowerCase()}`
    if (seenNames.has(nameKey)) {
      issue(
        plan.errors,
        'Processing activity',
        `“${values.name}” appears twice for the same department.`,
      )
      continue
    }
    seenNames.add(nameKey)
    const clash = existing.find(
      (item) =>
        item.departmentCode === values.departmentCode &&
        item.name.toLowerCase() === values.name.toLowerCase() &&
        item.ref !== current?.ref,
    )
    if (
      clash &&
      !(
        seenRefs.has(clash.ref) ||
        work.some((item) => item.action === 'remove' && item.ref === clash.ref)
      )
    ) {
      issue(
        plan.errors,
        'Processing activity',
        `${clash.departmentName} already has “${values.name}” (${clash.refLabel}).`,
      )
      continue
    }
    if (current) {
      const fields = changedFields(current, values)
      if (fields.length === 0) {
        plan.counts.unchanged += 1
        continue
      }
      warn(fields)
      work.push({ action: 'update', row, ref: current.ref, values })
      plan.changes.push({
        row,
        action: 'update',
        label: `${current.refLabel} ${values.name}`,
        detail: `Changes ${fields.map((field) => ACTIVITY_LABELS[field]).join(', ')}`,
      })
    } else {
      warn(Object.keys(warnings))
      work.push({ action: 'create', row, values })
      plan.changes.push({
        row,
        action: 'create',
        label: values.name,
        detail: `New activity of ${scope.departmentRows.find((item) => item.code === values.departmentCode)?.name ?? values.departmentCode}`,
      })
    }
  }
  plan.counts.create = work.filter((item) => item.action === 'create').length
  plan.counts.update = work.filter((item) => item.action === 'update').length
  plan.counts.remove = work.filter((item) => item.action === 'remove').length
  plan.fingerprint = fingerprintOf(work)
  return { plan, work }
}

const rawKey = (key: keyof ActivityValues): keyof RawActivity =>
  key === 'departmentCode' ? 'department' : key

/** A stored answer in the form the normaliser takes back unchanged. */
const storedRaw = (row: ActivityRow, key: keyof ActivityValues): unknown => {
  if (key === 'elements')
    return row.elements.map((item) =>
      item.code
        ? { code: item.code }
        : { title: item.title, category: item.category, level: item.level },
    )
  return row[key]
}

type ElementWork =
  | { action: 'create'; row: number; departmentId: string; values: ElementValues }
  | { action: 'update'; row: number; id: string; values: ElementValues }
  | { action: 'remove'; row: number; id: string }

type ElementValues = {
  code: string | null
  title: string
  category: string
  level: Level
  source: string | null
  storage: string | null
  security: string | null
  access: string | null
}

const elementColumns = (values: ElementValues) => ({
  elementCode: values.code,
  title: values.title,
  category: values.category,
  level: values.level,
  source: values.source,
  storage: values.storage,
  security: values.security,
  access: values.access,
})

/** Reads a data element workbook into the changes it would make. */
const planElements = (
  workbook: ExcelJS.Workbook,
  scope: RopaScope,
  existing: InventoryRow[],
): { plan: ImportPlan; work: ElementWork[] } => {
  const sheet = workbook.getWorksheet(SHEETS.elements)
  if (!sheet)
    return {
      plan: emptyPlan(
        'elements',
        'The file has no Data elements sheet. Export the data element workbook from DUATF and fill that in.',
      ),
      work: [],
    }
  const { found, rows } = readSheet(
    sheet,
    ELEMENT_COLUMNS.map((column) => column.header),
  )
  const missing = ['Department', 'Data element'].filter((header) => !found.has(header))
  if (missing.length) {
    return {
      plan: emptyPlan('elements', `The Data elements sheet has no ${missing.join(' or ')} column.`),
      work: [],
    }
  }
  const plan = emptyPlan('elements', '')
  plan.fatal = null
  const work: ElementWork[] = []
  const departmentMatch = matcherOf(scope.departmentRows.map((row) => [row.code, [row.name]]))
  const match = elementMatcher(scope.kb)
  const byCode = new Map(scope.kb.elements.map((row) => [row.code, row]))
  const categoryMatch = matcherOf(PERSONAL_DATA_CATEGORIES.map((row) => [row.code, [row.title]]))
  const levelMatch = matcherOf(
    LEVELS.map((level) => [level, [levelText(level), LEVEL_INFO[level].label]]),
  )
  const sourceMatch = matcherOf([
    ...DATA_SOURCES.map((row): [string, string[]] => [row.code, [row.label]]),
    ...scope.departmentRows.map((row): [string, string[]] => [
      `${DEPARTMENT_SOURCE}${row.code}`,
      [fromDepartment(row.name), fromDepartment(row.code), row.name],
    ]),
  ])
  const seen = new Set<string>()
  for (const { row, cells } of rows) {
    const get = (header: string) => cells.get(header) ?? ''
    const issue = (list: ImportIssue[], field: string, message: string) =>
      list.push({ row, field, message })
    const departmentCode = departmentMatch(get('Department'))
    const owner = scope.departmentRows.find((item) => item.code === departmentCode)
    if (!owner) {
      issue(
        plan.errors,
        'Department',
        get('Department')
          ? `“${get('Department')}” is not one of the client’s departments.`
          : 'Choose the department.',
      )
      continue
    }
    const typed = get('Data element')
    const code = match(get('Code')) ?? match(typed)
    const entry = code ? byCode.get(code) : undefined
    const title = entry?.title ?? typed.slice(0, 120)
    if (!title) {
      issue(plan.errors, 'Data element', 'Choose the data element.')
      continue
    }
    const key = `${owner.code}:${title.toLowerCase()}`
    if (seen.has(key)) {
      issue(plan.errors, 'Data element', `“${title}” appears twice for ${owner.name}.`)
      continue
    }
    seen.add(key)
    const current = existing.find(
      (item) =>
        item.departmentId === owner.id &&
        ((entry && item.code === entry.code) || item.title.toLowerCase() === title.toLowerCase()),
    )
    if (isRemove(get('Remove'))) {
      if (current) {
        work.push({ action: 'remove', row, id: current.id })
        plan.changes.push({
          row,
          action: 'remove',
          label: `${owner.name}: ${current.title}`,
          detail: 'Removed',
        })
      } else {
        issue(
          plan.warnings,
          'Remove',
          'A row marked Remove that the department doesn’t hold is ignored.',
        )
      }
      continue
    }
    const categoryText = get('Category')
    const category = categoryText
      ? categoryMatch(categoryText)
      : (current?.category ?? entry?.category ?? 'other')
    if (!category) {
      issue(plan.errors, 'Category', `“${categoryText}” is not a category.`)
      continue
    }
    if (!entry && !categoryText && !current) {
      issue(
        plan.warnings,
        'Category',
        `“${title}” is not in the knowledge base; it is added as the department’s own, in Other personal data.`,
      )
    }
    const levelTextValue = get('Level')
    const level = (levelTextValue ? levelMatch(levelTextValue) : undefined) as Level | undefined
    if (levelTextValue && !level) {
      issue(plan.errors, 'Level', `“${levelTextValue}” is not a level. Use L1 to L4.`)
      continue
    }
    const sourceText = get('Comes from')
    const source = sourceText ? sourceMatch(sourceText) : null
    if (sourceText && !source) {
      issue(plan.errors, 'Comes from', `“${sourceText}” is not in the list.`)
      continue
    }
    const text = (header: string, maxLength: number) => {
      const value = get(header)
      if (value.length > maxLength)
        issue(plan.errors, header, `Keep ${header} under ${maxLength} characters.`)
      return value || null
    }
    const values: ElementValues = {
      code: entry?.code ?? null,
      title,
      category,
      level:
        level ??
        (current && current.category === category
          ? current.level
          : entry && entry.category === category
            ? entry.level
            : categoryInfo(category).level),
      source: source ?? null,
      storage: text('Stored in', 200),
      security: text('Security', 300),
      access: text('Access', 200),
    }
    if (current) {
      const same =
        current.category === values.category &&
        current.level === values.level &&
        (current.source ?? null) === values.source &&
        (current.storage ?? null) === values.storage &&
        (current.security ?? null) === values.security &&
        (current.access ?? null) === values.access
      if (same) {
        plan.counts.unchanged += 1
        continue
      }
      work.push({ action: 'update', row, id: current.id, values })
      plan.changes.push({
        row,
        action: 'update',
        label: `${owner.name}: ${title}`,
        detail: 'Changes its details',
      })
    } else {
      work.push({ action: 'create', row, departmentId: owner.id, values })
      plan.changes.push({
        row,
        action: 'create',
        label: `${owner.name}: ${title}`,
        detail: entry ? `Added (${entry.code})` : 'Added as the department’s own',
      })
    }
  }
  plan.counts.create = work.filter((item) => item.action === 'create').length
  plan.counts.update = work.filter((item) => item.action === 'update').length
  plan.counts.remove = work.filter((item) => item.action === 'remove').length
  plan.fingerprint = fingerprintOf(work)
  return { plan, work }
}

type Prepared =
  | { kind: 'ropa'; plan: ImportPlan; work: RopaWork[]; scope: RopaScope }
  | { kind: 'elements'; plan: ImportPlan; work: ElementWork[]; scope: RopaScope }

const prepare = async (
  tx: Transaction,
  clientId: string,
  kind: ImportKind,
  content: Buffer,
): Promise<Prepared> => {
  const scope = await ropaScope(tx, clientId)
  const fail = (message: string): Prepared =>
    kind === 'ropa'
      ? { kind: 'ropa', plan: emptyPlan(kind, message), work: [], scope }
      : { kind: 'elements', plan: emptyPlan(kind, message), work: [], scope }
  const workbook = await loadWorkbook(content)
  if (!workbook) return fail('The file is not an Excel workbook (.xlsx).')
  const client = await clientOf(tx, clientId)
  const owner = clientIdOf(workbook)
  if (owner && owner !== client.code) {
    return fail(`This workbook belongs to client ${owner}, not ${client.code}.`)
  }
  if (kind === 'ropa') {
    const { plan, work } = planRopa(workbook, scope, await activityRows(tx, clientId, scope))
    return { kind, plan, work, scope }
  }
  const { plan, work } = planElements(workbook, scope, await inventoryRows(tx, clientId, scope))
  return { kind, plan, work, scope }
}

/** What importing the file would change. Nothing is saved. */
export const previewImport = async (
  ctx: ServiceContext,
  clientId: string,
  kind: ImportKind,
  content: Buffer,
): Promise<ImportPlan> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => (await prepare(tx, clientId, kind, content)).plan)
}

/**
 * Saves the changes of a file checked with previewImport. The same file must give the same
 * changes (the fingerprint), and a file with errors saves nothing.
 */
export const applyImport = async (
  ctx: ServiceContext,
  clientId: string,
  kind: ImportKind,
  content: Buffer,
  fingerprint: string,
): Promise<ImportPlan['counts']> => {
  authorize(ctx.principal, 'department.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const prepared = await prepare(tx, clientId, kind, content)
    const { plan } = prepared
    if (plan.fatal) throw new RuleError(plan.fatal)
    if (plan.errors.length)
      throw new RuleError('The file still has errors. Fix them and check it again.')
    if (plan.fingerprint !== fingerprint) {
      throw new RuleError('The file or the record changed since it was checked. Check it again.')
    }
    if (prepared.kind === 'ropa') {
      for (const item of prepared.work) {
        if (item.action === 'remove') {
          await tx
            .delete(processingActivity)
            .where(
              and(eq(processingActivity.tenantId, clientId), eq(processingActivity.ref, item.ref)),
            )
        }
      }
      for (const item of prepared.work) {
        if (item.action === 'update')
          await writeActivity(tx, ctx, clientId, prepared.scope, item.ref, item.values)
        if (item.action === 'create')
          await writeActivity(tx, ctx, clientId, prepared.scope, null, item.values)
      }
    } else {
      for (const item of prepared.work) {
        if (item.action === 'remove') {
          await tx.delete(departmentDataElement).where(eq(departmentDataElement.id, item.id))
        } else if (item.action === 'update') {
          await tx
            .update(departmentDataElement)
            .set(elementColumns(item.values))
            .where(eq(departmentDataElement.id, item.id))
        } else {
          const [last] = await tx
            .select({ seq: max(departmentDataElement.seq) })
            .from(departmentDataElement)
            .where(eq(departmentDataElement.departmentId, item.departmentId))
          await tx.insert(departmentDataElement).values({
            tenantId: clientId,
            departmentId: item.departmentId,
            ...elementColumns(item.values),
            seq: (last?.seq ?? 0) + 1,
          })
        }
      }
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: kind === 'ropa' ? 'ropa.import' : 'data_elements.import',
      entity: 'import',
      entityId: plan.fingerprint,
      detail: plan.counts,
    })
    return plan.counts
  })
}
