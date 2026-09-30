import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Principal, Role } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  and,
  appUser,
  assessment,
  createDatabase,
  eq,
  finding,
  findingEvent,
  inArray,
  risk,
  roleAssignment,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createAction,
  createReassessment,
  getAction,
  linkActionEvidence,
  transitionAction,
} from './actions'
import { answerItem, createAssessment, listItems } from './assessments'
import { createClient } from './clients'
import type { EvidenceStorage, ServiceContext } from './context'
import { clientFigures } from './dashboard'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { acceptRisk, listRisks, updateRisk } from './risks'

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
let fixer: Principal
let checker: Principal

const newClient = async () => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `L${tag} Lifecycle`,
    legalName: `L${tag} Lifecycle Pvt Ltd`,
    industry: 'Healthcare',
    organisationType: 'private_limited',
    primaryContactName: 'Nila',
    primaryContactEmail: 'nila@example.test',
  })
  codes.push(client.code)
  return client
}

const pdf = (text: string) => Buffer.from(`%PDF-1.4\n% ${text}\n%%EOF\n`)

/** Takes an action from Assigned to Closed with accepted evidence, as the workflow requires. */
const remediate = async (clientId: string, actionId: string) => {
  const move = (to: string, who: Principal) => transitionAction(as(who), clientId, actionId, { to })
  await move('in_progress', fixer)
  const file = await uploadEvidence(
    as(fixer),
    clientId,
    { title: 'Proof of the fix' },
    { name: 'fix.pdf', bytes: pdf(actionId) },
  )
  await linkActionEvidence(as(fixer), clientId, actionId, file.id)
  await move('under_review', fixer)
  await reviewEvidence(as(checker), clientId, file.id, { decision: 'accepted' })
  await move('remediated', checker)
  return move('closed', checker)
}

const findingById = (id: string) =>
  withTenants(
    owner.db,
    'all',
    async (tx) => (await tx.select().from(finding).where(eq(finding.id, id)))[0],
  )

const riskOf = (findingId: string) =>
  withTenants(
    owner.db,
    'all',
    async (tx) => (await tx.select().from(risk).where(eq(risk.findingId, findingId)))[0],
  )

beforeAll(async () => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
  lead = await staff('lead_auditor')
  fixer = await staff('auditor')
  checker = await staff('auditor')
})
afterAll(async () => {
  if (codes.length) {
    await withTenants(owner.db, 'all', (tx) => tx.delete(tenant).where(inArray(tenant.code, codes)))
  }
  if (emails.length) await owner.db.delete(appUser).where(inArray(appUser.email, emails))
  await Promise.all([app.close(), owner.close()])
})

