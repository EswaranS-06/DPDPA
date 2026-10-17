import { AccessDeniedError } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import { and, desc, eq, frameworkRelease, inArray, obligation, question } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction } from './actions'
import { answerItem, listItems } from './assessments'
import { ValidationError } from './errors'
import { reviewEvidence, uploadEvidence } from './evidence'
import { listFindings } from './findings'
import {
  coverage,
  gapsByCommencement,
  groupByPenalty,
  penaltyExposure,
  summariseDataMap,
} from './insights'
import {
  DEFAULT_TARGET,
  domainLevel,
  maturityProfile,
  maturityRow,
  penaltyCrore,
  penaltyWeight,
  rankGaps,
  setMaturityTargets,
  type MaturityAnswer,
} from './maturity'
import { maturityOf } from './responses'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  openWorld,
  pdf,
  principalWith,
  type World,
} from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

const maturity = (level: number): MaturityAnswer => ({
  level,
  state: level >= 3 ? 'compliant' : level === 2 ? 'potential_gap' : 'gap',
})
const plain = (state: MaturityAnswer['state']): MaturityAnswer => ({ level: null, state })

/** A client with one department that answered a gap, two maturity levels, a Yes and a fact. */
const setup = async (label: string) => {
  const client = await newClient(world, label)
  const plan: Record<string, Record<string, string>> = {
    'A1.1': { answer: 'no', comment: 'Nobody is appointed.' },
    'A1.3': { answer: '2' },
    'A2.1': { answer: '0' },
    'A3.1': { answer: 'yes' },
    'B0.3': { text: 'Darwinbox HRMS' },
  }
  const ops = await newDepartment(world, client.id, 'OPS', Object.keys(plan))
  for (const [code, answer] of Object.entries(plan)) {
    await answerItem(world.ctx, client.id, ops.item(code).id, answer)
  }
  if (!ops.cycle) throw new Error('No open cycle.')
  return { client, ops, cycle: ops.cycle }
}

