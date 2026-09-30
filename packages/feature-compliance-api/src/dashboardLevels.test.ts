import { createHash, randomBytes } from 'node:crypto'
import { AccessDeniedError, type Principal } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  appUser,
  assessmentItem,
  count,
  createDatabase,
  eq,
  finding,
  inArray,
  notInArray,
  remediationAction,
  risk,
  roleAssignment,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { answerItem, assignItems, createAssessment, getAssessment, listItems } from './assessments'
import { createClient } from './clients'
import type { EvidenceStorage, ServiceContext } from './context'
import {
  clientFigures,
  departmentBreakdown,
  departmentDashboard,
  portfolio,
  type ClientFigures,
} from './dashboard'
import { createDepartment } from './departments'
import { NotFoundError } from './errors'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { buildDepartmentWorkbook, buildPortfolioWorkbook, WORKBOOK_SHEETS } from './workbooks'

const env = parseEnv(testDatabaseEnvSchema)

let app: DatabaseHandle
let owner: DatabaseHandle
const codes: string[] = []
const emails: string[] = []
const provisioner = {
  provision: () => Promise.resolve('none'),
  setEnabled: () => Promise.resolve(),
}
const storage: EvidenceStorage = {
  put: (_key, content) =>
    Promise.resolve({
      sha256: createHash('sha256').update(content).digest('hex'),
      size: content.length,
    }),
  signedUrl: (key) => Promise.resolve(`memory://${key}`),
  remove: () => Promise.resolve(),
}
const as = (who: Principal): ServiceContext => ({
  db: app.db,
  principal: who,
  provisioner,
  storage,
})

let lead: Principal
let reviewer: Principal

const firmUser = async (role: 'lead_auditor' | 'auditor'): Promise<Principal> => {
  const email = `${role}-${randomBytes(3).toString('hex')}@example.test`
  emails.push(email)
  const [user] = await owner.db
    .insert(appUser)
    .values({ email, displayName: role, kind: 'firm', status: 'active' })
    .returning({ id: appUser.id })
  await owner.db.insert(roleAssignment).values({ userId: user?.id ?? '', role })
  return {
    userId: user?.id ?? '',
    email,
    displayName: role,
    assignments: [{ role, clientId: null, departmentId: null }],
  }
}

const newClient = async (prefix: string) => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `${prefix}${tag} Levels`,
    legalName: `${prefix}${tag} Levels Pvt Ltd`,
    industry: 'Education',
    organisationType: 'trust_society_ngo',
    primaryContactName: 'Uma',
    primaryContactEmail: 'uma@example.test',
    status: 'active',
  })
  codes.push(client.code)
  return client
}

const pdf = (text: string) => Buffer.from(`%PDF-1.4\n% ${text}\n%%EOF\n`)

/**
 * A client with two departments: People (D01 questions) and Technology (D09), a few answers in
 * each and one unassigned answer, an overdue Technology action and evidence for both.
 */
const scenario = async () => {
  const client = await newClient('D')
  const people = await createDepartment(as(lead), client.id, { code: 'HR', name: 'People' })
  const tech = await createDepartment(as(lead), client.id, { code: 'IT', name: 'Technology' })
  const cycle = await createAssessment(as(lead), client.id, { title: 'Baseline' })
  await assignItems(as(lead), client.id, cycle.id, { domainCode: 'D01', departmentId: people.id })
  await assignItems(as(lead), client.id, cycle.id, { domainCode: 'D09', departmentId: tech.id })
  const items = await listItems(as(lead), client.id, cycle.id)
  const inDomain = (code: string) => items.filter((item) => item.domainCode === code)
  const plan: [string, number, string][] = [
    ['D01', 0, 'no'],
    ['D01', 1, 'partial'],
    ['D01', 2, 'yes'],
    ['D09', 0, 'no'],
    ['D09', 1, 'no'],
    ['D09', 2, 'not_applicable'],
    ['D02', 0, 'partial'],
  ]
  for (const [domainCode, index, answer] of plan) {
    await answerItem(as(lead), client.id, inDomain(domainCode)[index]?.id ?? '', {
      answer,
      naReason: 'No such systems in scope.',
    })
  }
  const findings = await listFindings(as(lead), client.id)
  const techFinding = findings.find((row) => row.domainCode === 'D09')
  const peopleFinding = findings.find((row) => row.domainCode === 'D01')
  await createAction(as(lead), client.id, techFinding?.id ?? '', {
    title: 'Encrypt the backups',
    departmentId: tech.id,
    dueDate: '2020-03-31',
  })
  await createAction(as(lead), client.id, peopleFinding?.id ?? '', {
    title: 'Adopt the charter',
    departmentId: people.id,
  })
  await uploadEvidence(
    as(lead),
    client.id,
    { title: 'Draft charter', departmentId: people.id },
    { name: 'charter.pdf', bytes: pdf('charter') },
  )
  const accepted = await uploadEvidence(
    as(lead),
    client.id,
    { title: 'Backup report', departmentId: tech.id },
    { name: 'backup.pdf', bytes: pdf('backup') },
  )
  await reviewEvidence(as(reviewer), client.id, accepted.id, { decision: 'accepted' })
  return { client, cycle, people, tech, items, inDomain }
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

beforeAll(async () => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
  lead = await firmUser('lead_auditor')
  reviewer = await firmUser('auditor')
})
afterAll(async () => {
  if (codes.length) {
    await withTenants(owner.db, 'all', (tx) => tx.delete(tenant).where(inArray(tenant.code, codes)))
  }
  if (emails.length) await owner.db.delete(appUser).where(inArray(appUser.email, emails))
  await Promise.all([app.close(), owner.close()])
})

