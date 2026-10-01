import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Principal } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import { isoDate } from '@duatf/core-utils'
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
  notExists,
  notInArray,
  remediationAction,
  risk,
  roleAssignment,
  sql,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { attentionFor, type AttentionItem, type AttentionKind } from './attention'
import { answerItem, assignItems, createAssessment, listItems, reviewItem } from './assessments'
import { createClient } from './clients'
import type { EvidenceStorage, ServiceContext } from './context'
import { createDepartment } from './departments'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import { listBands } from './risks'
import { searchWorkspace } from './search'

const env = parseEnv(testDatabaseEnvSchema)

let app: DatabaseHandle
let owner: DatabaseHandle
const codes: string[] = []
const emails: string[] = []
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
  provisioner: { provision: () => Promise.resolve('none'), setEnabled: () => Promise.resolve() },
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

const clientPerson = (
  role: 'client_dpo' | 'department_owner',
  clientId: string,
  departmentId: string | null = null,
): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId }],
})

const newClient = async (name: string) => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `${name} ${tag}`,
    legalName: `${name} ${tag} Pvt Ltd`,
    industry: 'Healthcare',
    organisationType: 'private_limited',
    primaryContactName: 'Asha',
    primaryContactEmail: 'asha@example.test',
    status: 'active',
  })
  codes.push(client.code)
  return client
}

const pdf = (text: string) => Buffer.from(`%PDF-1.4\n% ${text}\n%%EOF\n`)

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

/**
 * A client with People (D01) and Technology (D09) departments: answers in both, one Technology
 * answer sent back and one accepted, an overdue Technology action, a People action due later,
 * and one evidence file waiting for review.
 */
const scenario = async () => {
  const client = await newClient('Workspace')
  const people = await createDepartment(as(lead), client.id, { code: 'HR', name: 'People' })
  const tech = await createDepartment(as(lead), client.id, { code: 'IT', name: 'Technology' })
  const cycle = await createAssessment(as(lead), client.id, { title: 'Baseline' })
  await assignItems(as(lead), client.id, cycle.id, { domainCode: 'D01', departmentId: people.id })
  await assignItems(as(lead), client.id, cycle.id, { domainCode: 'D09', departmentId: tech.id })
  const items = await listItems(as(lead), client.id, cycle.id)
  const inDomain = (code: string, index: number) =>
    items.filter((item) => item.domainCode === code)[index]?.id ?? ''
  for (const [domainCode, index, answer] of [
    ['D01', 0, 'no'],
    ['D01', 1, 'partial'],
    ['D09', 0, 'no'],
    ['D09', 1, 'yes'],
    ['D09', 2, 'no'],
  ] as const) {
    await answerItem(as(lead), client.id, inDomain(domainCode, index), { answer })
  }
  await reviewItem(as(reviewer), client.id, inDomain('D09', 0), {
    decision: 'returned',
    note: 'Attach the encryption settings.',
  })
  await reviewItem(as(reviewer), client.id, inDomain('D09', 1), { decision: 'accepted' })
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
    dueDate: '2099-03-31',
  })
  const accepted = await uploadEvidence(
    as(lead),
    client.id,
    { title: 'Backup report', departmentId: tech.id },
    { name: 'backup.pdf', bytes: pdf('backup') },
  )
  await reviewEvidence(as(reviewer), client.id, accepted.id, { decision: 'accepted' })
  await uploadEvidence(
    as(lead),
    client.id,
    { title: 'Draft charter', departmentId: people.id },
    { name: 'charter.pdf', bytes: pdf('charter') },
  )
  return { client, people, tech }
}

/** The same work counted straight from the tables, as an independent oracle. */
const directCounts = async (clientId: string, departmentId: string | null, userId: string) => {
  const today = isoDate(new Date())
  const bands = (await listBands(owner.db)).filter((band) => band.tone === 'severe')
  return withTenants(owner.db, 'all', async (tx) => {
    const n = async (query: Promise<{ n: number }[]>) => (await query)[0]?.n ?? 0
    const inDepartment = departmentId ? eq(assessmentItem.departmentId, departmentId) : undefined
    const items = (condition: ReturnType<typeof eq>) =>
      n(
        tx
          .select({ n: count() })
          .from(assessmentItem)
          .where(and(eq(assessmentItem.tenantId, clientId), condition, inDepartment)),
      )
    return {
      overdue_actions: await n(
        tx
          .select({ n: count() })
          .from(remediationAction)
          .where(
            and(
              eq(remediationAction.tenantId, clientId),
              lt(remediationAction.dueDate, today),
              notInArray(remediationAction.status, ['closed', 'accepted_risk', 'remediated']),
              departmentId ? eq(remediationAction.departmentId, departmentId) : undefined,
            ),
          ),
      ),
      returned_answers: await items(eq(assessmentItem.reviewState, 'returned')),
      answers_to_review: await n(
        tx
          .select({ n: count() })
          .from(assessmentItem)
          .where(
            and(
              eq(assessmentItem.tenantId, clientId),
              ne(assessmentItem.answer, 'not_assessed'),
              eq(assessmentItem.reviewState, 'not_reviewed'),
            ),
          ),
      ),
      evidence_to_review: await n(
        tx
          .select({ n: count() })
          .from(evidence)
          .where(and(eq(evidence.tenantId, clientId), eq(evidence.status, 'pending_review'))),
      ),
      findings_without_actions: await n(
        tx
          .select({ n: count() })
          .from(finding)
          .where(
            and(
              eq(finding.tenantId, clientId),
              eq(finding.status, 'open'),
              notExists(
                tx
                  .select({ one: sql`1` })
                  .from(remediationAction)
                  .where(eq(remediationAction.findingId, finding.id)),
              ),
            ),
          ),
      ),
      serious_risks: await n(
        tx
          .select({ n: count() })
          .from(risk)
          .where(
            and(
              eq(risk.tenantId, clientId),
              eq(risk.status, 'open'),
              sql`(${sql.join(
                bands.map(
                  (band) => sql`${risk.score} between ${band.minScore} and ${band.maxScore}`,
                ),
                sql` or `,
              )})`,
            ),
          ),
      ),
      unanswered: await items(eq(assessmentItem.answer, 'not_assessed')),
      my_actions: await n(
        tx
          .select({ n: count() })
          .from(remediationAction)
          .where(
            and(
              eq(remediationAction.tenantId, clientId),
              eq(remediationAction.ownerUserId, userId),
            ),
          ),
      ),
    }
  })
}

