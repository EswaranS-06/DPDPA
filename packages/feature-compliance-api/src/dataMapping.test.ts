import { AccessDeniedError } from '@duatf/core-access'
import {
  dataElement,
  departmentDataElement,
  desc,
  eq,
  frameworkRelease,
  inArray,
  processingActivity,
  withTenant,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { dataMap, departmentData, saveDepartmentData } from './dataMapping'
import { createDepartment } from './departments'
import { ValidationError } from './errors'
import { defaultLevel, normaliseCategory } from './personalData'
import { dataFlowOf, listActivities, saveActivity } from './ropa'
import { buildRopaWorkbook } from './ropaWorkbook'
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
        { code: 'DE-FIN-001', source: 'dept:FIN', level: 'L3' },
      ],
    })
    expect(first.elements).toBe(2)
    let view = await departmentData(world.ctx, client.id, 'HR')
    expect(view.elements.map((row) => [row.code, row.level, row.source, row.storage])).toEqual([
      ['DE-ID-001', 'L2', 'employees', 'HRMS'],
      ['DE-FIN-001', 'L3', 'dept:FIN', null],
    ])
    expect(view.activities).toEqual([])

    // Changed later: one element removed, another added.
    await saveDepartmentData(world.ctx, client.id, hr.id, {
      elements: [
        { code: 'DE-ID-001', source: 'employees' },
        { code: 'DE-HLT-001', source: 'employees' },
      ],
    })
    view = await departmentData(world.ctx, client.id, 'HR')
    expect(view.elements.map((row) => row.code)).toEqual(['DE-ID-001', 'DE-HLT-001'])

    // Refused, and nothing changes: an unknown source, a department that does not exist, a
    // department as its own source, an element without a name.
    for (const bad of [
      { elements: [{ code: 'DE-ID-001', source: 'aliens' }] },
      { elements: [{ code: 'DE-ID-001', source: 'dept:XYZ' }] },
      { elements: [{ code: 'DE-ID-001', source: 'dept:HR' }] },
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
    await saveActivity(world.ctx, client.id, null, { department: 'HR', name: 'Payroll' })

    const dpo = await newPerson(world, 'client_dpo', { clientId: client.id })
    const view = await departmentData(as(world, dpo), client.id, 'HR')
    expect(view.canEdit).toBe(false)
    expect(view.elements).toHaveLength(1)
    expect(view.activities.map((row) => row.name)).toEqual(['Payroll'])
    await expect(
      saveDepartmentData(as(world, dpo), client.id, hr.id, { elements: [] }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(departmentData(as(world, dpo), other.id, 'HR')).rejects.toBeInstanceOf(
      AccessDeniedError,
    )

    // Row-level security: inside the other client's scope the rows do not exist.
    const seen = await withTenant(world.app.db, other.id, async (tx) => ({
      elements: await tx.select().from(departmentDataElement),
      activities: await tx.select().from(processingActivity),
    }))
    expect(seen.elements.filter((row) => row.tenantId === client.id)).toEqual([])
    expect(seen.activities.filter((row) => row.tenantId === client.id)).toEqual([])
    expect((await dataMap(world.ctx, other.id)).summary.elements).toBe(0)
  })
})

