import { randomBytes, randomUUID } from 'node:crypto'
import { AccessDeniedError, type Principal, type Role } from '@duatf/core-access'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  and,
  assessment,
  createDatabase,
  eq,
  inArray,
  question,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { answerItem, createAssessment, listItems } from './assessments'
import { createClient } from './clients'
import type { ServiceContext } from './context'
import { ValidationError } from './errors'
import { getFinding, listFindings } from './findings'
import { acceptRisk, listBands, listRisks, ratingFor, updateRisk, validateBands } from './risks'

const env = parseEnv(testDatabaseEnvSchema)

let app: DatabaseHandle
let owner: DatabaseHandle
const codes: string[] = []
const provisioner = {
  provision: () => Promise.resolve('none'),
  setEnabled: () => Promise.resolve(),
}

const principal = (role: Role, clientId: string | null = null): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId, departmentId: null }],
})
const as = (who: Principal): ServiceContext => ({ db: app.db, principal: who, provisioner })
const lead = principal('lead_auditor')
const auditor = principal('auditor')

const setup = async () => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const client = await createClient(as(lead), {
    name: `F${tag} Findings`,
    legalName: `F${tag} Findings Pvt Ltd`,
    industry: 'Banking',
    organisationType: 'private_limited',
    primaryContactName: 'Nisha',
    primaryContactEmail: 'nisha@example.test',
  })
  codes.push(client.code)
  const cycle = await createAssessment(as(lead), client.id, { title: 'Findings cycle' })
  const items = await listItems(as(lead), client.id, cycle.id)
  return { client, cycle, items }
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

describe('gap rules', () => {
  it('TC-C8.1-01 opens exactly one finding for No, and Yes closes it with history', async () => {
    const { client, items } = await setup()
    const item = items[0]
    const answer = (value: string) =>
      answerItem(as(auditor), client.id, item?.id ?? '', {
        answer: value,
        naReason: 'Not relevant here at all.',
      })

    await answer('no')
    await answer('no')
    const open = await listFindings(as(lead), client.id, { status: 'open' })
    expect(open).toHaveLength(1)
    expect(open[0]).toMatchObject({
      gapType: 'gap',
      questionCode: item?.questionCode,
      riskStatus: 'open',
    })
    expect(await listRisks(as(lead), client.id)).toHaveLength(1)

    await answer('partial')
    await answer('yes')
    const closed = await listFindings(as(lead), client.id)
    expect(closed).toHaveLength(1)
    expect(closed[0]).toMatchObject({
      status: 'closed',
      closedReason: 'Answered Yes',
      riskStatus: 'closed',
    })

    await answer('no')
    const history = await getFinding(as(lead), client.id, closed[0]?.code ?? '')
    expect(history.id).toBe(closed[0]?.id)
    expect(history.status).toBe('open')
    expect(history.events.map((event) => event.kind)).toEqual([
      'opened',
      'downgraded',
      'closed',
      'reopened',
    ])
    expect(await listFindings(as(lead), client.id)).toHaveLength(1)

    await answer('not_applicable')
    expect((await getFinding(as(lead), client.id, history.code)).closedReason).toBe(
      'Answered Not applicable',
    )
  })
})

describe('risk scoring', () => {
  it('TC-C8.2-01 scores likelihood x impact into the configured bands', async () => {
    const bands = await listBands(owner.db)
    expect(validateBands(bands)).toBeNull()
    const ratings = [4, 5, 9, 10, 16, 17, 25].map(
      (score) => `${score} ${ratingFor(score, bands).name}`,
    )
    expect(ratings).toEqual([
      '4 Low',
      '5 Medium',
      '9 Medium',
      '10 High',
      '16 High',
      '17 Critical',
      '25 Critical',
    ])

    // Bands are configuration: a different set rates the same scores differently.
    const strict = [
      { name: 'Acceptable', minScore: 1, maxScore: 3, tone: 'live' },
      { name: 'Serious', minScore: 4, maxScore: 25, tone: 'severe' },
    ]
    expect(validateBands(strict)).toBeNull()
    expect(ratingFor(4, strict).name).toBe('Serious')
    expect(
      validateBands([
        { name: 'Only', minScore: 2, maxScore: 25, tone: 'live' },
        { name: 'X', minScore: 26, maxScore: 26, tone: 'live' },
      ]),
    ).not.toBeNull()
    expect(
      validateBands([
        ...strict.slice(0, 1),
        { name: 'Gap', minScore: 5, maxScore: 25, tone: 'severe' },
      ]),
    ).toMatch(/should start at 4/)

    const { client, items } = await setup()
    await answerItem(as(auditor), client.id, items[0]?.id ?? '', { answer: 'no' })
    const [first] = await listRisks(as(lead), client.id)
    await updateRisk(as(auditor), client.id, first?.id ?? '', {
      likelihood: '4',
      impact: '4',
      treatment: 'mitigate',
      status: 'open',
    })
    const [rated] = await listRisks(as(lead), client.id)
    expect([rated?.score, rated?.band.name]).toEqual([16, 'High'])

    await expect(
      acceptRisk(as(auditor), client.id, rated?.id ?? '', { note: 'Business accepts it.' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    const shortNote = await acceptRisk(
      as(principal('client_dpo', client.id)),
      client.id,
      rated?.id ?? '',
      {
        note: 'ok',
      },
    ).catch((error: unknown) => error)
    expect(shortNote).toBeInstanceOf(ValidationError)
    await acceptRisk(as(principal('client_dpo', client.id)), client.id, rated?.id ?? '', {
      note: 'Legacy system retires in March; compensating monitoring in place.',
    })
    const [accepted] = await listRisks(as(lead), client.id)
    expect([accepted?.status, accepted?.treatment]).toEqual(['accepted', 'accept'])
  })
})

describe('recommendations', () => {
  it("TC-C8.3-01 gives a finding its question's recommendation and references", async () => {
    const { client, cycle, items } = await setup()
    const chosen = items.slice(0, 5)
    for (const item of chosen) {
      await answerItem(as(auditor), client.id, item.id, { answer: 'partial' })
    }
    const [pinned] = await withTenants(owner.db, 'all', (tx) =>
      tx
        .select({ releaseId: assessment.releaseId })
        .from(assessment)
        .where(eq(assessment.id, cycle.id)),
    )
    const sources = await owner.db
      .select({
        code: question.code,
        recommendation: question.recommendation,
        references: question.references,
      })
      .from(question)
      .where(
        and(
          eq(question.releaseId, pinned?.releaseId ?? ''),
          inArray(
            question.code,
            chosen.map((item) => item.questionCode),
          ),
        ),
      )
    const findings = await listFindings(as(lead), client.id)
    expect(findings).toHaveLength(5)
    for (const row of findings) {
      const detail = await getFinding(as(lead), client.id, row.code)
      const source = sources.find((item) => item.code === detail.questionCode)
      expect(detail.recommendation.length).toBeGreaterThan(20)
      expect(detail.recommendation).toBe(source?.recommendation)
      expect(detail.references).toEqual(source?.references)
      expect(detail.references.length).toBeGreaterThan(0)
    }
  })
})
