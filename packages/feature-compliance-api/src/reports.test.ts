import { AccessDeniedError } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import { assessment, count, eq, frameworkRelease, risk, withTenants } from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { answerItem } from './assessments'
import { EXECUTIVE_SECTIONS, executiveReport } from './reports'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  newPerson,
  openWorld,
  type World,
} from './testing'
import { buildComplianceWorkbook, RISK_REGISTER_COLUMNS, WORKBOOK_SHEETS } from './workbooks'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

/** A client with one department: two gaps, a potential gap and a compliant answer. */
const setup = async () => {
  const client = await newClient(world, 'Reports', { applicability: 'applicable' })
  const plan = { 'A1.1': 'no', 'A1.3': '2', 'A2.1': '0', 'A3.1': 'yes' }
  const ops = await newDepartment(world, client.id, 'OPS', Object.keys(plan))
  for (const [code, answer] of Object.entries(plan)) {
    await answerItem(world.ctx, client.id, ops.item(code).id, { answer })
  }
  if (!ops.cycle) throw new Error('No open cycle.')
  return { client, cycle: ops.cycle }
}

describe('Excel exports', () => {
  it('TC-C11.1-01 writes one risk-register row per risk with every column', async () => {
    const { client } = await setup()
    const workbook = await buildComplianceWorkbook(world.ctx, client.id)
    expect(workbook.fileName).toBe(`${client.code}-compliance-${isoDate(new Date())}.xlsx`)

    const book = new ExcelJS.Workbook()
    const bytes = workbook.content
    await book.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    )
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([
      'Dashboard',
      'Departments',
      'Risk register',
      'Findings',
      'Remediation',
      'Answers',
    ])
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([...WORKBOOK_SHEETS.client])
    const sheet = book.getWorksheet('Risk register')
    const header = (sheet?.getRow(1).values as unknown[]).slice(1)
    expect(header).toEqual([...RISK_REGISTER_COLUMNS])

    const [direct] = await withTenants(world.owner.db, 'all', (tx) =>
      tx.select({ n: count() }).from(risk).where(eq(risk.tenantId, client.id)),
    )
    const codesInSheet: string[] = []
    sheet?.eachRow((row, index) => {
      if (index > 1) codesInSheet.push(row.getCell(1).text)
    })
    expect(codesInSheet).toHaveLength(direct?.n ?? -1)
    expect(codesInSheet.every((code) => code.startsWith(`RSK-${client.code}-`))).toBe(true)
    sheet?.eachRow((row, index) => {
      if (index > 1) expect(row.cellCount, `row ${index}`).toBeGreaterThanOrEqual(10)
    })

    const head = await newPerson(world, 'department_owner', { clientId: client.id })
    await expect(buildComplianceWorkbook(as(world, head), client.id)).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
  })
})

describe('printable reports', () => {
  it('TC-C11.2-01 gives the executive report its required sections, release and date', async () => {
    const { client, cycle } = await setup()
    const viewer = await newPerson(world, 'client_viewer', { clientId: client.id })
    const report = await executiveReport(as(world, viewer), client.id, cycle.code)
    expect(report.sections).toEqual([
      'Summary',
      'Scope and method',
      'Compliance by domain',
      'Key findings',
      'Risk register',
      'Remediation',
      'About this report',
    ])
    expect(report.sections).toEqual([...EXECUTIVE_SECTIONS])
    const [pinned] = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ version: frameworkRelease.version })
        .from(assessment)
        .innerJoin(frameworkRelease, eq(frameworkRelease.id, assessment.releaseId))
        .where(eq(assessment.id, cycle.id)),
    )
    expect(report.assessment.releaseVersion).toBe(pinned?.version)
    expect(report.generatedOn).toBe(isoDate(new Date()))
    expect(report.preparedFor).toMatchObject({
      code: client.code,
      applicability: 'DPDP Act applies',
    })
    expect(report.openFindingCount).toBe(3)
    expect(report.keyFindings.every((row) => row.recommendation.length > 20)).toBe(true)
    expect(report.assessment.progress.answered).toBe(4)
  })
})
