import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Principal, Role } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  appUser,
  assessment,
  createDatabase,
  eq,
  inArray,
  roleAssignment,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ACTION_FLOW,
  createAction,
  createReassessment,
  getAction,
  linkActionEvidence,
  transitionAction,
} from './actions'
import { answerItem, assignItems, createAssessment, listItems } from './assessments'
import { createClient } from './clients'
import type { EvidenceStorage, ServiceContext } from './context'
import { createDepartment } from './departments'
import { RuleError } from './errors'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { acceptRisk, listRisks } from './risks'

const env = parseEnv(testDatabaseEnvSchema)

let app: DatabaseHandle
let owner: DatabaseHandle
const codes: string[] = []
const emails: string[] = []
const provisioner = {
  provision: () => Promise.resolve('none'),
  setEnabled: () => Promise.resolve(),
}
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

const as = (who: Principal): ServiceContext => ({
  db: app.db,
  principal: who,
  provisioner,
  storage,
})

/** A real user row with one firm-wide role, so it can own actions. */
const staff = async (role: Role): Promise<Principal> => {
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

let lead: Principal
let auditorA: Principal
let auditorB: Principal

const setupFinding = async () => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `R${tag} Remediation`,
    legalName: `R${tag} Remediation Pvt Ltd`,
    industry: 'Logistics',
    organisationType: 'private_limited',
    primaryContactName: 'Farah',
    primaryContactEmail: 'farah@example.test',
  })
  codes.push(client.code)
  const cycle = await createAssessment(as(lead), client.id, { title: 'Remediation cycle' })
  const items = await listItems(as(lead), client.id, cycle.id)
  await answerItem(as(auditorB), client.id, items[0]?.id ?? '', { answer: 'no' })
  const [found] = await listFindings(as(lead), client.id)
  return { client, cycle, items, finding: found }
}

const pdf = (text: string) => Buffer.from(`%PDF-1.4\n% ${text}\n%%EOF\n`)

beforeAll(async () => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
  lead = await staff('lead_auditor')
  auditorA = await staff('auditor')
  auditorB = await staff('auditor')
})
afterAll(async () => {
  if (codes.length) {
    await withTenants(owner.db, 'all', (tx) => tx.delete(tenant).where(inArray(tenant.code, codes)))
  }
  if (emails.length) await owner.db.delete(appUser).where(inArray(appUser.email, emails))
  await Promise.all([app.close(), owner.close()])
})

describe('remediation workflow', () => {
  it('TC-C9.1-01 accepts only the allowed status transitions', async () => {
    const { client, finding } = await setupFinding()
    const created = await createAction(as(lead), client.id, finding?.id ?? '', {
      title: 'Adopt a DPDP programme charter',
    })
    const move = (to: string, who = lead) =>
      transitionAction(as(who), client.id, created.id, { to })

    await expect(move('closed')).rejects.toBeInstanceOf(RuleError)
    await expect(move('in_progress')).rejects.toBeInstanceOf(RuleError)
    await expect(move('accepted_risk')).rejects.toBeInstanceOf(RuleError)
    await expect(move('assigned')).resolves.toBe('assigned')
    await expect(move('under_review')).rejects.toBeInstanceOf(RuleError)
    await expect(move('in_progress', auditorA)).resolves.toBe('in_progress')

    const reachable = new Set(
      Object.values(ACTION_FLOW).flatMap((steps) => steps.map((step) => step.to)),
    )
    expect(reachable.has('accepted_risk')).toBe(false)
    expect(ACTION_FLOW.closed).toEqual([])

    // Accepting the finding's risk is the only way to Accepted Risk.
    const [linkedRisk] = await listRisks(as(lead), client.id)
    const dpo: Principal = {
      ...lead,
      userId: randomUUID(),
      assignments: [{ role: 'client_dpo', clientId: client.id, departmentId: null }],
    }
    await acceptRisk(as(dpo), client.id, linkedRisk?.id ?? '', {
      note: 'Board accepted this until the March migration.',
    })
    const detail = await getAction(as(lead), client.id, created.code)
    expect(detail.status).toBe('accepted_risk')
    expect(detail.events.map((event) => event.toStatus)).toEqual([
      'open',
      'assigned',
      'in_progress',
      'accepted_risk',
    ])
  })
})

describe('verification', () => {
  it('TC-C9.2-01 refuses closing without accepted evidence or by the owner', async () => {
    const { client, finding } = await setupFinding()
    const created = await createAction(as(lead), client.id, finding?.id ?? '', {
      title: 'Publish the DPO contact',
      ownerUserId: auditorA.userId,
      dueDate: '2026-12-31',
    })
    const move = (to: string, who: Principal) =>
      transitionAction(as(who), client.id, created.id, { to })
    await move('in_progress', auditorA)
    await expect(move('under_review', auditorA)).rejects.toThrow('Attach evidence')

    const uploaded = await uploadEvidence(
      as(auditorA),
      client.id,
      { title: 'Website screenshot' },
      { name: 'contact.pdf', bytes: pdf('contact') },
    )
    await linkActionEvidence(as(auditorA), client.id, created.id, uploaded.id)
    await move('under_review', auditorA)
    await expect(move('remediated', auditorA)).rejects.toThrow('owner of an action cannot')
    await expect(move('remediated', auditorB)).rejects.toThrow('must be accepted first')

    await reviewEvidence(as(auditorB), client.id, uploaded.id, { decision: 'accepted' })
    await expect(move('remediated', auditorB)).resolves.toBe('remediated')
    await expect(move('closed', auditorA)).rejects.toThrow('owner of an action cannot')
    await expect(move('closed', auditorB)).resolves.toBe('closed')
    const detail = await getAction(as(lead), client.id, created.code)
    expect([detail.status, detail.verifiedBy, detail.evidence.map((row) => row.code)]).toEqual([
      'closed',
      auditorB.userId,
      [uploaded.code],
    ])
  })
})

describe('re-assessment', () => {
  it('TC-C9.3-01 copies department assignments and links to the previous cycle', async () => {
    const { client, cycle } = await setupFinding()
    const hr = await createDepartment(as(lead), client.id, { code: 'HR', name: 'People' })
    const assigned = await assignItems(as(lead), client.id, cycle.id, {
      domainCode: 'D01',
      departmentId: hr.id,
    })
    expect(assigned).toBeGreaterThan(0)

    await expect(
      createReassessment(as(lead), client.id, cycle.id, { title: 'Too early' }),
    ).rejects.toBeInstanceOf(RuleError)
    await withTenants(owner.db, 'all', (tx) =>
      tx.update(assessment).set({ status: 'completed' }).where(eq(assessment.id, cycle.id)),
    )

    const next = await createReassessment(as(lead), client.id, cycle.id, { title: 'Cycle 2' })
    expect(next.copied).toBe(assigned)
    const [row] = await withTenants(owner.db, 'all', (tx) =>
      tx
        .select({ previous: assessment.previousAssessmentId })
        .from(assessment)
        .where(eq(assessment.id, next.id)),
    )
    expect(row?.previous).toBe(cycle.id)
    const items = await listItems(as(lead), client.id, next.id)
    const inHr = items.filter((item) => item.departmentId === hr.id)
    expect(inHr).toHaveLength(assigned)
    expect(new Set(inHr.map((item) => item.domainCode))).toEqual(new Set(['D01']))
    expect(items.every((item) => item.answer === 'not_assessed')).toBe(true)
  })
})
