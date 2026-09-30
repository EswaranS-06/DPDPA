import { randomBytes, randomUUID } from 'node:crypto'
import { AccessDeniedError, type Principal, type Role } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import { isoDate } from '@duatf/core-utils'
import {
  count,
  createDatabase,
  eq,
  frameworkRelease,
  inArray,
  risk,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { answerItem, createAssessment, listItems } from './assessments'
import { createClient } from './clients'
import type { ServiceContext } from './context'
import { EXECUTIVE_SECTIONS, executiveReport } from './reports'
import { buildComplianceWorkbook, RISK_REGISTER_COLUMNS, WORKBOOK_SHEETS } from './workbooks'

const env = parseEnv(testDatabaseEnvSchema)

let app: DatabaseHandle
let owner: DatabaseHandle
const codes: string[] = []
const provisioner = {
  provision: () => Promise.resolve('none'),
  setEnabled: () => Promise.resolve(),
}
const person = (role: Role, clientId: string | null = null): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId: null }],
})
const as = (who: Principal): ServiceContext => ({ db: app.db, principal: who, provisioner })
const lead = person('lead_auditor')

const setup = async () => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `W${tag} Reports`,
    legalName: `W${tag} Reports Pvt Ltd`,
    industry: 'Education',
    organisationType: 'trust_society_ngo',
    primaryContactName: 'Ira',
    primaryContactEmail: 'ira@example.test',
    applicability: 'applicable',
  })
  codes.push(client.code)
  const cycle = await createAssessment(as(lead), client.id, { title: 'Readiness 2026' })
  const items = await listItems(as(lead), client.id, cycle.id)
  for (const [index, answer] of ['no', 'partial', 'no', 'yes'].entries()) {
    await answerItem(as(lead), client.id, items[index]?.id ?? '', { answer })
  }
  return { client, cycle }
}

beforeAll(() => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
})
afterAll(async () => {
  if (codes.length) {
    await withTenants(owner.db, 'all', (tx) => tx.delete(tenant).where(inArray(tenant.code, codes)))
  }
  await Promise.all([app.close(), owner.close()])
})

describe('Excel exports', () => {
  it('TC-C11.1-01 writes one risk-register row per risk with every column', async () => {
    const { client } = await setup()
    const workbook = await buildComplianceWorkbook(as(lead), client.id)
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

    const [direct] = await withTenants(owner.db, 'all', (tx) =>
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

    await expect(
      buildComplianceWorkbook(as(person('department_owner', client.id)), client.id),
    ).rejects.toBeInstanceOf(AccessDeniedError)
  })
})

describe('printable reports', () => {
  it('TC-C11.2-01 gives the executive report its required sections, release and date', async () => {
    const { client, cycle } = await setup()
    const report = await executiveReport(
      as(person('client_viewer', client.id)),
      client.id,
      cycle.code,
    )
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
    const [release] = await owner.db
      .select({ version: frameworkRelease.version })
      .from(frameworkRelease)
      .where(eq(frameworkRelease.status, 'published'))
    expect(report.assessment.releaseVersion).toBe(release?.version)
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
