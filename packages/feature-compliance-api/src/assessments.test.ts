import { randomBytes, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { AccessDeniedError, type Principal, type Role } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  assessmentItem,
  createDatabase,
  desc,
  eq,
  frameworkRelease,
  inArray,
  question,
  sql,
  tenant,
  withTenants,
  type Answer,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  answerItem,
  assignItems,
  changeAssessmentStatus,
  createAssessment,
  getAssessment,
  listItems,
  reviewItem,
} from './assessments'
import { createClient } from './clients'
import type { ServiceContext } from './context'
import { createDepartment } from './departments'
import { RuleError, type ValidationError } from './errors'
import { COMPLIANCE_OF, summariseProgress, type Progress } from './progress'

const env = parseEnv(testDatabaseEnvSchema)
const golden = JSON.parse(
  readFileSync(new URL('./fixtures/progress.golden.json', import.meta.url), 'utf8'),
) as {
  answers: Record<'yes' | 'partial' | 'no' | 'not_applicable', number>
  reviews: { accepted: number; returned: number }
  expected: Progress
}

let app: DatabaseHandle
let owner: DatabaseHandle
const codes: string[] = []
const provisioner = {
  provision: () => Promise.resolve('none'),
  setEnabled: () => Promise.resolve(),
}

const principal = (
  role: Role,
  clientId: string | null = null,
  departmentId: string | null = null,
): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId }],
})
const as = (who: Principal): ServiceContext => ({ db: app.db, principal: who, provisioner })
const lead = principal('lead_auditor')
const auditorA = principal('auditor')
const auditorB = principal('auditor')

const newClient = async () => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const created = await createClient(as(lead), {
    name: `A${tag} Assessments`,
    legalName: `A${tag} Assessments Pvt Ltd`,
    industry: 'Insurance',
    organisationType: 'private_limited',
    primaryContactName: 'Ravi Menon',
    primaryContactEmail: 'ravi@example.test',
  })
  codes.push(created.code)
  return created
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

describe('assessment cycles', () => {
  it('TC-C6.1-01 pins the published release and creates one item per question', async () => {
    const client = await newClient()
    const created = await createAssessment(as(lead), client.id, { title: 'DPDP readiness 2026' })
    expect(created.code).toBe(`ASM-${client.code}-001`)

    const [release] = await owner.db
      .select({ id: frameworkRelease.id, version: frameworkRelease.version })
      .from(frameworkRelease)
      .where(eq(frameworkRelease.status, 'published'))
      .orderBy(desc(frameworkRelease.publishedAt))
      .limit(1)
    const questions = await owner.db
      .select({ code: question.code })
      .from(question)
      .where(eq(question.releaseId, release?.id ?? ''))
    const detail = await getAssessment(as(lead), client.id, created.code)
    const items = await listItems(as(lead), client.id, created.id)

    expect(detail.releaseVersion).toBe(release?.version)
    expect(items.length).toBe(questions.length)
    expect(new Set(items.map((item) => item.questionCode))).toEqual(
      new Set(questions.map((row) => row.code)),
    )
    expect(detail.progress.pending).toBe(questions.length)
  })
})

