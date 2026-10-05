import { AccessDeniedError } from '@duatf/core-access'
import { and, assessment, eq, inArray, question, withTenants } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { answerItem } from './assessments'
import { ValidationError } from './errors'
import { getFinding, listFindings } from './findings'
import { acceptRisk, listBands, listRisks, ratingFor, updateRisk, validateBands } from './risks'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  newPerson,
  openWorld,
  type World,
} from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

describe('gap rules', () => {
  it('TC-C8.1-01 opens exactly one finding for a gap, and a compliant answer closes it with history', async () => {
    const client = await newClient(world, 'Findings')
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1'])
    const itemId = hr.item('A1.1').id
    const answer = (value: string) =>
      answerItem(world.ctx, client.id, itemId, {
        answer: value,
        naReason: 'Not relevant here at all.',
      })

    await answer('no')
    await answer('no')
    const open = await listFindings(world.ctx, client.id, { status: 'open' })
    expect(open).toHaveLength(1)
    expect(open[0]).toMatchObject({
      gapType: 'gap',
      questionCode: 'A1.1',
      departmentCode: 'HR',
      riskStatus: 'open',
    })
    expect(open[0]?.title).toBe('HR department: DPO or contact person appointed and published')
    expect(await listRisks(world.ctx, client.id)).toHaveLength(1)

    await answer('partial')
    await answer('yes')
    const closed = await listFindings(world.ctx, client.id)
    expect(closed).toHaveLength(1)
    expect(closed[0]).toMatchObject({
      status: 'closed',
      closedReason: 'Answered compliant',
      riskStatus: 'closed',
    })

    await answer('no')
    const history = await getFinding(world.ctx, client.id, closed[0]?.code ?? '')
    expect(history.id).toBe(closed[0]?.id)
    expect(history.status).toBe('open')
    expect(history.response).toBe('No')
    expect(history.events.map((event) => event.kind)).toEqual([
      'opened',
      'downgraded',
      'closed',
      'reopened',
    ])
    expect(await listFindings(world.ctx, client.id)).toHaveLength(1)

    await answer('not_applicable')
    expect((await getFinding(world.ctx, client.id, history.code)).closedReason).toBe(
      'Answered Not applicable',
    )
  })
})

describe('risk scoring', () => {
  it('TC-C8.2-01 scores likelihood x impact into the configured bands; the impact starts from the template risk weight', async () => {
    const bands = await listBands(world.owner.db)
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
    const strict = [
      { name: 'Acceptable', minScore: 1, maxScore: 3, tone: 'live' },
      { name: 'Serious', minScore: 4, maxScore: 25, tone: 'severe' },
    ]
    expect(validateBands(strict)).toBeNull()
    expect(ratingFor(4, strict).name).toBe('Serious')
    expect(
      validateBands([
        ...strict.slice(0, 1),
        { name: 'Gap', minScore: 5, maxScore: 25, tone: 'severe' },
      ]),
    ).toMatch(/should start at 4/)

    // A1.1 is CRITICAL in the template (impact 5); a gap is likely (4): 20, Critical.
    const client = await newClient(world, 'Risks')
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'B0.12'])
    await answerItem(world.ctx, client.id, hr.item('A1.1').id, { answer: 'no' })
    await answerItem(world.ctx, client.id, hr.item('B0.12').id, { answer: 'partial' })
    const risks = await listRisks(world.ctx, client.id)
    expect(risks.map((row) => [row.questionCode, row.likelihood, row.impact]).sort()).toEqual([
      ['A1.1', 4, 5],
      ['B0.12', 3, 2],
    ])
    const first = risks.find((row) => row.questionCode === 'A1.1')
    await updateRisk(world.ctx, client.id, first?.id ?? '', {
      likelihood: '4',
      impact: '4',
      treatment: 'mitigate',
      status: 'open',
    })
    const rated = (await listRisks(world.ctx, client.id)).find((row) => row.id === first?.id)
    expect([rated?.score, rated?.band.name]).toEqual([16, 'High'])

    // An auditor cannot record a risk acceptance; the senior auditor or the client DPO can.
    const auditor = await newPerson(world, 'auditor')
    await expect(
      acceptRisk(as(world, auditor), client.id, rated?.id ?? '', { note: 'Business accepts it.' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    const dpo = await newPerson(world, 'client_dpo', { clientId: client.id })
    const shortNote = await acceptRisk(as(world, dpo), client.id, rated?.id ?? '', {
      note: 'ok',
    }).catch((error: unknown) => error)
    expect(shortNote).toBeInstanceOf(ValidationError)
    await acceptRisk(as(world, dpo), client.id, rated?.id ?? '', {
      note: 'Legacy system retires in March; compensating monitoring in place.',
    })
    const accepted = (await listRisks(world.ctx, client.id)).find((row) => row.id === first?.id)
    expect([accepted?.status, accepted?.treatment]).toEqual(['accepted', 'accept'])
  })
})

describe('recommendations', () => {
  it("TC-C8.3-01 gives a finding its question's recommendation and references from the knowledge base", async () => {
    const client = await newClient(world, 'Recommend')
    const codes = ['A3.1', 'A8.1', 'A9.3', 'C1.1', 'B0.10']
    const dep = await newDepartment(world, client.id, 'OPS', codes)
    for (const code of codes) {
      const item = dep.item(code)
      await answerItem(world.ctx, client.id, item.id, {
        answer: item.answerType === 'maturity' ? '2' : 'partial',
      })
    }
    const [pinned] = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ releaseId: assessment.releaseId })
        .from(assessment)
        .where(eq(assessment.id, dep.cycle?.id ?? '')),
    )
    const sources = await world.owner.db
      .select({
        code: question.code,
        recommendation: question.recommendation,
        references: question.references,
      })
      .from(question)
      .where(and(eq(question.releaseId, pinned?.releaseId ?? ''), inArray(question.code, codes)))
    const findings = await listFindings(world.ctx, client.id)
    expect(findings).toHaveLength(5)
    for (const row of findings) {
      const detail = await getFinding(world.ctx, client.id, row.code)
      const source = sources.find((item) => item.code === detail.questionCode)
      expect(detail.recommendation).toBe(source?.recommendation)
      expect(detail.recommendation).toMatch(/^Put in place/)
      expect(detail.references).toEqual(source?.references)
      expect(detail.references.length).toBeGreaterThan(0)
    }
  })
})
