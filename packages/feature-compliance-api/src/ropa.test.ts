import { AccessDeniedError } from '@duatf/core-access'
import {
  dataElement,
  desc,
  eq,
  frameworkRelease,
  lawfulBasis,
  processTemplate,
  vocabulary,
  vocabularyTerm,
  type Database,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { departmentData } from './dataMapping'
import { createDepartment } from './departments'
import { RuleError, ValidationError } from './errors'
import {
  activityForm,
  adoptProcesses,
  deleteActivity,
  listActivities,
  ropaCatalogue,
  saveActivity,
} from './ropa'
import {
  normaliseActivity,
  splitAnswers,
  answerMatcher,
  type ActivityScope,
  type RopaAnswer,
  type RopaKb,
} from './ropaKb'
import {
  applyImport,
  buildDataElementWorkbook,
  buildRopaWorkbook,
  previewImport,
} from './ropaWorkbook'
import { as, closeWorld, newClient, newPerson, openWorld, type World } from './testing'

let world: World

beforeAll(() => {
  world = openWorld()
})
afterAll(async () => {
  await closeWorld(world)
})

class Rollback extends Error {}

/** RoPA lists like the knowledge base's, cut down: "Answer | second column | Also accepts". */
const LISTS: Record<string, { columns: string[]; terms: string[][] }> = {
  'ropa-data-principals': {
    columns: ['Answer', 'Who', 'Also accepts'],
    terms: [
      ['Employee', 'Works for the organisation', 'Employees; Staff'],
      [
        'Individual vendor or consultant',
        'An individual supplier',
        'Individual vendor; Consultant',
      ],
      ['Customer', 'Buys from the organisation', 'Customers; Client'],
    ],
  },
  'ropa-sources': {
    columns: ['Answer', 'Meaning', 'Also accepts'],
    terms: [
      ['Directly from the person', 'The person gives it', 'Direct'],
      ['From another department', 'Already held inside', 'Internal'],
    ],
  },
  'ropa-recipients': {
    columns: ['Answer', 'Usual role', 'Also accepts'],
    terms: [
      ['Payroll provider', 'Processor', 'Payroll outsourcer'],
      ['Bank', 'Recipient', 'Banks'],
      ['Statutory authorities', 'Recipient', 'Government; Regulators'],
    ],
  },
  'ropa-systems': {
    columns: ['Answer', 'What it is', 'Also accepts'],
    terms: [['HRMS', 'HR management system', 'HR system']],
  },
  'ropa-retention': {
    columns: ['Answer', 'When it applies', 'Reference', 'Also accepts'],
    terms: [
      [
        'Employment, then as labour and tax laws require',
        'After exit',
        's.7(i)',
        'Employment period',
      ],
      ['Until the purpose is served', 'Erase at purpose end', 's.8(7)(a)', ''],
    ],
  },
  'ropa-deletion': {
    columns: ['Answer', 'What it means', 'Reference', 'Also accepts'],
    terms: [['Secure deletion after the retention period', 'Deleted', 's.8(7)', 'Secure deletion']],
  },
  'ropa-security': {
    columns: ['Answer', 'What it means', 'Reference', 'Also accepts'],
    terms: [
      ['RBAC', 'Role-based access', 'R6(1)(b)', 'Access control'],
      ['Encryption', 'At rest and in transit', 'R6(1)(a)', 'Encryption at rest'],
      ['Logging', 'Logged and reviewed', 'R6(1)(c)', 'Audit trail'],
    ],
  },
  'ropa-consent-status': {
    columns: ['Answer', 'Meaning', 'Also accepts'],
    terms: [
      ['Not needed (another lawful basis)', 'No consent relied on', 'Not applicable'],
      ['Not yet checked', 'Not reviewed', 'Unknown'],
      ['Active', 'Captured and current', 'Given'],
    ],
  },
  'ropa-data-element-names': {
    columns: ['Answer', 'Data element', 'Also accepts'],
    terms: [
      ['Name', 'DE-ID-001', 'Full name'],
      ['PAN', 'DE-GOV-003', 'PAN card'],
      ['Bank details', 'DE-FIN-001', 'Bank account'],
      ['Salary', 'DE-FIN-004', 'Salary information; Income'],
    ],
  },
  'ropa-fields': {
    columns: ['Field', 'What to record', 'Example', 'Answers from'],
    terms: [['Processing activity', 'A short name', 'Employee payroll', 'Free text']],
  },
}

/** Payroll's defaults, as kb-content gives CMN-HR-03 (cut to elements the test release has). */
const PAYROLL = {
  ropaPurpose: 'Salary processing and statutory deductions',
  ropaElements: ['DE-ID-001', 'DE-GOV-003', 'DE-FIN-001', 'DE-FIN-004'],
  ropaPrincipals: ['Employee'],
  ropaSources: ['Directly from the person'],
  ropaInternal: ['Finance'],
  ropaProcessors: ['Payroll provider'],
  ropaRecipients: ['Bank', 'Statutory authorities'],
  ropaRetention: 'Employment, then as labour and tax laws require',
  ropaDeletion: 'Secure deletion after the retention period',
  ropaSecurity: ['RBAC', 'Encryption', 'Logging'],
}

/**
 * Inside the caller's transaction, publishes a copy of the current release's data elements,
 * lawful bases and processes with the RoPA lists and payroll's defaults. Rolled back with it.
 */
const publishRopaRelease = async (db: Database) => {
  const [current] = await db
    .select({ id: frameworkRelease.id })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  const fromId = current?.id ?? ''
  const [created] = await db
    .insert(frameworkRelease)
    .values({ version: '9.2.0', status: 'draft', source: 'test copy', createdBy: 'test' })
    .returning({ id: frameworkRelease.id })
  const id = created?.id ?? ''
  const elements = await db.select().from(dataElement).where(eq(dataElement.releaseId, fromId))
  await db.insert(dataElement).values(elements.map((row) => ({ ...row, releaseId: id })))
  const bases = await db.select().from(lawfulBasis).where(eq(lawfulBasis.releaseId, fromId))
  await db.insert(lawfulBasis).values(bases.map((row) => ({ ...row, releaseId: id })))
  const processes = await db
    .select()
    .from(processTemplate)
    .where(eq(processTemplate.releaseId, fromId))
  await db.insert(processTemplate).values(
    processes.map((row) => ({
      ...row,
      releaseId: id,
      ...(row.code === 'CMN-HR-03' ? PAYROLL : {}),
    })),
  )
  for (const [code, list] of Object.entries(LISTS)) {
    await db.insert(vocabulary).values({ releaseId: id, code, title: code, columns: list.columns })
    await db.insert(vocabularyTerm).values(
      list.terms.map(([term = '', meaning = '', ...rest], index) => ({
        releaseId: id,
        vocabularyCode: code,
        seq: index + 1,
        term,
        meaning,
        extra: Object.fromEntries(
          list.columns
            .slice(2)
            .map((header, offset) => [header, rest[offset] ?? ''] as const)
            .filter(([, value]) => value !== ''),
        ),
      })),
    )
  }
  await db
    .update(frameworkRelease)
    .set({ status: 'published', publishedBy: 'test', publishedAt: new Date(Date.now() + 60_000) })
    .where(eq(frameworkRelease.id, id))
}

/** Runs a test against the RoPA release, then rolls everything back. */
const withRopaRelease = async (work: (ctx: World['ctx']) => Promise<void>) => {
  try {
    await world.owner.db.transaction(async (tx) => {
      const db = tx as unknown as Database
      await publishRopaRelease(db)
      await work({ ...world.ctx, db })
      throw new Rollback()
    })
  } catch (error) {
    if (!(error instanceof Rollback)) throw error
  }
}

const answers = (code: string): RopaAnswer[] =>
  (LISTS[code]?.terms ?? []).map(([value = '', meaning = '', ...rest]) => ({
    value,
    meaning,
    extra: Object.fromEntries(
      (LISTS[code]?.columns ?? [])
        .slice(2)
        .map((header, offset) => [header, rest[offset] ?? ''] as const),
    ),
  }))

/** A hand-built knowledge base for the pure rules. */
const kb: RopaKb = {
  releaseVersion: '9.2.0',
  lists: {
    principals: answers('ropa-data-principals'),
    sources: answers('ropa-sources'),
    recipients: answers('ropa-recipients'),
    systems: answers('ropa-systems'),
    retention: answers('ropa-retention'),
    deletion: answers('ropa-deletion'),
    security: answers('ropa-security'),
    consent: answers('ropa-consent-status'),
    names: answers('ropa-data-element-names'),
    fields: answers('ropa-fields'),
  },
  sectorRetention: [{ value: 'Books of account: 8 years', meaning: null, extra: {} }],
  bases: [
    { code: 'consent', name: 'Consent (s.6)', reference: 's.4(1)(a), s.6', label: 'Consent (s.6)' },
    {
      code: 's7i',
      name: 'Employment purposes / safeguarding employer',
      reference: 's.7(i)',
      label: 'Employment purposes / safeguarding employer (s.7(i))',
    },
  ],
  elements: [
    {
      code: 'DE-ID-001',
      title: 'Full name',
      name: 'Name',
      category: 'identifiers',
      level: 'L2',
      personalData: true,
    },
    {
      code: 'DE-GOV-003',
      title: 'PAN',
      name: 'PAN',
      category: 'government_ids',
      level: 'L4',
      personalData: true,
    },
    {
      code: 'DE-FIN-001',
      title: 'Bank account number & IFSC',
      name: 'Bank details',
      category: 'financial',
      level: 'L4',
      personalData: true,
    },
    {
      code: 'DE-FIN-004',
      title: 'Income / salary / CTC',
      name: 'Salary',
      category: 'financial',
      level: 'L4',
      personalData: true,
    },
  ],
  processes: [],
}

const scope: ActivityScope = {
  kb,
  departments: [
    { code: 'HR', name: 'Human Resources' },
    { code: 'FIN', name: 'Finance' },
  ],
  inventory: new Map(),
}

describe('RoPA answers', () => {
  it('TC-C21.2-01 simple answers, other spellings and lists typed in one cell become the knowledge base’s answers', () => {
    // "Name, PAN, bank details, salary information" reads as four elements.
    expect(
      splitAnswers('Name, PAN, bank details, salary information', (text) =>
        ['name', 'pan', 'bank details', 'salary information'].includes(text.toLowerCase())
          ? text
          : undefined,
      ),
    ).toEqual(['Name', 'PAN', 'bank details', 'salary information'])
    // A piece that is an answer as a whole is not split on its commas.
    const match = answerMatcher([
      { value: 'Shareholder, director or KMP', meaning: null, extra: {} },
    ])
    expect(splitAnswers('Shareholder, director or KMP; KMP', match)).toEqual([
      'Shareholder, director or KMP',
      'KMP',
    ])

    // The text sample of a payroll RoPA, as an assessor would type it.
    const { values, errors, warnings } = normaliseActivity(
      {
        department: 'human resources',
        name: 'Employee payroll',
        purpose: 'Salary processing',
        lawfulBases: 'Employment purposes / safeguarding employer (s.7(i))',
        principals: 'Employees',
        elements: 'Name, PAN, bank details, salary information',
        sources: 'Direct',
        systems: 'HR system; Payroll portal',
        internalRecipients: 'Finance',
        processors: 'Payroll outsourcer',
        recipients: 'Banks; Government',
        retention: 'Employment period',
        deletion: 'Secure deletion',
        security: 'Access control; Encryption at rest; Audit trail',
        transfersAbroad: 'No',
        countries: 'Not kept: no transfer',
        consentStatus: 'Not applicable',
      },
      scope,
    )
    expect(errors).toEqual({})
    expect(values).toMatchObject({
      departmentCode: 'HR',
      lawfulBases: ['s7i'],
      principals: ['Employee'],
      sources: ['Directly from the person'],
      systems: ['HRMS', 'Payroll portal'],
      internalRecipients: ['FIN'],
      processors: ['Payroll provider'],
      recipients: ['Bank', 'Statutory authorities'],
      retention: 'Employment, then as labour and tax laws require',
      deletion: 'Secure deletion after the retention period',
      security: ['RBAC', 'Encryption', 'Logging'],
      transfersAbroad: 'no',
      countries: null,
      consentStatus: 'Not needed (another lawful basis)',
    })
    expect(values.elements.map((item) => [item.code, item.level])).toEqual([
      ['DE-ID-001', 'L2'],
      ['DE-GOV-003', 'L4'],
      ['DE-FIN-001', 'L4'],
      ['DE-FIN-004', 'L4'],
    ])
    // An open list keeps what it doesn't know, and says so.
    expect(warnings.systems).toContain('Payroll portal')

    // Closed lists refuse what they don't know; a department's own element is kept with a note.
    const bad = normaliseActivity(
      {
        department: 'Legal',
        name: '',
        lawfulBases: 'Legitimate interest',
        principals: 'Aliens',
        sources: 'Telepathy',
        deletion: 'Burn it',
        transfersAbroad: 'Maybe',
        consentStatus: 'Whatever',
        internalRecipients: 'Sales',
        elements: 'Hostel room allotment',
        retention: 'Books of account: 8 years',
      },
      scope,
    )
    expect(Object.keys(bad.errors).sort()).toEqual(
      [
        'consentStatus',
        'deletion',
        'departmentCode',
        'internalRecipients',
        'lawfulBases',
        'name',
        'principals',
        'sources',
        'transfersAbroad',
      ].sort(),
    )
    expect(bad.values.elements).toEqual([
      { code: null, title: 'Hostel room allotment', category: 'other', level: 'L2' },
    ])
    expect(bad.warnings.elements).toContain('Hostel room allotment')
    // The client's sector retention periods are answers too.
    expect(bad.values.retention).toBe('Books of account: 8 years')
  })
})

describe('Processing activities', () => {
  it('TC-C21.2-02 a department adopts its catalogue processes in one step, with the knowledge base’s RoPA defaults', async () => {
    const client = await newClient(world, 'Adopt')
    await withRopaRelease(async (ctx) => {
      await createDepartment(ctx, client.id, { code: 'HR', name: 'Human Resources', questions: [] })
      await createDepartment(ctx, client.id, {
        code: 'FIN',
        name: 'Finance & Accounts',
        questions: [],
      })
      const catalogue = await ropaCatalogue(ctx, client.id)
      const hr = catalogue.departments.find((row) => row.code === 'HR')
      expect(hr?.suggested).toContain('CMN-HR-03')
      expect(hr?.suggested.every((code) => code.startsWith('CMN-HR-'))).toBe(true)

      const result = await adoptProcesses(ctx, client.id, {
        picks: [
          { department: 'HR', process: 'CMN-HR-03' },
          { department: 'HR', process: 'CMN-HR-01' },
          { department: 'HR', process: 'CMN-HR-03' },
        ],
      })
      expect(result.created).toEqual(['PA-001', 'PA-002'])
      expect(result.skipped).toEqual(['HR:CMN-HR-03'])
      // Adopting again keeps the existing activities.
      expect(
        (
          await adoptProcesses(ctx, client.id, {
            picks: [{ department: 'HR', process: 'CMN-HR-03' }],
          })
        ).created,
      ).toEqual([])

      const { activities } = await listActivities(ctx, client.id)
      const payroll = activities.find((row) => row.templateCode === 'CMN-HR-03')
      expect(payroll).toMatchObject({
        refLabel: 'PA-001',
        departmentCode: 'HR',
        purpose: PAYROLL.ropaPurpose,
        principals: ['Employee'],
        sources: ['Directly from the person'],
        internalRecipients: ['FIN'],
        processors: ['Payroll provider'],
        recipients: ['Bank', 'Statutory authorities'],
        retention: PAYROLL.ropaRetention,
        deletion: PAYROLL.ropaDeletion,
        security: ['RBAC', 'Encryption', 'Logging'],
        transfersAbroad: 'unknown',
        consentStatus: 'Not needed (another lawful basis)',
      })
      expect(payroll?.elements.map((item) => item.code)).toEqual(PAYROLL.ropaElements)
      // A process without defaults still starts: its title, lawful bases and systems.
      const recruitment = activities.find((row) => row.templateCode === 'CMN-HR-01')
      expect(recruitment?.lawfulBases.length).toBeGreaterThan(0)
      expect(recruitment?.consentStatus).toBe('Not yet checked')
      // The department's personal data now lists payroll's elements.
      const page = await departmentData(ctx, client.id, 'HR')
      expect(page.elements.map((item) => item.code)).toEqual(
        expect.arrayContaining(PAYROLL.ropaElements),
      )
      expect(page.activities.map((row) => row.refLabel)).toEqual(['PA-001', 'PA-002'])

      // The form for a new activity from the catalogue starts with the same defaults.
      const form = await activityForm(ctx, client.id, null, {
        department: 'hr',
        process: 'CMN-HR-03',
      })
      expect(form.values.processors).toEqual(['Payroll provider'])
      expect(form.values.internalRecipients).toEqual(['FIN'])
    })
  })

  it('TC-C21.2-03 activities are edited and removed by the audit team only, and refuse unknown answers', async () => {
    const client = await newClient(world, 'Edit')
    const other = await newClient(world, 'Elsewhere')
    await withRopaRelease(async (ctx) => {
      await createDepartment(ctx, client.id, { code: 'HR', name: 'HR', questions: [] })
      const { ref } = await saveActivity(ctx, client.id, null, {
        department: 'HR',
        name: 'Payroll',
        principals: ['Employee'],
        elements: [{ code: 'DE-ID-001' }, { title: 'Locker number', category: 'identifiers' }],
      })
      expect(ref).toBe(1)
      await expect(
        saveActivity(ctx, client.id, null, { department: 'HR', name: 'Payroll' }),
      ).rejects.toThrow(ValidationError)
      await expect(
        saveActivity(ctx, client.id, ref, {
          department: 'HR',
          name: 'Payroll',
          principals: 'Robots',
        }),
      ).rejects.toBeInstanceOf(ValidationError)
      await saveActivity(ctx, client.id, ref, {
        department: 'HR',
        name: 'Payroll and benefits',
        principals: 'Employees',
        transfersAbroad: 'yes',
        countries: 'Singapore',
      })
      const form = await activityForm(ctx, client.id, ref)
      expect(form.values).toMatchObject({ name: 'Payroll and benefits', countries: 'Singapore' })

      const dpo = await newPerson(world, 'client_dpo', { clientId: client.id })
      const dpoCtx = { ...as(world, dpo), db: ctx.db }
      expect((await listActivities(dpoCtx, client.id)).canEdit).toBe(false)
      await expect(
        saveActivity(dpoCtx, client.id, ref, { department: 'HR', name: 'x' }),
      ).rejects.toBeInstanceOf(AccessDeniedError)
      await expect(deleteActivity(dpoCtx, client.id, ref)).rejects.toBeInstanceOf(AccessDeniedError)
      await expect(listActivities(dpoCtx, other.id)).rejects.toBeInstanceOf(AccessDeniedError)

      await deleteActivity(ctx, client.id, ref)
      expect((await listActivities(ctx, client.id)).activities).toEqual([])
    })
  })
})

/** The RoPA sheet's cells by heading, row by row. */
const sheetRows = (workbook: ExcelJS.Workbook, name: string) => {
  const sheet = workbook.getWorksheet(name)
  const headers: string[] = []
  sheet?.getRow(1).eachCell((cell, column) => {
    headers[column] = cell.text
  })
  const rows: Record<string, string>[] = []
  sheet?.eachRow((row, index) => {
    if (index === 1) return
    const cells: Record<string, string> = {}
    headers.forEach((header, column) => {
      if (header) cells[header] = row.getCell(column).text
    })
    if (Object.values(cells).some(Boolean)) rows.push(cells)
  })
  return { sheet, headers, rows }
}

const columnOf = (headers: string[], name: string) => headers.indexOf(name)

const toBuffer = async (workbook: ExcelJS.Workbook) =>
  Buffer.from(await workbook.xlsx.writeBuffer())

describe('RoPA and data element workbooks', () => {
  it('TC-C21.3-01 the exported RoPA has a dropdown from the knowledge base on every answer column', async () => {
    const client = await newClient(world, 'Lists')
    await withRopaRelease(async (ctx) => {
      await createDepartment(ctx, client.id, { code: 'HR', name: 'Human Resources', questions: [] })
      await adoptProcesses(ctx, client.id, { picks: [{ department: 'HR', process: 'CMN-HR-03' }] })
      const file = await buildRopaWorkbook(ctx, client.id)
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(file.content as unknown as ArrayBuffer)
      expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Read me', 'RoPA', 'Lists'])
      const { sheet, headers, rows } = sheetRows(workbook, 'RoPA')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        'Activity ID': 'PA-001',
        Department: 'Human Resources',
        'Data principals': 'Employee',
        'Personal data': 'Name; PAN; Bank details; Salary',
        Processors: 'Payroll provider',
        'Other recipients': 'Bank; Statutory authorities',
        'Security measures': 'RBAC; Encryption; Logging',
        'Cross-border transfer': 'Not yet known',
      })
      // Closed answers are strict dropdowns; answers that take several are dropdowns that let
      // the cell hold a typed list; both point at the Lists sheet. Blank rows have them too.
      const validation = (header: string, row = 2) =>
        sheet?.getCell(row, columnOf(headers, header)).dataValidation
      expect(validation('Department')).toMatchObject({ type: 'list', showErrorMessage: true })
      expect(validation('Deletion', 50)).toMatchObject({ type: 'list', showErrorMessage: true })
      expect(validation('Data principals')).toMatchObject({ type: 'list' })
      // Excel leaves the error alert off when the attribute is absent.
      expect(validation('Data principals')?.showErrorMessage).toBeFalsy()
      expect(String(validation('Personal data')?.formulae?.[0])).toMatch(
        /^'Lists'!\$[A-Z]+\$2:\$[A-Z]+\$\d+$/,
      )
      expect(validation('Purpose')).toBeUndefined()
      const lists = workbook.getWorksheet('Lists')
      const listHeaders: string[] = []
      lists?.getRow(1).eachCell((cell) => listHeaders.push(cell.text))
      expect(listHeaders).toEqual(
        expect.arrayContaining(['Data principals', 'Security measures', 'Deletion']),
      )
      // The Read me carries the client ID that the import checks.
      const readMe: string[] = []
      workbook
        .getWorksheet('Read me')
        ?.eachRow((row) => readMe.push(`${row.getCell(1).text}|${row.getCell(2).text}`))
      expect(readMe).toContain(`Client ID|${client.code}`)
    })
  })

  it('TC-C21.3-02 an edited RoPA imports only after its changes are checked, and a bad file saves nothing', async () => {
    const client = await newClient(world, 'Import')
    const other = await newClient(world, 'Stranger')
    await withRopaRelease(async (ctx) => {
      await createDepartment(ctx, client.id, { code: 'HR', name: 'Human Resources', questions: [] })
      await createDepartment(ctx, client.id, { code: 'FIN', name: 'Finance', questions: [] })
      await adoptProcesses(ctx, client.id, {
        picks: [
          { department: 'HR', process: 'CMN-HR-03' },
          { department: 'HR', process: 'CMN-HR-01' },
        ],
      })
      const exported = await buildRopaWorkbook(ctx, client.id)

      // The file as exported changes nothing.
      const same = await previewImport(ctx, client.id, 'ropa', exported.content)
      expect(same).toMatchObject({
        fatal: null,
        errors: [],
        counts: { create: 0, update: 0, remove: 0, unchanged: 2 },
      })

      // Edited in Excel: payroll's retention and systems change, recruitment is removed, and a
      // new activity is typed in the way the text sample writes it.
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(exported.content as unknown as ArrayBuffer)
      const { sheet, headers, rows } = sheetRows(workbook, 'RoPA')
      const at = (header: string) => columnOf(headers, header)
      const payrollRow =
        rows.findIndex((row) => row['Catalogue process']?.startsWith('CMN-HR-03')) + 2
      const recruitmentRow =
        rows.findIndex((row) => row['Catalogue process']?.startsWith('CMN-HR-01')) + 2
      if (sheet) {
        sheet.getCell(payrollRow, at('Retention period')).value = 'Until the purpose is served'
        sheet.getCell(payrollRow, at('Systems')).value = 'HRMS; Banking portal'
        sheet.getCell(recruitmentRow, at('Remove')).value = 'Remove'
      }
      const blank = rows.length + 2
      const fill = (header: string, value: string) => {
        if (sheet) sheet.getCell(blank, at(header)).value = value
      }
      fill('Processing activity', 'Vendor payments')
      fill('Department', 'Finance')
      fill('Purpose', 'Pay individual vendors')
      fill('Data principals', 'Individual vendor')
      fill('Personal data', 'Name, PAN, bank details')
      fill('Processors', 'Payroll outsourcer')
      fill('Other recipients', 'Banks')
      fill('Deletion', 'Secure deletion')
      fill('Cross-border transfer', 'No')
      const edited = await toBuffer(workbook)
      const plan = await previewImport(ctx, client.id, 'ropa', edited)
      expect(plan.errors).toEqual([])
      expect(plan.counts).toEqual({ create: 1, update: 1, remove: 1, unchanged: 0 })
      expect(plan.changes.find((row) => row.action === 'update')?.detail).toBe(
        'Changes Systems, Retention period',
      )
      // Nothing is saved yet.
      expect((await listActivities(ctx, client.id)).activities).toHaveLength(2)
      // A different file, or the right one with a stale fingerprint, is refused.
      await expect(
        applyImport(ctx, client.id, 'ropa', exported.content, plan.fingerprint),
      ).rejects.toBeInstanceOf(RuleError)
      expect(await applyImport(ctx, client.id, 'ropa', edited, plan.fingerprint)).toEqual(
        plan.counts,
      )
      const after = (await listActivities(ctx, client.id)).activities
      expect(after.map((row) => row.refLabel)).toEqual(['PA-001', 'PA-003'])
      const vendor = after.find((row) => row.name === 'Vendor payments')
      expect(vendor).toMatchObject({
        refLabel: 'PA-003',
        departmentCode: 'FIN',
        principals: ['Individual vendor or consultant'],
        processors: ['Payroll provider'],
        recipients: ['Bank'],
        deletion: 'Secure deletion after the retention period',
        transfersAbroad: 'no',
      })
      expect(vendor?.elements.map((item) => item.code)).toEqual([
        'DE-ID-001',
        'DE-GOV-003',
        'DE-FIN-001',
      ])
      expect(after.find((row) => row.templateCode === 'CMN-HR-03')?.systems).toEqual([
        'HRMS',
        'Banking portal',
      ])

      // Errors are listed by row and field, and the file can't be applied.
      if (sheet) {
        sheet.getCell(blank, at('Data principals')).value = 'Aliens'
        sheet.getCell(blank, at('Activity ID')).value = 'PA-099'
      }
      const broken = await previewImport(ctx, client.id, 'ropa', await toBuffer(workbook))
      // Recruitment's row still names PA-002, which the import removed.
      expect(broken.errors.map((row) => `${row.row} ${row.field}`)).toEqual([
        `${recruitmentRow} Activity ID`,
        `${blank} Activity ID`,
      ])
      await expect(
        applyImport(ctx, client.id, 'ropa', await toBuffer(workbook), broken.fingerprint),
      ).rejects.toBeInstanceOf(RuleError)
      // Another client's workbook is refused as a whole.
      const elsewhere = await previewImport(ctx, other.id, 'ropa', edited)
      expect(elsewhere.fatal).toContain(client.code)
      // Not a workbook at all.
      expect((await previewImport(ctx, client.id, 'ropa', Buffer.from('hello'))).fatal).toMatch(
        /not an Excel/,
      )
    })
  })

  it('TC-C21.3-03 the data element workbook adds, changes and removes a department’s data elements', async () => {
    const client = await newClient(world, 'Elements')
    await withRopaRelease(async (ctx) => {
      await createDepartment(ctx, client.id, {
        code: 'HR',
        name: 'Human Resources',
        questions: [],
        personalData: [{ code: 'DE-ID-001' }, { code: 'DE-GOV-003' }],
      })
      const exported = await buildDataElementWorkbook(ctx, client.id)
      expect((await previewImport(ctx, client.id, 'elements', exported.content)).counts).toEqual({
        create: 0,
        update: 0,
        remove: 0,
        unchanged: 2,
      })
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(exported.content as unknown as ArrayBuffer)
      const { sheet, headers, rows } = sheetRows(workbook, 'Data elements')
      const at = (header: string) => columnOf(headers, header)
      const row = (title: string) => rows.findIndex((item) => item['Data element'] === title) + 2
      expect(sheet?.getCell(2, at('Level')).dataValidation).toMatchObject({
        type: 'list',
        showErrorMessage: true,
      })
      if (sheet) {
        sheet.getCell(row('Full name'), at('Level')).value = 'L3 Confidential'
        sheet.getCell(row('Full name'), at('Stored in')).value = 'HRMS'
        sheet.getCell(row('PAN'), at('Remove')).value = 'Remove'
        const blank = rows.length + 2
        sheet.getCell(blank, at('Department')).value = 'Human Resources'
        sheet.getCell(blank, at('Data element')).value = 'Salary information'
        sheet.getCell(blank, at('Comes from')).value = 'Employees'
        sheet.getCell(blank + 1, at('Department')).value = 'Human Resources'
        sheet.getCell(blank + 1, at('Data element')).value = 'Locker number'
        sheet.getCell(blank + 1, at('Category')).value = 'Personal identifiers'
        sheet.getCell(blank + 2, at('Department')).value = 'Purchase'
        sheet.getCell(blank + 2, at('Data element')).value = 'PAN'
      }
      let plan = await previewImport(ctx, client.id, 'elements', await toBuffer(workbook))
      expect(plan.errors.map((item) => item.field)).toEqual(['Department'])
      sheet?.spliceRows(rows.length + 4, 1)
      const fixed = await toBuffer(workbook)
      plan = await previewImport(ctx, client.id, 'elements', fixed)
      expect(plan.errors).toEqual([])
      expect(plan.counts).toEqual({ create: 2, update: 1, remove: 1, unchanged: 0 })
      await applyImport(ctx, client.id, 'elements', fixed, plan.fingerprint)
      const page = await departmentData(ctx, client.id, 'HR')
      expect(
        page.elements.map((item) => [item.code, item.title, item.level, item.source, item.storage]),
      ).toEqual([
        ['DE-ID-001', 'Full name', 'L3', null, 'HRMS'],
        ['DE-FIN-004', expect.any(String), 'L4', 'employees', null],
        [null, 'Locker number', 'L2', null, null],
      ])
    })
  })
})
