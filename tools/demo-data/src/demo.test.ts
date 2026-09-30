import { createHash, randomUUID } from 'node:crypto'
import type { Principal } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  listActions,
  listAssessments,
  listFindings,
  listRisks,
  portfolio,
  type EvidenceStorage,
  type ServiceContext,
} from '@duatf/feature-compliance-api'
import {
  appUser,
  assessment,
  assessmentItem,
  createDatabase,
  eq,
  evidence,
  finding,
  inArray,
  remediationAction,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadDemo, removeDemo, type DemoDependencies } from './loader'
import { DEMO_STAFF, DEMO_STORIES, LOADER, NADALL } from './story'

const env = parseEnv(testDatabaseEnvSchema)

let app: DatabaseHandle
let owner: DatabaseHandle
const files = new Map<string, Buffer>()
const storage: EvidenceStorage = {
  put: (key, content) => {
    files.set(key, content)
    return Promise.resolve({
      sha256: createHash('sha256').update(content).digest('hex'),
      size: content.length,
    })
  },
  signedUrl: (key) => Promise.resolve(`memory://${key}`),
  remove: (key) => {
    files.delete(key)
    return Promise.resolve()
  },
}
let deps: DemoDependencies

const emails = [
  LOADER.email,
  ...Object.values(DEMO_STAFF).map((person) => person.email),
  ...DEMO_STORIES.flatMap((story) => story.people.map((person) => person.email)),
]

const demoClients = () =>
  withTenants(owner.db, 'all', (tx) =>
    tx
      .select({ id: tenant.id, code: tenant.code })
      .from(tenant)
      .where(inArray(tenant.code, ['NADALL', 'AMMA'])),
  )

beforeAll(() => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
  deps = { db: app.db, ownerDb: owner.db, storage }
})
afterAll(async () => {
  await removeDemo(deps)
  await owner.db.delete(appUser).where(inArray(appUser.email, emails))
  await Promise.all([app.close(), owner.close()])
})