describe('Data map and record of processing', () => {
  it('TC-C20.3-01 the data flow diagram is the one the RoPA’s activities describe', async () => {
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
    })
    await saveDepartmentData(world.ctx, client.id, fin.id, {
      elements: [
        { code: 'DE-FIN-001', source: 'dept:HR' },
        { code: 'DE-GOV-003', source: 'individual_vendors' },
      ],
    })
    await saveActivity(world.ctx, client.id, null, {
      department: 'HR',
      name: 'Payroll',
      principals: ['Employee'],
      elements: ['DE-ID-001', 'DE-FIN-001', 'DE-HLT-001', 'DE-GOV-003'],
      internalRecipients: ['FIN'],
      processors: ['Payroll Co'],
      transfersAbroad: 'yes',
      countries: 'Singapore',
    })
    await saveActivity(world.ctx, client.id, null, {
      department: 'Finance',
      name: 'Vendor payments',
      principals: 'Individual vendor',
      elements: 'DE-GOV-003; DE-FIN-001',
      recipients: 'Bank',
      transfersAbroad: 'No',
    })
    // The diagram is drawn from the RoPA alone, worked out by hand from the two activities.
    const graph = dataFlowOf(await listActivities(world.ctx, client.id))
    const flows = graph.edges
      .map(
        (edge) =>
          `${edge.kind} ${edge.source} > ${edge.target} [${[...edge.elements].sort().join(', ')}] ${edge.level}${edge.note ? ` ${edge.note}` : ''}`,
      )
      .sort()
    const all = 'Bank account number & IFSC, Diagnosis / medical condition, Full name, PAN'
    const vendor = 'Bank account number & IFSC, PAN'
    expect(flows).toEqual(
      [
        `collect pr:employee > act:PA-001 [${all}] L4`,
        `share act:PA-001 > int:FIN [${all}] L4`,
        `process act:PA-001 > proc:payroll co [${all}] L4`,
        `transfer act:PA-001 > abroad [${all}] L4 Singapore`,
        `collect pr:individual vendor > act:PA-002 [${vendor}] L4`,
        `disclose act:PA-002 > rec:bank [${vendor}] L4`,
      ].sort(),
    )
    // Each activity sits in its department's box; no two boxes of a column overlap.
    const node = (id: string) => graph.nodes.find((item) => item.id === id)
    expect(node('act:PA-001')?.parentId).toBe('dept:HR')
    expect(node('act:PA-002')?.parentId).toBe('dept:FIN')
    expect(node('act:PA-001')?.level).toBe('L4')
    const outer = graph.nodes.filter((item) => item.parentId === null)
    for (const a of outer) {
      for (const b of outer) {
        if (a === b || a.x !== b.x) continue
        expect(a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true)
      }
    }
    expect(new Set(outer.map((item) => item.x)).size).toBe(3)
    const map = await dataMap(world.ctx, client.id)
    expect(map.summary).toMatchObject({
      departments: 3,
      mapped: 2,
      activities: 2,
      elements: 4,
      restricted: 3,
      recipients: 2,
      abroad: 1,
      transfersUnknown: 0,
    })
    expect(map.summary.unmapped.map((row) => row.code)).toEqual(['MKT'])
    const record = map.records.find((row) => row.department.code === 'FIN')
    expect(record?.principals).toEqual(['Individual vendor'])
    expect(record?.otherSources).toEqual(['HR'])
    expect(record?.activities.map((row) => row.refLabel)).toEqual(['PA-002'])
  })

  it('TC-C20.4-01 the RoPA workbook holds one row per processing activity, with its personal data', async () => {
    const client = await newClient(world, 'Ropa')
    await createDepartment(world.ctx, client.id, { code: 'HR', name: 'HR', questions: [] })
    await createDepartment(world.ctx, client.id, { code: 'ADM', name: 'Admin', questions: [] })
    await saveActivity(world.ctx, client.id, null, {
      department: 'HR',
      name: 'Attendance',
      purpose: 'Attendance',
      lawfulBases: ['s7i'],
      elements: ['DE-ID-001', 'DE-BIO-001'],
      systems: 'Attendance device',
      processors: 'Device vendor',
      retention: 'One year',
    })
    const workbook = new ExcelJS.Workbook()
    const file = await buildRopaWorkbook(world.ctx, client.id)
    await workbook.xlsx.load(file.content as unknown as ArrayBuffer)
    expect(file.fileName).toMatch(/-RoPA-\d{4}-\d{2}-\d{2}\.xlsx$/)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Read me',
      'RoPA',
      'Data flows',
      'Lists',
    ])
    const sheet = workbook.getWorksheet('RoPA')
    const header = (name: string) => {
      let at = 0
      sheet?.getRow(1).eachCell((cell, column) => {
        if (cell.text === name) at = column
      })
      return at
    }
    const row = sheet?.getRow(2)
    expect(row?.getCell(header('Activity ID')).text).toBe('PA-001')
    expect(row?.getCell(header('Department')).text).toBe('HR')
    expect(row?.getCell(header('Personal data')).text).toContain('Fingerprint')
    expect(row?.getCell(header('Systems')).text).toBe('Attendance device')
    expect(row?.getCell(header('Retention period')).text).toBe('One year')
    expect(sheet?.getRow(3).getCell(header('Processing activity')).text).toBe('')
    // The adopted element is now on the department's personal data page too.
    expect(
      (await departmentData(world.ctx, client.id, 'HR')).elements.map((item) => item.code),
    ).toEqual(['DE-ID-001', 'DE-BIO-001'])
  })
})
