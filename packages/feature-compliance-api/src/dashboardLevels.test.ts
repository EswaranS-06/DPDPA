import { AccessDeniedError, type Principal } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  assessmentItem,
  count,
  eq,
  finding,
  inArray,
  notInArray,
  remediationAction,
  risk,
  withTenants,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { answerItem, getAssessment } from './assessments'
import {
  clientFigures,
  departmentBreakdown,
  departmentDashboard,
  portfolio,
  type ClientFigures,
} from './dashboard'
import { NotFoundError } from './errors'
import { uploadEvidence } from './evidence'
import { listFindings } from './findings'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  newPerson,
  openWorld,
  pdf,
  type World,
} from './testing'
import { buildDepartmentWorkbook, buildPortfolioWorkbook, WORKBOOK_SHEETS } from './workbooks'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

const HR_CODES = ['A1.1', 'A1.3', 'A1.6', 'B0.12']
const IT_CODES = ['A8.1', 'A8.2', 'A8.4', 'A8.6']

/**
 * A client with two departments: HR (governance questions) and IT (security questions), a few
 * answers in each, an overdue IT action, a file from the HR head waiting for review and an
 * accepted IT file.
 */
const scenario = async () => {
  const client = await newClient(world, 'Levels')
  const hr = await newDepartment(world, client.id, 'HR', HR_CODES)
  const tech = await newDepartment(world, client.id, 'IT', IT_CODES)
  const plan: [typeof hr, string, string][] = [
    [hr, 'A1.1', 'no'],
    [hr, 'A1.3', '2'],
    [hr, 'A1.6', 'yes'],
    [tech, 'A8.1', 'no'],
    [tech, 'A8.2', '1'],
    [tech, 'A8.4', 'not_applicable'],
  ]
  for (const [dep, code, answer] of plan) {
    await answerItem(world.ctx, client.id, dep.item(code).id, {
      answer,
      naReason: 'No such systems in scope.',
    })
  }
  const findings = await listFindings(world.ctx, client.id)
  const techFinding = findings.find((row) => row.departmentCode === 'IT')
  const hrFinding = findings.find((row) => row.departmentCode === 'HR')
  // Without a department chosen, an action belongs to its finding's department.
  await createAction(world.ctx, client.id, techFinding?.id ?? '', {
    title: 'Encrypt the backups',
    dueDate: '2020-03-31',
  })
  await createAction(world.ctx, client.id, hrFinding?.id ?? '', { title: 'Adopt the charter' })
  const head = await newPerson(world, 'department_owner', {
    clientId: client.id,
    departmentId: hr.id,
  })
  await uploadEvidence(
    as(world, head),
    client.id,
    { title: 'Draft charter', departmentId: hr.id },
    { name: 'charter.pdf', bytes: pdf('charter') },
  )
  const backup = await uploadEvidence(
    world.ctx,
    client.id,
    { title: 'Backup report', departmentId: tech.id },
    { name: 'backup.pdf', bytes: pdf('backup') },
  )
  return { client, hr, tech, backup }
}

const loadBook = async (content: Buffer) => {
  const book = new ExcelJS.Workbook()
  await book.xlsx.load(
    content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength,
    ) as ArrayBuffer,
  )
  return book
}

const dataRows = (sheet: ExcelJS.Worksheet | undefined) => {
  const rows: string[][] = []
  sheet?.eachRow((row, index) => {
    if (index > 1) {
      rows.push(Array.from({ length: row.cellCount }, (_, column) => row.getCell(column + 1).text))
    }
  })
  return rows
}

const totalOf = (rows: ClientFigures[], pick: (row: ClientFigures) => number) =>
  rows.reduce((sum, row) => sum + pick(row), 0)

