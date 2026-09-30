import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Principal, Role } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  and,
  appUser,
  assessmentItem,
  count,
  createDatabase,
  eq,
  evidence,
  finding,
  inArray,
  lt,
  ne,
  notInArray,
  remediationAction,
  risk,
  roleAssignment,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { answerItem, createAssessment, listItems } from './assessments'
import { createClient, getClient } from './clients'
import type { EvidenceStorage, ServiceContext } from './context'
import { homeFor, portfolio } from './dashboard'
import { NotFoundError } from './errors'
import { uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { listBands, ratingFor } from './risks'

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

const person = (role: Role, clientId: string | null = null): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId: null }],
})

let lead: Principal

const newClient = async (prefix: string) => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `${prefix}${tag} Portfolio`,
    legalName: `${prefix}${tag} Portfolio Pvt Ltd`,
    industry: 'Telecom',
    organisationType: 'public_limited',
    primaryContactName: 'Dev',
    primaryContactEmail: 'dev@example.test',
    status: 'active',
  })
  codes.push(client.code)
  return client
}

beforeAll(async () => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
  const email = `lead-${randomBytes(3).toString('hex')}@example.test`
  emails.push(email)
  const [user] = await owner.db
    .insert(appUser)
    .values({ email, displayName: 'Lead', kind: 'firm', status: 'active' })
    .returning({ id: appUser.id })
  await owner.db.insert(roleAssignment).values({ userId: user?.id ?? '', role: 'lead_auditor' })
  lead = { ...person('lead_auditor'), userId: user?.id ?? '' }
})
afterAll(async () => {
  if (codes.length) {
    await withTenants(owner.db, 'all', (tx) => tx.delete(tenant).where(inArray(tenant.code, codes)))
  }
  if (emails.length) await owner.db.delete(appUser).where(inArray(appUser.email, emails))
  await Promise.all([app.close(), owner.close()])
})

describe('portfolio dashboard', () => {
  it('TC-C10.1-01 shows figures equal to direct counts', async () => {
    const busy = await newClient('P')
    const quiet = await newClient('Q')
    const cycle = await createAssessment(as(lead), busy.id, { title: 'Busy cycle' })
    const items = await listItems(as(lead), busy.id, cycle.id)
    for (const [index, answer] of [
      'no',
      'no',
      'no',
      'partial',
      'partial',
      'yes',
      'not_applicable',
    ].entries()) {
      await answerItem(as(lead), busy.id, items[index]?.id ?? '', {
        answer,
        naReason: 'Outside the scope agreed.',
      })
    }
    const [first] = await listFindings(as(lead), busy.id)
    await createAction(as(lead), busy.id, first?.id ?? '', {
      title: 'Late fix',
      dueDate: '2020-01-31',
    })
    await createAction(as(lead), busy.id, first?.id ?? '', {
      title: 'Future fix',
      dueDate: '2099-01-31',
    })
    await uploadEvidence(
      as(lead),
      busy.id,
      { title: 'Pending policy' },
      { name: 'p.pdf', bytes: Buffer.from('%PDF-1.4\n%%EOF') },
    )

    const view = await portfolio(as(lead))
    const bands = await listBands(owner.db)
    const today = new Date().toISOString().slice(0, 10)
    for (const client of [busy, quiet]) {
      const row = view.rows.find((item) => item.id === client.id)
      const direct = await withTenants(owner.db, 'all', async (tx) => {
        const one = async (query: Promise<{ n: number }[]>) => (await query)[0]?.n ?? 0
        const gaps = await one(
          tx
            .select({ n: count() })
            .from(finding)
            .where(
              and(
                eq(finding.tenantId, client.id),
                eq(finding.status, 'open'),
                eq(finding.gapType, 'gap'),
              ),
            ),
        )
        const potential = await one(
          tx
            .select({ n: count() })
            .from(finding)
            .where(
              and(
                eq(finding.tenantId, client.id),
                eq(finding.status, 'open'),
                eq(finding.gapType, 'potential_gap'),
              ),
            ),
        )
        const scores = await tx
          .select({ score: risk.score })
          .from(risk)
          .where(and(eq(risk.tenantId, client.id), inArray(risk.status, ['open', 'treated'])))
        const overdue = await one(
          tx
            .select({ n: count() })
            .from(remediationAction)
            .where(
              and(
                eq(remediationAction.tenantId, client.id),
                lt(remediationAction.dueDate, today),
                notInArray(remediationAction.status, ['closed', 'accepted_risk', 'remediated']),
              ),
            ),
        )
        const answered = await one(
          tx
            .select({ n: count() })
            .from(assessmentItem)
            .where(
              and(
                eq(assessmentItem.tenantId, client.id),
                ne(assessmentItem.answer, 'not_assessed'),
              ),
            ),
        )
        const pending = await one(
          tx
            .select({ n: count() })
            .from(evidence)
            .where(and(eq(evidence.tenantId, client.id), eq(evidence.status, 'pending_review'))),
        )
        const byBand: Record<string, number> = Object.fromEntries(
          bands.map((band) => [band.name, 0]),
        )
        for (const { score } of scores)
          byBand[ratingFor(score, bands).name] = (byBand[ratingFor(score, bands).name] ?? 0) + 1
        return { gaps, potential, byBand, overdue, answered, pending }
      })
      expect(row?.openFindings, client.code).toEqual({
        gap: direct.gaps,
        potentialGap: direct.potential,
      })
      expect(row?.openRisksByBand, client.code).toEqual(direct.byBand)
      expect(row?.actions.overdue, client.code).toBe(direct.overdue)
      expect(row?.latestAssessment?.progress.answered ?? 0, client.code).toBe(direct.answered)
      expect(row?.evidenceAwaitingReview, client.code).toBe(direct.pending)
    }
    const busyRow = view.rows.find((item) => item.id === busy.id)
    expect([
      busyRow?.openFindings.gap,
      busyRow?.openFindings.potentialGap,
      busyRow?.actions.overdue,
    ]).toEqual([3, 2, 1])
    expect(view.totals.openGaps).toBe(view.rows.reduce((sum, row) => sum + row.openFindings.gap, 0))
    expect(view.totals.overdueActions).toBe(
      view.rows.reduce((sum, row) => sum + row.actions.overdue, 0),
    )
  })
})

describe('client portal', () => {
  it('TC-C10.2-01 sends a client user to their own client and refuses another', async () => {
    const own = await newClient('S')
    const other = await newClient('T')
    const dpo = person('client_dpo', own.id)
    expect(homeFor(dpo, [own.code])).toBe(`/clients/${own.code}`)
    expect(homeFor(person('lead_auditor'), [own.code])).toBeNull()
    expect(
      homeFor(
        {
          ...dpo,
          assignments: [
            ...dpo.assignments,
            { role: 'client_viewer', clientId: other.id, departmentId: null },
          ],
        },
        [own.code, other.code],
      ),
    ).toBeNull()

    const view = await portfolio(as(dpo))
    expect(view.rows.map((row) => row.code)).toEqual([own.code])
    await expect(getClient(as(dpo), other.code)).rejects.toBeInstanceOf(NotFoundError)
  })
})