describe('demo clients', () => {
  it(
    'TC-C10.4-01 loads the Nadall and AMMA stories through the services, and a reload replaces them',
    { timeout: 900_000 },
    async () => {
      // A real client that happens to use a demo client ID is never touched.
      const [real] = await withTenants(owner.db, 'all', (tx) =>
        tx.insert(tenant).values({ code: 'AMMA', name: 'A real client' }).returning(),
      )
      await expect(loadDemo(deps)).rejects.toThrow('AMMA exists and is not demo data')
      await withTenants(owner.db, 'all', (tx) =>
        tx.delete(tenant).where(eq(tenant.id, real?.id ?? '')),
      )

      const summary = await loadDemo(deps)
      expect(summary.clients.map((client) => client.code)).toEqual(['NADALL', 'AMMA'])
      const clients = await demoClients()
      const idOf = (code: string) => clients.find((row) => row.code === code)?.id ?? ''
      const auditor: Principal = {
        userId: randomUUID(),
        email: 'check@example.test',
        displayName: 'Check',
        assignments: clients.map((row) => ({
          role: 'lead_auditor' as const,
          clientId: row.id,
          departmentId: null,
        })),
      }
      const ctx: ServiceContext = {
        db: app.db,
        principal: auditor,
        provisioner: { provision: () => Promise.resolve(''), setEnabled: () => Promise.resolve() },
      }

      // Nadall: a completed, fully reviewed baseline and a re-assessment under way.
      const nadall = idOf('NADALL')
      const cycles = await listAssessments(ctx, nadall)
      const [reassessment, baseline] = cycles
      expect(cycles.map((row) => row.status)).toEqual(['in_progress', 'completed'])
      expect([baseline?.progress.answered, baseline?.progress.reviewedPct]).toEqual([
        baseline?.progress.total,
        100,
      ])
      expect(reassessment?.progress.answered).toBe(
        Object.keys(NADALL.cycles[1]?.answers ?? {}).length,
      )
      expect(reassessment?.previousAssessmentId).toBe(baseline?.id)

      // Every gap is counted once: no question has two open findings.
      const open = await listFindings(ctx, nadall, { status: 'open' })
      const perQuestion = new Map<string, number>()
      for (const row of open)
        perQuestion.set(row.questionCode, (perQuestion.get(row.questionCode) ?? 0) + 1)
      expect([...perQuestion.values()].every((n) => n === 1)).toBe(true)
      const view = await portfolio(ctx)
      const row = view.rows.find((item) => item.code === 'NADALL')
      expect((row?.openFindings.gap ?? 0) + (row?.openFindings.potentialGap ?? 0)).toBe(open.length)

      // Closed actions closed their findings; the accepted risk followed its gap into cycle 2.
      const actions = await listActions(ctx, nadall)
      const all = await listFindings(ctx, nadall)
      for (const action of actions.filter((item) => item.status === 'closed')) {
        const closed = all.find((item) => item.id === action.findingId)
        expect(closed?.closedReason, action.code).toMatch(/^Remediated/)
      }
      expect(new Set(actions.map((item) => item.status))).toEqual(
        new Set([
          'closed',
          'remediated',
          'under_review',
          'in_progress',
          'pending_evidence',
          'rejected',
          'assigned',
          'open',
          'accepted_risk',
        ]),
      )
      const accepted = (await listRisks(ctx, nadall)).filter((risk) => risk.status === 'accepted')
      expect(accepted.map((risk) => [risk.questionCode, risk.findingStatus])).toEqual([
        ['Q-NOT-03', 'open'],
      ])

      // The story is dated: the baseline was completed about four months ago.
      const [dated] = await withTenants(owner.db, 'all', (tx) =>
        tx
          .select({ completedAt: assessment.completedAt })
          .from(assessment)
          .where(eq(assessment.id, baseline?.id ?? '')),
      )
      const daysAgo = (Date.now() - (dated?.completedAt?.getTime() ?? 0)) / 86_400_000
      expect(daysAgo).toBeGreaterThan(119)
      expect(daysAgo).toBeLessThan(121)
      const answered = await withTenants(owner.db, 'all', (tx) =>
        tx
          .select({ at: assessmentItem.answeredAt })
          .from(assessmentItem)
          .where(inArray(assessmentItem.tenantId, [nadall, idOf('AMMA')])),
      )
      const times = answered.flatMap((item) => (item.at ? [item.at.getTime()] : []))
      expect(times.length).toBeGreaterThan(100)
      expect(Math.max(...times)).toBeLessThan(Date.now() - 86_400_000 / 2)

      // AMMA: the first assessment in progress, two answers sent back, overdue actions.
      const amma = idOf('AMMA')
      const [ammaCycle] = await listAssessments(ctx, amma)
      expect([ammaCycle?.status, ammaCycle?.progress.returned]).toEqual(['in_progress', 2])
      expect((await listActions(ctx, amma, { overdue: true })).length).toBeGreaterThanOrEqual(2)

      // Every evidence record has its file.
      const stored = await withTenants(owner.db, 'all', (tx) =>
        tx
          .select({ key: evidence.storageKey })
          .from(evidence)
          .where(inArray(evidence.tenantId, [nadall, amma])),
      )
      expect(stored.every((item) => files.has(item.key))).toBe(true)

      // Reloading replaces the demo: new clients, the same story, the old files removed.
      const counts = async () =>
        withTenants(owner.db, 'all', async (tx) => {
          const ids = (await demoClients()).map((item) => item.id)
          return {
            findings: (
              await tx
                .select({ id: finding.id })
                .from(finding)
                .where(inArray(finding.tenantId, ids))
            ).length,
            actions: (
              await tx
                .select({ id: remediationAction.id })
                .from(remediationAction)
                .where(inArray(remediationAction.tenantId, ids))
            ).length,
          }
        })
      const before = await counts()
      await loadDemo(deps)
      const reloaded = await demoClients()
      expect(reloaded.map((item) => item.id).sort()).not.toEqual(
        clients.map((item) => item.id).sort(),
      )
      expect(await counts()).toEqual(before)
      expect(files.size).toBe(stored.length)
    },
  )
})