describe('department dashboards', () => {
  it('TC-C10.3-01 gives department figures that add up to the client and equal direct counts', async () => {
    const { client, hr, tech, backup } = await scenario()
    const breakdown = await departmentBreakdown(world.ctx, client.id)
    expect(breakdown.rows.map((row) => row.name)).toEqual(['HR department', 'IT department'])

    const whole = await clientFigures(world.ctx, client.id)
    const rows = breakdown.rows
    const pairs: [string, (row: ClientFigures) => number][] = [
      ['gaps', (row) => row.openFindings.gap],
      ['potential gaps', (row) => row.openFindings.potentialGap],
      ['open actions', (row) => row.actions.open],
      ['overdue actions', (row) => row.actions.overdue],
      ['evidence', (row) => row.evidenceAwaitingReview],
      ['questions', (row) => row.latestAssessment?.progress.total ?? 0],
      ['answered', (row) => row.latestAssessment?.progress.answered ?? 0],
      ['compliant', (row) => row.latestAssessment?.progress.compliant ?? 0],
      ...whole.bands.map(
        (band) =>
          [`${band.name} risks`, (row: ClientFigures) => row.openRisksByBand[band.name] ?? 0] as [
            string,
            (row: ClientFigures) => number,
          ],
      ),
    ]
    for (const [label, pick] of pairs) {
      expect(totalOf(rows, pick), label).toBe(pick(whole))
    }
    expect(whole.evidenceAwaitingReview).toBe(1)

    const direct = await withTenants(world.owner.db, 'all', async (tx) => {
      const [open] = await tx
        .select({ n: count() })
        .from(finding)
        .innerJoin(assessmentItem, eq(assessmentItem.id, finding.itemId))
        .where(and(eq(assessmentItem.departmentId, hr.id), eq(finding.status, 'open')))
      const [overdue] = await tx
        .select({ n: count() })
        .from(remediationAction)
        .where(
          and(
            eq(remediationAction.departmentId, tech.id),
            notInArray(remediationAction.status, ['closed', 'accepted_risk', 'remediated']),
          ),
        )
      return { open: open?.n ?? -1, overdue: overdue?.n ?? -1 }
    })
    const hrRow = rows.find((row) => row.id === hr.id)
    expect((hrRow?.openFindings.gap ?? 0) + (hrRow?.openFindings.potentialGap ?? 0)).toBe(
      direct.open,
    )
    expect(hrRow?.latestAssessment?.progress.total).toBe(HR_CODES.length)
    expect(rows.find((row) => row.id === tech.id)?.actions.overdue).toBe(direct.overdue)

    const dash = await departmentDashboard(world.ctx, client.id, 'it')
    expect(dash.department.code).toBe('IT')
    expect(dash.findings.map((row) => row.questionCode).sort()).toEqual(['A8.1', 'A8.2'])
    expect(dash.actions.map((row) => [row.title, row.overdue])).toEqual([
      ['Encrypt the backups', true],
    ])
    expect(dash.evidence.map((row) => row.code)).toEqual([backup.code])
    expect(dash.heatmap.flat().reduce((sum, n) => sum + n, 0)).toBe(2)

    await expect(departmentDashboard(world.ctx, client.id, 'XX')).rejects.toBeInstanceOf(
      NotFoundError,
    )
    const other = await newClient(world, 'Elsewhere')
    const outsider = await newPerson(world, 'client_viewer', { clientId: other.id })
    await expect(departmentDashboard(as(world, outsider), client.id, 'IT')).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
  })
})

/** The senior auditor seeing only the given clients, so other test files do not interfere. */
const scopedTo = (...clientIds: string[]): Principal => ({
  ...world.ctx.principal,
  assignments: clientIds.map((clientId) => ({
    role: 'lead_auditor' as const,
    clientId,
    departmentId: null,
  })),
})

describe('overall dashboard', () => {
  it('TC-C10.1-02 shows the heatmap, compliance by domain and actions due equal to direct counts', async () => {
    const { client } = await scenario()
    const quiet = await newClient(world, 'Quiet')
    const view = await portfolio(as(world, scopedTo(client.id, quiet.id)))
    expect(view.rows.map((row) => row.code).sort()).toEqual([client.code, quiet.code].sort())

    const [openRisks] = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ n: count() })
        .from(risk)
        .where(
          and(
            inArray(risk.tenantId, [client.id, quiet.id]),
            inArray(risk.status, ['open', 'treated']),
          ),
        ),
    )
    expect(view.heatmap.flat().reduce((sum, n) => sum + n, 0)).toBe(openRisks?.n)
    expect(view.dueActions.map((row) => [row.clientCode, row.title, row.overdue])).toEqual([
      [client.code, 'Encrypt the backups', true],
      [client.code, 'Adopt the charter', false],
    ])
    expect(view.domains.map((row) => row.code)).toEqual(expect.arrayContaining(['D01', 'D09']))

    const row = view.rows.find((item) => item.id === client.id)
    const detail = await getAssessment(world.ctx, client.id, row?.latestAssessment?.code ?? '')
    for (const code of ['D01', 'D09']) {
      expect(
        row?.latestAssessment?.domains.find((item) => item.code === code)?.progress.compliancePct,
        code,
      ).toBe(detail.domains.find((item) => item.code === code)?.progress.compliancePct)
    }
  })
})

