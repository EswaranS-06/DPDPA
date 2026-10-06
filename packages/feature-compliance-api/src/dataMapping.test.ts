import { AccessDeniedError } from '@duatf/core-access'
import {
  dataElement,
  departmentDataElement,
  departmentDataProfile,
  desc,
  eq,
  frameworkRelease,
  inArray,
  withTenant,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { dataMap, departmentData, saveDepartmentData, buildRopaWorkbook } from './dataMapping'
import { createDepartment } from './departments'
import { ValidationError } from './errors'
import { defaultLevel, normaliseCategory } from './personalData'
import { as, closeWorld, newClient, newPerson, openWorld, type World } from './testing'

let world: World

beforeAll(() => {
  world = openWorld()
})
afterAll(async () => {
  await closeWorld(world)
})

/** The published release's own rows for some elements: the oracle for categories and levels. */
const kbRows = async (codes: string[]) => {
  const [release] = await world.owner.db
    .select({ id: frameworkRelease.id })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  return world.owner.db
    .select()
    .from(dataElement)
    .where(inArray(dataElement.code, codes))
    .then((rows) => rows.filter((row) => row.releaseId === release?.id))
}

describe('Personal data of departments', () => {
  it('TC-C20.2-01 a new department keeps the personal data chosen when it was added, in its category and level', async () => {
    const client = await newClient(world, 'Inventory')
    const codes = ['DE-ID-001', 'DE-EMP-007', 'DE-BEH-004', 'DE-FIN-001']
    const created = await createDepartment(world.ctx, client.id, {
      code: 'HR',
      name: 'Human Resources',
      questions: [],
      personalData: [
        ...codes.map((code) => ({ code })),
        { title: 'Hostel room allotment', category: 'other' },
        { code: 'DE-ID-001' },
      ],
    })
    const view = await departmentData(world.ctx, client.id, 'HR')
    expect(view.department.id).toBe(created.id)
    const expected = (await kbRows(codes))
      .map((row) => ({
        code: row.code,
        title: row.title,
        category: normaliseCategory(row),
        level: defaultLevel(row),
      }))
      .sort((a, b) => codes.indexOf(a.code ?? '') - codes.indexOf(b.code ?? ''))
    expect(expected).toHaveLength(codes.length)
    // The duplicate is dropped; the department's own element keeps its category's level.
    expect(
      view.elements.map(({ code, title, category, level }) => ({ code, title, category, level })),
    ).toEqual([
      ...expected,
      { code: null, title: 'Hostel room allotment', category: 'other', level: 'L2' },
    ])
    // Compensation is employment data, made Restricted by its financial tag.
    expect(view.elements.find((row) => row.code === 'DE-EMP-007')?.level).toBe('L4')
    expect(view.suggestion.presets).toEqual(['Human resources'])

    // An unknown element refuses the whole department.
    await expect(
      createDepartment(world.ctx, client.id, {
        code: 'OPS',
        name: 'Operations',
        questions: [],
        personalData: [{ code: 'DE-NOPE-001' }],
      }),
    ).rejects.toBeInstanceOf(ValidationError)
    await expect(departmentData(world.ctx, client.id, 'OPS')).rejects.toThrow(/Department/)
  })

  it('TC-C20.2-02 the personal data page can be changed at any time, and refuses what does not exist', async () => {
    const client = await newClient(world, 'Editable')
    const hr = await createDepartment(world.ctx, client.id, {
      code: 'HR',
      name: 'HR',
      questions: [],
    })
    await createDepartment(world.ctx, client.id, { code: 'FIN', name: 'Finance', questions: [] })
    const first = await saveDepartmentData(world.ctx, client.id, hr.id, {
      elements: [
        { code: 'DE-ID-001', source: 'employees', storage: 'HRMS', access: 'HR team' },
        { code: 'DE-FIN-001', source: 'employees', level: 'L3' },
      ],
      profile: {
        purposes: 'Payroll and employment records',
        lawfulBases: ['s7i'],
        systems: ['HRMS', 'HRMS', ''],
        sharedWith: ['FIN'],
        recipients: ['Payroll outsourcer'],
        transfersAbroad: 'no',
        countries: 'ignored when no transfer',
        retention: 'Eight years after exit',
      },
    })
    expect(first.elements).toBe(2)
    let view = await departmentData(world.ctx, client.id, 'HR')
    expect(view.elements.map((row) => [row.code, row.level, row.source, row.storage])).toEqual([
      ['DE-ID-001', 'L2', 'employees', 'HRMS'],
      ['DE-FIN-001', 'L3', 'employees', null],
    ])
    expect(view.profile).toMatchObject({
      purposes: 'Payroll and employment records',
      lawfulBases: ['s7i'],
      systems: ['HRMS'],
      sharedWith: ['FIN'],
      recipients: ['Payroll outsourcer'],
      transfersAbroad: 'no',
      countries: null,
    })

    // Changed later: one element removed, another added, transfers now known.
    await saveDepartmentData(world.ctx, client.id, hr.id, {
      elements: [
        { code: 'DE-ID-001', source: 'employees' },
        { code: 'DE-HLT-001', source: 'employees' },
      ],
      profile: { transfersAbroad: 'yes', countries: 'Singapore' },
    })
    view = await departmentData(world.ctx, client.id, 'HR')
    expect(view.elements.map((row) => row.code)).toEqual(['DE-ID-001', 'DE-HLT-001'])
    expect(view.profile).toMatchObject({
      transfersAbroad: 'yes',
      countries: 'Singapore',
      sharedWith: [],
    })

    // Refused, and nothing changes: an unknown source, a department that does not exist, a
    // lawful basis the knowledge base lacks, a department sharing with itself.
    for (const bad of [
      { elements: [{ code: 'DE-ID-001', source: 'aliens' }] },
      { elements: [{ code: 'DE-ID-001', source: 'dept:XYZ' }] },
      { elements: [{ code: 'DE-ID-001', source: 'dept:HR' }] },
      { elements: [], profile: { lawfulBases: ['s99'] } },
      { elements: [], profile: { sharedWith: ['HR'] } },
      { elements: [{ title: '' }] },
    ]) {
      await expect(saveDepartmentData(world.ctx, client.id, hr.id, bad)).rejects.toBeInstanceOf(
        ValidationError,
      )
    }
    view = await departmentData(world.ctx, client.id, 'HR')
    expect(view.elements.map((row) => row.code)).toEqual(['DE-ID-001', 'DE-HLT-001'])
  })

  it('TC-C20.2-03 only the audit team changes personal data, and each client sees only its own', async () => {
    const client = await newClient(world, 'Owner')
    const other = await newClient(world, 'Other')
    const hr = await createDepartment(world.ctx, client.id, {
      code: 'HR',
      name: 'HR',
      questions: [],
    })
    await saveDepartmentData(world.ctx, client.id, hr.id, { elements: [{ code: 'DE-ID-001' }] })

    const dpo = await newPerson(world, 'client_dpo', { clientId: client.id })
    const view = await departmentData(as(world, dpo), client.id, 'HR')
    expect(view.canEdit).toBe(false)
    expect(view.elements).toHaveLength(1)
    await expect(
      saveDepartmentData(as(world, dpo), client.id, hr.id, { elements: [] }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(departmentData(as(world, dpo), other.id, 'HR')).rejects.toBeInstanceOf(
      AccessDeniedError,
    )

    // Row-level security: inside the other client's scope the rows do not exist.
    const seen = await withTenant(world.app.db, other.id, async (tx) => ({
      elements: await tx.select().from(departmentDataElement),
      profiles: await tx.select().from(departmentDataProfile),
    }))
    expect(seen.elements.filter((row) => row.tenantId === client.id)).toEqual([])
    expect((await dataMap(world.ctx, other.id)).summary.elements).toBe(0)
  })
})

describe('Data map and record of processing', () => {
  it('TC-C20.3-01 the flows are the ones the departments’ answers describe', async () => {
    const client = await newClient(world, 'Flows')
    const hr = await createDepartment(world.ctx, client.id, {
      code: 'HR',
      name: 'HR',
      questions: [],
    })
    const fin = await createDepartment(world.ctx, client.id, {
      code: 'FIN',
      name: 'Finance',
      questions: [],
    })
    await createDepartment(world.ctx, client.id, { code: 'MKT', name: 'Marketing', questions: [] })
    await saveDepartmentData(world.ctx, client.id, hr.id, {
      elements: [
        { code: 'DE-ID-001', source: 'employees' },
        { code: 'DE-FIN-001', source: 'employees' },
        { code: 'DE-HLT-001', source: 'employees' },
        { code: 'DE-GOV-003' },
      ],
      profile: {
        sharedWith: ['FIN'],
        recipients: ['Payroll Co'],
        transfersAbroad: 'yes',
        countries: 'Singapore',
      },
    })
    await saveDepartmentData(world.ctx, client.id, fin.id, {
      elements: [
        { code: 'DE-FIN-001', source: 'dept:HR' },
        { code: 'DE-GOV-003', source: 'individual_vendors' },
      ],
      profile: { recipients: ['Bank'], transfersAbroad: 'no' },
    })
    const map = await dataMap(world.ctx, client.id)
    const flows = map.edges
      .map(
        (edge) =>
          `${edge.kind} ${edge.from} > ${edge.to} [${[...edge.elements].sort().join(', ')}] ${edge.level}${edge.note ? ` ${edge.note}` : ''}`,
      )
      .sort()
    // Worked out by hand from the two departments' answers above.
    expect(flows).toEqual(
      [
        'collected src:employees > dept:HR [Diagnosis / medical condition, Full name, Bank account number & IFSC] L4',
        'collected src:unknown > dept:HR [PAN] L4',
        'internal dept:HR > dept:FIN [Bank account number & IFSC, Diagnosis / medical condition, Full name, PAN] L4',
        'external dept:HR > ext:payroll co [Bank account number & IFSC, Diagnosis / medical condition, Full name, PAN] L4',
        'abroad dept:HR > abroad [Bank account number & IFSC, Diagnosis / medical condition, Full name, PAN] L4 Singapore',
        'collected src:individual_vendors > dept:FIN [PAN] L4',
        'external dept:FIN > ext:bank [Bank account number & IFSC, PAN] L4',
      ]
        .map((line) =>
          line.replace(
            /\[([^\]]*)\]/,
            (_, items: string) => `[${items.split(', ').sort().join(', ')}]`,
          ),
        )
        .sort(),
    )
    expect(map.summary).toMatchObject({
      departments: 3,
      mapped: 2,
      elements: 4,
      restricted: 3,
      recipients: 2,
      abroad: 1,
      transfersUnknown: 0,
    })
    expect(map.summary.unmapped.map((row) => row.code)).toEqual(['MKT'])
    const record = map.records.find((row) => row.department.code === 'FIN')
    expect(record?.principals).toEqual(['Individual vendors and consultants'])
    expect(record?.otherSources).toEqual(['HR'])
  })

  it('TC-C20.4-01 the RoPA workbook holds a row per mapped department, every element and every flow', async () => {
    const client = await newClient(world, 'Ropa')
    const hr = await createDepartment(world.ctx, client.id, {
      code: 'HR',
      name: 'HR',
      questions: [],
    })
    await createDepartment(world.ctx, client.id, { code: 'ADM', name: 'Admin', questions: [] })
    await saveDepartmentData(world.ctx, client.id, hr.id, {
      elements: [
        { code: 'DE-ID-001', source: 'employees' },
        { code: 'DE-BIO-001', source: 'employees', storage: 'Attendance device' },
      ],
      profile: {
        purposes: 'Attendance',
        lawfulBases: ['s7i'],
        recipients: ['Device vendor'],
        retention: 'One year',
      },
    })
    const map = await dataMap(world.ctx, client.id)
    const workbook = new ExcelJS.Workbook()
    const file = await buildRopaWorkbook(world.ctx, client.id)
    await workbook.xlsx.load(file.content as unknown as ArrayBuffer)
    expect(file.fileName).toMatch(/-record-of-processing-\d{4}-\d{2}-\d{2}\.xlsx$/)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'About',
      'RoPA',
      'Data inventory',
      'Data flows',
      'Categories',
    ])
    const rows = (name: string) => (workbook.getWorksheet(name)?.rowCount ?? 0) - 1
    expect(rows('RoPA')).toBe(1)
    expect(rows('Data inventory')).toBe(2)
    expect(rows('Data flows')).toBe(map.edges.length)
    const ropa = workbook.getWorksheet('RoPA')?.getRow(2)
    expect(ropa?.getCell(2).value).toBe('HR')
    expect(ropa?.getCell(9).text).toContain('Fingerprint')
    expect(ropa?.getCell(11).text).toBe('Attendance device')
  })
})