const byKind = (items: AttentionItem[], clientId: string) => {
  const found: Partial<Record<AttentionKind, number>> = {}
  for (const item of items.filter((row) => row.clientId === clientId)) {
    found[item.kind] = (found[item.kind] ?? 0) + item.count
  }
  return found
}

const pick = (counts: Record<string, number>, kinds: AttentionKind[]) =>
  Object.fromEntries(
    kinds.flatMap((kind) => ((counts[kind] ?? 0) > 0 ? [[kind, counts[kind]]] : [])),
  )

describe('workspace: attention and search', () => {
  it('TC-C16.3-01 what needs attention equals direct counts, and only what each role can act on', async () => {
    const { client, tech } = await scenario()

    // The lead auditor answers, reviews, verifies and plans: every kind except risk acceptance.
    const leadDirect = await directCounts(client.id, null, lead.userId)
    expect(byKind(await attentionFor(as(lead), [client.id]), client.id)).toEqual(
      pick(leadDirect, [
        'overdue_actions',
        'returned_answers',
        'answers_to_review',
        'evidence_to_review',
        'findings_without_actions',
        'unanswered',
      ]),
    )
    expect(leadDirect.overdue_actions).toBe(1)
    expect(leadDirect.returned_answers).toBe(1)
    expect(leadDirect.evidence_to_review).toBe(1)

    // A Technology owner sees only Technology answer work and actions; no reviews, no planning.
    const techOwner = clientPerson('department_owner', client.id, tech.id)
    const techDirect = await directCounts(client.id, tech.id, techOwner.userId)
    expect(byKind(await attentionFor(as(techOwner)), client.id)).toEqual(
      pick(techDirect, ['overdue_actions', 'returned_answers', 'unanswered']),
    )

    // The DPO answers, plans and decides on serious risks, but does not review.
    const dpo = clientPerson('client_dpo', client.id)
    const dpoDirect = await directCounts(client.id, null, dpo.userId)
    expect(byKind(await attentionFor(as(dpo)), client.id)).toEqual(
      pick(dpoDirect, [
        'overdue_actions',
        'returned_answers',
        'serious_risks',
        'findings_without_actions',
        'unanswered',
      ]),
    )
  })

  it('TC-C16.5-01 search finds records by code or title, only in clients the user can open', async () => {
    const word = `Findme${randomBytes(3).toString('hex')}`
    const mine = await newClient(`${word} Clinic`)
    const other = await newClient(`${word} Hospital`)
    const dpo = clientPerson('client_dpo', mine.id)
    for (const client of [mine, other]) {
      const cycle = await createAssessment(as(lead), client.id, { title: 'Search baseline' })
      const [first] = await listItems(as(lead), client.id, cycle.id)
      await answerItem(as(lead), client.id, first?.id ?? '', { answer: 'no' })
    }
    const [mineFinding] = await listFindings(as(lead), mine.id)

    const forDpo = await searchWorkspace(as(dpo), word)
    expect(new Set(forDpo.map((hit) => hit.clientCode))).toEqual(new Set([mine.code]))
    expect(forDpo.some((hit) => hit.kind === 'client' && hit.code === mine.code)).toBe(true)
    // The other client's records do not appear, even by their exact code.
    expect(await searchWorkspace(as(dpo), other.code)).toEqual([])

    const forLead = await searchWorkspace(as(lead), word)
    expect(new Set(forLead.map((hit) => hit.clientCode))).toEqual(new Set([mine.code, other.code]))
    const byCode = await searchWorkspace(as(dpo), mineFinding?.code ?? 'none')
    expect(byCode.map((hit) => [hit.kind, hit.code, hit.href])).toEqual([
      ['finding', mineFinding?.code, `/clients/${mine.code}/findings/${mineFinding?.code}`],
    ])
    // Too short a query returns nothing rather than everything.
    expect(await searchWorkspace(as(lead), 'S')).toEqual([])
  })
})