describe('maturity against target', () => {
  it('TC-C24.1-01 a domain’s level is the mean of its maturity answers, or the stated equivalent of its Yes, Partial and No answers', async () => {
    // Maturity answers decide; a Yes beside them does not move the level.
    expect(domainLevel([maturity(4), maturity(2), maturity(3), plain('compliant')])).toEqual({
      level: 3,
      basis: 'maturity',
      answers: 3,
    })
    // Only Yes, Partial, No, No: (3 + 2 + 0 + 0) / 4.
    expect(
      domainLevel([plain('compliant'), plain('potential_gap'), plain('gap'), plain('gap')]),
    ).toEqual({ level: 1.3, basis: 'equivalent', answers: 4 })
    // Not applicable, recorded and unanswered questions say nothing about the level.
    expect(domainLevel([plain('excluded'), plain('informational'), plain('pending')])).toBeNull()
    expect(domainLevel([{ level: null, state: 'excluded' }, maturity(1)])).toEqual({
      level: 1,
      basis: 'maturity',
      answers: 1,
    })
    expect(domainLevel([])).toBeNull()

    const { client, cycle } = await setup('Maturity')
    const items = await listItems(world.ctx, client.id, cycle.id)
    const profile = await maturityProfile(world.ctx, client.id)
    expect(profile.assessment?.code).toBe(cycle.code)
    // Oracle: the same rule applied to the cycle's answers, domain by domain.
    const expected = new Map<string, MaturityAnswer[]>()
    for (const item of items) {
      const list = expected.get(item.domainCode) ?? []
      list.push({
        level: maturityOf(item, item.response),
        state: item.complianceState,
      })
      expected.set(item.domainCode, list)
    }
    const answered = [...expected.entries()].flatMap(([domainCode, answers]) => {
      const reached = domainLevel(answers)
      return reached ? [[domainCode, reached.level, reached.basis] as const] : []
    })
    expect(answered.length).toBeGreaterThan(0)
    expect(profile.assessed.map((row) => [row.domainCode, row.level, row.basis])).toEqual(
      answered.sort((a, b) => a[0].localeCompare(b[0])),
    )
    expect(profile.rows.every((row) => row.target === DEFAULT_TARGET)).toBe(true)
    expect(profile.previous).toBeNull()
  })

  it('TC-C24.1-02 the gap to target is ranked by its size and the domain’s highest penalty item', async () => {
    expect([
      penaltyCrore('s.8(5) security safeguards - up to Rs 250 crore'),
      penaltyCrore('any other provision - up to Rs 50 crore'),
      penaltyCrore('s.15 Data Principal duties - up to Rs 10,000'),
      penaltyCrore(null),
    ]).toEqual([250, 50, null, null])
    expect([
      penaltyWeight('up to Rs 250 crore'),
      penaltyWeight('up to Rs 200 crore'),
      penaltyWeight('up to Rs 50 crore'),
      penaltyWeight('up to Rs 10,000'),
      penaltyWeight(null),
    ]).toEqual([5, 4, 1, 1, 1])

    const row = (
      domainCode: string,
      level: number | null,
      target: number,
      penaltyText: string | null,
    ) =>
      maturityRow({
        domainCode,
        title: domainCode,
        level,
        basis: level === null ? null : 'maturity',
        answers: level === null ? 0 : 2,
        previousLevel: null,
        target,
        penaltyTier: penaltyText ? 'P' : null,
        penaltyText,
      })
    const rows = [
      row('D05', 1, 3, 'up to Rs 50 crore'),
      row('D09', 1.5, 3, 'up to Rs 250 crore'),
      row('D10', 2.5, 4, 'up to Rs 200 crore'),
      row('D01', 3.5, 3, 'up to Rs 50 crore'),
      row('D12', null, 3, 'up to Rs 50 crore'),
    ]
    expect(rows.map((item) => [item.domainCode, item.gap, item.weight, item.priority])).toEqual([
      ['D05', 2, 1, 2],
      ['D09', 1.5, 5, 7.5],
      ['D10', 1.5, 4, 6],
      // Above target is no gap, and a domain not assessed has none to rank.
      ['D01', 0, 1, 0],
      ['D12', 0, 1, 0],
    ])
    expect(rankGaps(rows).map((item) => item.domainCode)).toEqual(['D09', 'D10', 'D05'])

    const { client } = await setup('Targets')
    const before = await maturityProfile(world.ctx, client.id)
    const domainCode = before.assessed[0]?.domainCode ?? ''
    await setMaturityTargets(world.ctx, client.id, { targets: { [domainCode]: '4' } })
    const after = await maturityProfile(world.ctx, client.id)
    const changed = after.rows.find((item) => item.domainCode === domainCode)
    expect(changed?.target).toBe(4)
    expect(changed?.gap).toBe(Math.round((4 - (changed?.level ?? 0)) * 10) / 10)
    expect(after.ranked.map((item) => item.priority)).toEqual(
      [...after.ranked.map((item) => item.priority)].sort((a, b) => b - a),
    )
    for (const targets of [{ [domainCode]: '5' }, { [domainCode]: '-1' }, { D99: '3' }]) {
      await expect(setMaturityTargets(world.ctx, client.id, { targets })).rejects.toBeInstanceOf(
        ValidationError,
      )
    }
    const viewer = principalWith({ role: 'client_viewer', clientId: client.id })
    await expect(
      setMaturityTargets(as(world, viewer), client.id, { targets: { [domainCode]: '2' } }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    expect((await maturityProfile(as(world, viewer), client.id)).canEdit).toBe(false)
  })
})

describe('figures behind the visuals', () => {
  it('TC-C24.3-01 penalty exposure lists each Schedule item with its open gaps and its maximum, and never adds the maximums up', async () => {
    const R = 'release'
    const obligations = [
      {
        releaseId: R,
        code: 'O1',
        tier: 'P1',
        text: 's.8(5) security safeguards - up to Rs 250 crore',
      },
      { releaseId: R, code: 'O2', tier: 'P7', text: 'any other provision - up to Rs 50 crore' },
      {
        releaseId: R,
        code: 'O3',
        tier: 'P2',
        text: 's.8(6) breach intimation - up to Rs 200 crore',
      },
      { releaseId: R, code: 'O4', tier: null, text: null },
      { releaseId: R, code: 'O5', tier: 'P7', text: 'any other provision - up to Rs 50 crore' },
    ]
    const questions = [
      { releaseId: R, code: 'Q1', obligationCodes: ['O1', 'O2', 'O5'] },
      { releaseId: R, code: 'Q2', obligationCodes: ['O2'] },
      { releaseId: R, code: 'Q3', obligationCodes: ['O4'] },
    ]
    const finding = (code: string, questionCode: string) => ({
      code,
      title: code,
      gapType: 'gap' as const,
      questionCode,
      releaseId: R,
    })
    const items = groupByPenalty(
      [finding('F1', 'Q1'), finding('F2', 'Q2'), finding('F3', 'Q3')],
      questions,
      obligations,
    )
    // Highest maximum first; a finding under two items appears under both, once each.
    expect(
      items.map((item) => [item.tier, item.maxCrore, item.findings.map((row) => row.code)]),
    ).toEqual([
      ['P1', 250, ['F1']],
      ['P2', 200, []],
      ['P7', 50, ['F1', 'F2']],
    ])

    const { client } = await setup('Penalty')
    const exposure = await penaltyExposure(world.ctx, client.id)
    expect(Object.keys(exposure).sort()).toEqual(['exposed', 'items', 'note', 'openFindings'])
    expect(JSON.stringify(exposure)).not.toMatch(/total/i)
    expect(exposure.note).toMatch(/not added together/)
    // Oracle: each open finding sits under the penalty items of its question's obligations.
    const findings = await listFindings(world.ctx, client.id, { status: 'open' })
    expect(exposure.openFindings).toBe(findings.length)
    const [release] = await world.owner.db
      .select({ id: frameworkRelease.id })
      .from(frameworkRelease)
      .where(eq(frameworkRelease.status, 'published'))
      .orderBy(desc(frameworkRelease.publishedAt))
      .limit(1)
    for (const row of findings) {
      const [asked] = await world.owner.db
        .select({ codes: question.obligationCodes })
        .from(question)
        .where(and(eq(question.releaseId, release?.id ?? ''), eq(question.code, row.questionCode)))
      const tiers = asked?.codes.length
        ? await world.owner.db
            .selectDistinct({ tier: obligation.penaltyTier })
            .from(obligation)
            .where(
              and(
                eq(obligation.releaseId, release?.id ?? ''),
                inArray(obligation.code, asked.codes),
              ),
            )
        : []
      const expected = tiers.flatMap((item) => (item.tier ? [item.tier] : [])).sort()
      const actual = exposure.items
        .filter((item) => item.findings.some((entry) => entry.code === row.code))
        .map((item) => item.tier)
        .sort()
      expect(actual).toEqual(expected)
    }
    expect(exposure.exposed.every((item) => item.findings.length > 0)).toBe(true)
    // Every Schedule item of the published release is listed, with or without a gap under it.
    const releaseTiers = await world.owner.db
      .selectDistinct({ tier: obligation.penaltyTier })
      .from(obligation)
      .where(eq(obligation.releaseId, release?.id ?? ''))
    expect(exposure.items.map((item) => item.tier).sort()).toEqual(
      releaseTiers.flatMap((row) => (row.tier ? [row.tier] : [])).sort(),
    )
    // Open gaps by the date their obligations start to apply add up to the gaps that have one.
    const byDate = await gapsByCommencement(world.ctx, client.id)
    const today = isoDate(new Date())
    expect(byDate.every((entry) => entry.date === null || entry.date > today)).toBe(true)
    expect(byDate.reduce((sum, entry) => sum + entry.gaps, 0)).toBeLessThanOrEqual(findings.length)
  })

  it('TC-C24.3-02 coverage counts scored answers with accepted evidence and open findings with an action', async () => {
    const { client, ops, cycle } = await setup('Coverage')
    const upload = (code: string) =>
      uploadEvidence(
        world.ctx,
        client.id,
        { title: `Evidence for ${code}`, itemIds: ops.item(code).id },
        { name: `${code}.pdf`, bytes: pdf(code) },
      )
    await upload('A3.1')
    const rejected = await upload('A1.1')
    // A file for the recorded-only answer does not count: that answer is not scored.
    await upload('B0.3')
    await reviewEvidence(world.ctx, client.id, rejected.id, {
      decision: 'rejected',
      note: 'Not the appointment letter.',
    })
    const findings = await listFindings(world.ctx, client.id, { status: 'open' })
    expect(findings).toHaveLength(3)
    await createAction(world.ctx, client.id, findings[0]?.id ?? '', { title: 'Appoint a DPO' })
    const figures = await coverage(world.ctx, client.id)
    expect(figures.assessment?.code).toBe(cycle.code)
    expect(figures.evidence).toEqual({ covered: 1, total: 4 })
    expect(figures.actions).toEqual({ covered: 1, total: 3 })
    const empty = await newClient(world, 'Nothing yet')
    expect(await coverage(world.ctx, empty.id)).toEqual({
      assessment: null,
      evidence: { covered: 0, total: 0 },
      actions: { covered: 0, total: 0 },
    })
  })

  it('TC-C24.3-03 the personal data map figures come from the RoPA: categories, elements, activities, highest level and the counters', () => {
    const element = (title: string, category: string, level: 'L1' | 'L2' | 'L3' | 'L4') => ({
      title,
      category,
      level,
    })
    const map = summariseDataMap([
      {
        id: 'payroll',
        departmentId: 'hr',
        processors: ['Zing HR', 'Bank'],
        principals: ['Employee'],
        transfersAbroad: 'no',
        elements: [
          element('Full name', 'identifiers', 'L2'),
          element('PAN', 'government_ids', 'L4'),
          element('Bank account', 'financial', 'L4'),
        ],
      },
      {
        id: 'admissions',
        departmentId: 'office',
        processors: ['zing  hr', 'Mailer'],
        principals: ['Student (child)', 'Parent'],
        transfersAbroad: 'yes',
        elements: [
          element('Full name', 'identifiers', 'L2'),
          element('Date of birth', 'identifiers', 'L3'),
          element('Aadhaar number', 'government_ids', 'L4'),
        ],
      },
      {
        id: 'visitors',
        departmentId: 'office',
        processors: [],
        principals: ['Visitor'],
        transfersAbroad: 'unknown',
        elements: [],
      },
    ])
    expect(
      map.categories.map((row) => [row.code, row.elements, row.activities, row.highestLevel]),
    ).toEqual([
      ['government_ids', 2, 2, 'L4'],
      ['identifiers', 2, 2, 'L3'],
      ['financial', 1, 1, 'L4'],
    ])
    expect(map.counters).toEqual({
      activities: 3,
      departments: 2,
      elements: 5,
      restricted: 3,
      processors: 3,
      transfersAbroad: 1,
      children: 1,
    })
    expect(summariseDataMap([])).toEqual({
      categories: [],
      counters: {
        activities: 0,
        departments: 0,
        elements: 0,
        restricted: 0,
        processors: 0,
        transfersAbroad: 0,
        children: 0,
      },
    })
  })
})