describe('dashboard workbooks', () => {
  it('TC-C11.3-01 writes the overall workbook for the clients the user may export', async () => {
    const { client } = await scenario()
    const quiet = await newClient(world, 'Workbook')
    const scoped = as(world, scopedTo(client.id, quiet.id))
    const view = await portfolio(scoped)
    const workbook = await buildPortfolioWorkbook(scoped)
    expect(workbook.fileName).toBe(`DUATF-overall-${isoDate(new Date())}.xlsx`)
    const book = await loadBook(workbook.content)
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([...WORKBOOK_SHEETS.overall])

    const clients = dataRows(book.getWorksheet('Clients'))
    expect(clients.map((cells) => cells[0]).sort()).toEqual([client.code, quiet.code].sort())
    for (const cells of clients) {
      const figures = view.rows.find((item) => item.code === cells[0])
      expect(cells[10], `${cells[0] ?? ''} gaps`).toBe(String(figures?.openFindings.gap))
      expect(cells[11], `${cells[0] ?? ''} potential gaps`).toBe(
        String(figures?.openFindings.potentialGap),
      )
    }
    const [direct] = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ n: count() })
        .from(risk)
        .where(
          and(
            inArray(risk.tenantId, [client.id, quiet.id]),
            inArray(risk.status, ['open', 'treated']),
          ),
        ),
    )
    expect(dataRows(book.getWorksheet('Open risks'))).toHaveLength(direct?.n ?? -1)
    expect(dataRows(book.getWorksheet('Open actions'))).toHaveLength(2)
    expect(dataRows(book.getWorksheet('Compliance by domain'))).toHaveLength(2)

    const owner = await newPerson(world, 'department_owner', { clientId: client.id })
    await expect(buildPortfolioWorkbook(as(world, owner))).rejects.toBeInstanceOf(AccessDeniedError)
  })

  it("TC-C11.3-02 writes a department workbook with only that department's records", async () => {
    const { client, hr } = await scenario()
    const workbook = await buildDepartmentWorkbook(world.ctx, client.id, 'hr')
    expect(workbook.fileName).toBe(`${client.code}-HR-department-${isoDate(new Date())}.xlsx`)
    const book = await loadBook(workbook.content)
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([...WORKBOOK_SHEETS.department])

    // Question, template, section, domain, text, department, answer, outcome, checked.
    const answers = dataRows(book.getWorksheet('Answers'))
    expect(answers.map((cells) => [cells[0], cells[1], cells[5], cells[6], cells[8]])).toEqual([
      ['A1.1', 'TPL-001', 'HR department', 'No', 'No'],
      ['A1.3', 'TPL-001', 'HR department', '2 · Developing', 'No'],
      ['A1.6', 'TPL-001', 'HR department', 'Yes', 'No'],
      ['B0.12', 'TPL-002', 'HR department', 'Not answered', 'No'],
    ])
    const findings = dataRows(book.getWorksheet('Findings'))
    expect(findings.map((cells) => cells[7])).toEqual(['HR department', 'HR department'])
    expect(dataRows(book.getWorksheet('Remediation')).map((cells) => cells[1])).toEqual([
      'Adopt the charter',
    ])
    expect(dataRows(book.getWorksheet('Evidence')).map((cells) => cells[1])).toEqual([
      'Draft charter',
    ])
    const dashboard = book.getWorksheet('Department dashboard')
    expect(dashboard?.getCell(1, 1).text).toContain('HR department')

    const head = await newPerson(world, 'department_owner', {
      clientId: client.id,
      departmentId: hr.id,
    })
    await expect(buildDepartmentWorkbook(as(world, head), client.id, 'HR')).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
  })
})