describe('finding closure', () => {
  it('TC-C9.4-01 closes a finding and its risk when the last action is verified and closed', async () => {
    const client = await newClient()
    const cycle = await createAssessment(as(lead), client.id, { title: 'Cycle 1' })
    const items = await listItems(as(lead), client.id, cycle.id)
    await answerItem(as(lead), client.id, items[0]?.id ?? '', { answer: 'no' })
    const [gap] = await listFindings(as(lead), client.id)
    const first = await createAction(as(lead), client.id, gap?.id ?? '', {
      title: 'Write the policy',
      ownerUserId: fixer.userId,
    })
    const second = await createAction(as(lead), client.id, gap?.id ?? '', {
      title: 'Train the staff',
      ownerUserId: fixer.userId,
    })

    await remediate(client.id, first.id)
    expect((await findingById(gap?.id ?? ''))?.status).toBe('open')

    await remediate(client.id, second.id)
    const closed = await findingById(gap?.id ?? '')
    expect([closed?.status, closed?.closedReason?.startsWith('Remediated')]).toEqual([
      'closed',
      true,
    ])
    expect((await riskOf(gap?.id ?? ''))?.status).toBe('closed')
    const kinds = await withTenants(owner.db, 'all', (tx) =>
      tx
        .select({ kind: findingEvent.kind })
        .from(findingEvent)
        .where(eq(findingEvent.findingId, gap?.id ?? '')),
    )
    expect(kinds.map((row) => row.kind)).toEqual(['opened', 'remediated'])

    // A later No on the same question reopens the finding: the answer is the evidence.
    await answerItem(as(lead), client.id, items[0]?.id ?? '', { answer: 'no' })
    expect((await findingById(gap?.id ?? ''))?.status).toBe('open')
  })

  it('TC-C9.4-02 lets a re-assessment resolve or carry forward earlier findings without double counting', async () => {
    const client = await newClient()
    const cycle = await createAssessment(as(lead), client.id, { title: 'Cycle 1' })
    const items = await listItems(as(lead), client.id, cycle.id)
    const answers = ['no', 'partial', 'no', 'partial'] as const
    for (const [index, answer] of answers.entries()) {
      await answerItem(as(lead), client.id, items[index]?.id ?? '', { answer })
    }
    const first = await listFindings(as(lead), client.id)
    const byQuestion = (rows: typeof first, code: string | undefined) =>
      rows.find((row) => row.questionCode === code)
    const [q0, q1, q2, q3] = items.slice(0, 4).map((item) => item.questionCode)
    const f1 = byQuestion(first, q1)
    const f3 = byQuestion(first, q3)

    // The auditor re-rates one risk and plans an action; the client accepts another risk.
    const risks = await listRisks(as(lead), client.id)
    const r1 = risks.find((row) => row.findingCode === f1?.code)
    await updateRisk(as(lead), client.id, r1?.id ?? '', {
      likelihood: 5,
      impact: 5,
      treatment: 'mitigate',
      status: 'open',
      ownerName: 'Head of IT',
    })
    const action = await createAction(as(lead), client.id, f1?.id ?? '', {
      title: 'Fix it properly',
      ownerUserId: fixer.userId,
    })
    await transitionAction(as(fixer), client.id, action.id, { to: 'in_progress' })
    const dpo: Principal = {
      ...lead,
      userId: randomUUID(),
      assignments: [{ role: 'client_dpo', clientId: client.id, departmentId: null }],
    }
    const r3 = risks.find((row) => row.findingCode === f3?.code)
    await acceptRisk(as(dpo), client.id, r3?.id ?? '', {
      note: 'Accepted until the new system goes live.',
    })

    await withTenants(owner.db, 'all', (tx) =>
      tx.update(assessment).set({ status: 'completed' }).where(eq(assessment.id, cycle.id)),
    )
    const next = await createReassessment(as(lead), client.id, cycle.id, { title: 'Cycle 2' })
    const nextItems = await listItems(as(lead), client.id, next.id)
    const itemFor = (code: string | undefined) =>
      nextItems.find((item) => item.questionCode === code)?.id ?? ''
    expect((await listFindings(as(lead), client.id, { status: 'open' })).length).toBe(4)

    await answerItem(as(lead), client.id, itemFor(q0), { answer: 'yes' })
    await answerItem(as(lead), client.id, itemFor(q1), { answer: 'no' })
    await answerItem(as(lead), client.id, itemFor(q3), { answer: 'partial' })

    const after = await listFindings(as(lead), client.id)
    const open = after.filter((row) => row.status === 'open')
    // q0 resolved, q1 and q3 carried forward to cycle 2, q2 (not yet re-answered) stays open.
    expect(open.map((row) => [row.questionCode, row.assessmentId]).sort()).toEqual(
      [
        [q1, next.id],
        [q2, cycle.id],
        [q3, next.id],
      ].sort(),
    )
    const old0 = after.find((row) => row.questionCode === q0 && row.assessmentId === cycle.id)
    const old1 = after.find((row) => row.questionCode === q1 && row.assessmentId === cycle.id)
    const new1 = after.find((row) => row.questionCode === q1 && row.assessmentId === next.id)
    const new3 = after.find((row) => row.questionCode === q3 && row.assessmentId === next.id)
    expect(old0?.closedReason).toBe(`Resolved in ${next.code} (answered Yes)`)
    expect(old1?.closedReason).toBe(`Carried forward to ${new1?.code ?? ''} (${next.code})`)

    // The unfinished action follows the gap, and the risk keeps its rating and acceptance.
    const moved = await getAction(as(lead), client.id, action.code)
    expect([moved.findingId, moved.status]).toEqual([new1?.id, 'in_progress'])
    expect(moved.events.at(-1)?.note).toContain(`to ${new1?.code ?? ''}`)
    const carriedRisk = await riskOf(new1?.id ?? '')
    expect([carriedRisk?.likelihood, carriedRisk?.impact, carriedRisk?.ownerName]).toEqual([
      5,
      5,
      'Head of IT',
    ])
    const acceptedRisk = await riskOf(new3?.id ?? '')
    expect([acceptedRisk?.status, acceptedRisk?.acceptanceNote]).toEqual([
      'accepted',
      'Accepted until the new system goes live.',
    ])
    const closedRisks = await withTenants(owner.db, 'all', (tx) =>
      tx
        .select({ status: risk.status })
        .from(risk)
        .where(
          and(
            eq(risk.tenantId, client.id),
            inArray(risk.findingId, [old0?.id ?? '', old1?.id ?? '']),
          ),
        ),
    )
    expect(closedRisks.map((row) => row.status)).toEqual(['closed', 'closed'])

    const figures = await clientFigures(as(lead), client.id)
    expect(figures.openFindings.gap + figures.openFindings.potentialGap).toBe(open.length)
  })
})