const totalOf = (rows: ClientFigures[], pick: (row: ClientFigures) => number) =>
  rows.reduce((sum, row) => sum + pick(row), 0)

describe('department dashboards', () => {
  it('TC-C10.3-01 gives department figures that add up to the client and equal direct counts', async () => {
    const { client, people, tech, inDomain } = await scenario()
    const breakdown = await departmentBreakdown(as(lead), client.id)
    expect(breakdown.rows.map((row) => row.name)).toEqual(['People', 'Technology', 'Not assigned'])

    const whole = await clientFigures(as(lead), client.id)
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

    const direct = await withTenants(owner.db, 'all', async (tx) => {
      const [open] = await tx
        .select({ n: count() })
        .from(finding)
        .innerJoin(assessmentItem, eq(assessmentItem.id, finding.itemId))
        .where(and(eq(assessmentItem.departmentId, people.id), eq(finding.status, 'open')))
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
    const peopleRow = rows.find((row) => row.id === people.id)
    expect((peopleRow?.openFindings.gap ?? 0) + (peopleRow?.openFindings.potentialGap ?? 0)).toBe(
      direct.open,
    )
    expect(peopleRow?.latestAssessment?.progress.total).toBe(inDomain('D01').length)
    expect(rows.find((row) => row.id === tech.id)?.actions.overdue).toBe(direct.overdue)

    const dash = await departmentDashboard(as(lead), client.id, 'it')
    expect(dash.department.code).toBe('IT')
    expect(dash.findings.map((row) => row.domainCode)).toEqual(['D09', 'D09'])
    expect(dash.actions.map((row) => [row.title, row.overdue])).toEqual([
      ['Encrypt the backups', true],
    ])
    expect(dash.evidence.map((row) => row.title)).toEqual(['Backup report'])
    expect(dash.attention).toHaveLength(inDomain('D09').length - 3)
    expect(dash.heatmap.flat().reduce((sum, n) => sum + n, 0)).toBe(2)

    await expect(departmentDashboard(as(lead), client.id, 'XX')).rejects.toBeInstanceOf(
      NotFoundError,
    )
    const other = await newClient('E')
    const outsider: Principal = {
      ...lead,
      assignments: [{ role: 'client_viewer', clientId: other.id, departmentId: null }],
    }
    await expect(departmentDashboard(as(outsider), client.id, 'IT')).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
  })
})

describe('overall dashboard', () => {
  it('TC-C10.1-02 shows the heatmap, compliance by domain and actions due equal to direct counts', async () => {
    const { client } = await scenario()
    const quiet = await newClient('Q')
    const scoped: Principal = {
      ...lead,
      assignments: [
        { role: 'lead_auditor', clientId: client.id, departmentId: null },
        { role: 'lead_auditor', clientId: quiet.id, departmentId: null },
      ],
    }
    const view = await portfolio(as(scoped))
    expect(view.rows.map((row) => row.code).sort()).toEqual([client.code, quiet.code].sort())

    const [openRisks] = await withTenants(owner.db, 'all', (tx) =>
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
    expect(view.domains.map((row) => row.code)).toContain('D09')

    const row = view.rows.find((item) => item.id === client.id)
    const detail = await getAssessment(as(lead), client.id, row?.latestAssessment?.code ?? '')
    for (const code of ['D01', 'D02', 'D09']) {
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
    const quiet = await newClient('W')
    const scoped: Principal = {
      ...lead,
      assignments: [
        { role: 'lead_auditor', clientId: client.id, departmentId: null },
        { role: 'lead_auditor', clientId: quiet.id, departmentId: null },
      ],
    }
    const view = await portfolio(as(scoped))
    const workbook = await buildPortfolioWorkbook(as(scoped))
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
    const [direct] = await withTenants(owner.db, 'all', (tx) =>
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
    const matrix = dataRows(book.getWorksheet('Compliance by domain'))
    expect(matrix).toHaveLength(2)

    const owners: Principal = {
      ...lead,
      assignments: [{ role: 'department_owner', clientId: client.id, departmentId: null }],
    }
    await expect(buildPortfolioWorkbook(as(owners))).rejects.toBeInstanceOf(AccessDeniedError)
  })

  it("TC-C11.3-02 writes a department workbook with only that department's records", async () => {
    const { client, people, inDomain } = await scenario()
    const workbook = await buildDepartmentWorkbook(as(lead), client.id, 'hr')
    expect(workbook.fileName).toBe(`${client.code}-HR-department-${isoDate(new Date())}.xlsx`)
    const book = await loadBook(workbook.content)
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([...WORKBOOK_SHEETS.department])

    const answers = dataRows(book.getWorksheet('Answers'))
    expect(answers).toHaveLength(inDomain('D01').length)
    expect(new Set(answers.map((cells) => cells[3]))).toEqual(new Set(['People']))
    const findings = dataRows(book.getWorksheet('Findings'))
    expect(findings.map((cells) => cells[7])).toEqual(['People', 'People'])
    expect(dataRows(book.getWorksheet('Remediation')).map((cells) => cells[1])).toEqual([
      'Adopt the charter',
    ])
    expect(dataRows(book.getWorksheet('Evidence')).map((cells) => cells[1])).toEqual([
      'Draft charter',
    ])
    const dashboard = book.getWorksheet('Department dashboard')
    expect(dashboard?.getCell(1, 1).text).toContain('People')

    const departmentOwner: Principal = {
      ...lead,
      assignments: [{ role: 'department_owner', clientId: client.id, departmentId: people.id }],
    }
    await expect(
      buildDepartmentWorkbook(as(departmentOwner), client.id, 'HR'),
    ).rejects.toBeInstanceOf(AccessDeniedError)
  })
})