describe('department assignment', () => {
  it("TC-C6.2-01 lets a department owner answer only their department's items", async () => {
    const client = await newClient()
    const hr = await createDepartment(as(lead), client.id, { code: 'HR', name: 'Human Resources' })
    const it_ = await createDepartment(as(lead), client.id, { code: 'IT', name: 'Technology' })
    const { id } = await createAssessment(as(lead), client.id, { title: 'Cycle' })
    await assignItems(as(lead), client.id, id, { domainCode: 'D01', departmentId: hr.id })
    await assignItems(as(lead), client.id, id, { domainCode: 'D09', departmentId: it_.id })
    const items = await listItems(as(lead), client.id, id)
    const hrItem = items.find((item) => item.domainCode === 'D01')
    const itItem = items.find((item) => item.domainCode === 'D09')
    const unassigned = items.find((item) => item.departmentId === null)
    const hrOwner = as(principal('department_owner', client.id, hr.id))

    await expect(
      answerItem(hrOwner, client.id, hrItem?.id ?? '', { answer: 'yes' }),
    ).resolves.toEqual({
      complianceState: 'compliant',
    })
    await expect(
      answerItem(hrOwner, client.id, itItem?.id ?? '', { answer: 'yes' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(
      answerItem(hrOwner, client.id, unassigned?.id ?? '', { answer: 'yes' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    const otherClientOwner = as(principal('department_owner', randomUUID(), hr.id))
    await expect(
      answerItem(otherClientOwner, client.id, hrItem?.id ?? '', { answer: 'no' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
  })
})

describe('answers', () => {
  it('TC-C6.3-01 needs a reason for Not applicable and maps every answer to its compliance state', async () => {
    const client = await newClient()
    const { id } = await createAssessment(as(lead), client.id, { title: 'Cycle' })
    const items = await listItems(as(lead), client.id, id)
    const noReason = await answerItem(as(auditorA), client.id, items[0]?.id ?? '', {
      answer: 'not_applicable',
      naReason: 'too short',
    }).catch((error: unknown) => error)
    expect(Object.keys((noReason as ValidationError).fieldErrors)).toEqual(['naReason'])

    const answers: Answer[] = ['yes', 'partial', 'no', 'not_applicable', 'not_assessed']
    for (const [index, answer] of answers.entries()) {
      await answerItem(as(auditorA), client.id, items[index]?.id ?? '', {
        answer,
        naReason: 'The client runs no loyalty programme or marketing.',
      })
    }
    const stored = await withTenants(owner.db, 'all', (tx) =>
      tx
        .select({
          id: assessmentItem.id,
          answer: assessmentItem.answer,
          state: assessmentItem.complianceState,
          reason: assessmentItem.naReason,
        })
        .from(assessmentItem)
        .where(
          inArray(
            assessmentItem.id,
            items.slice(0, 5).map((item) => item.id),
          ),
        ),
    )
    for (const row of stored) expect(row.state, row.answer).toBe(COMPLIANCE_OF[row.answer])
    expect(stored.filter((row) => row.reason !== null).map((row) => row.answer)).toEqual([
      'not_applicable',
    ])

    // The database refuses Not applicable without a reason even when the service is bypassed.
    await expect(
      withTenants(owner.db, 'all', (tx) =>
        tx.execute(
          sql`update assessment_item set answer = 'not_applicable', na_reason = null where id = ${items[5]?.id ?? ''}`,
        ),
      ),
    ).rejects.toThrow()
  })
})

describe('review and progress', () => {
  it('TC-C6.4-01 reports progress and compliance equal to the golden fixture', async () => {
    const plan: Answer[] = (['yes', 'partial', 'no', 'not_applicable'] as const).flatMap((answer) =>
      Array.from({ length: golden.answers[answer] }, () => answer),
    )
    const counted = summariseProgress([
      ...(['yes', 'partial', 'no', 'not_applicable'] as const).map((answer) => ({
        complianceState: COMPLIANCE_OF[answer],
        reviewState: 'not_reviewed' as const,
        n: golden.answers[answer],
      })),
    ])
    expect(counted.answered).toBe(golden.expected.answered)

    const client = await newClient()
    const { id, code } = await createAssessment(as(lead), client.id, { title: 'Golden cycle' })
    const items = await listItems(as(lead), client.id, id)
    for (const [index, answer] of plan.entries()) {
      await answerItem(as(auditorA), client.id, items[index]?.id ?? '', {
        answer,
        naReason: 'Not relevant to this client in the assessment period.',
      })
    }
    await expect(
      reviewItem(as(auditorA), client.id, items[0]?.id ?? '', { decision: 'accepted' }),
    ).rejects.toBeInstanceOf(RuleError)
    for (let index = 0; index < golden.reviews.accepted; index += 1) {
      await reviewItem(as(auditorB), client.id, items[index]?.id ?? '', { decision: 'accepted' })
    }
    for (let offset = 0; offset < golden.reviews.returned; offset += 1) {
      const index = golden.reviews.accepted + offset
      await reviewItem(as(auditorB), client.id, items[index]?.id ?? '', {
        decision: 'returned',
        note: 'Attach the signed policy.',
      })
    }

    const detail = await getAssessment(as(lead), client.id, code)
    expect(detail.progress).toEqual(golden.expected)
    await expect(changeAssessmentStatus(as(lead), client.id, id, 'in_review')).rejects.toThrow(
      `${golden.expected.pending} questions are not answered yet.`,
    )
  })
})
