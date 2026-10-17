import { documentMedia, documentText } from '@duatf/platform-documents'
import { and, control, eq, inArray, withTenants } from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction, updateActionPlan } from './actions'
import { answerItem, checkAnswered, getAssessment } from './assessments'
import { STANDARDS, standardsCrosswalk } from './crosswalk'
import {
  buildAssessmentStatement,
  buildBoardMemo,
  buildGapReport,
  GAP_REPORT_SECTIONS,
  MEMO_SECTIONS,
  NOT_A_CERTIFICATE,
  postureSentence,
} from './deliverables'
import type { ValidationError } from './errors'
import { listFindings } from './findings'
import { listBands, updateRisk } from './risks'
import { suggestedPhase } from './phases'
import { roadmap } from './roadmap'
import { signOffCycle } from './signoff'
import { closeWorld, newClient, newDepartment, openWorld, type World } from './testing'
import { buildComplianceWorkbook } from './workbooks'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

/** A client with one department whose answers open three findings: two gaps and a potential gap. */
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
  const findings = await listFindings(world.ctx, client.id, { status: 'open' })
  return { client, cycle: ops.cycle, findings }
}

const rate = async (clientId: string, riskId: string | null, likelihood: number, impact: number) =>
  updateRisk(world.ctx, clientId, riskId ?? '', {
    likelihood: String(likelihood),
    impact: String(impact),
    treatment: 'mitigate',
    status: 'open',
  })

const errorsOf = async (work: Promise<unknown>) =>
  Object.keys(((await work.catch((error: unknown) => error)) as ValidationError).fieldErrors ?? {})

describe('roadmap', () => {
  it('TC-C25.1-01 an action’s suggested phase follows its risk rating, and its phase and effort are saved', async () => {
    const bands = await listBands(world.ctx.db)
    // The worked case uses the default bands: Low 1-4, Medium 5-9, High 10-16, Critical 17-25.
    expect(bands.map((band) => [band.name, band.minScore, band.maxScore, band.tone])).toEqual([
      ['Low', 1, 4, 'live'],
      ['Medium', 5, 9, 'pending'],
      ['High', 10, 16, 'severe'],
      ['Critical', 17, 25, 'severe'],
    ])
    expect(
      [25, 17, 16, 10, 9, 5, 4, 1].map((score) => suggestedPhase(score, bands, 'gap')),
    ).toEqual([1, 1, 1, 1, 2, 2, 3, 3])
    expect(suggestedPhase(null, bands, 'gap')).toBe(2)
    expect(suggestedPhase(null, bands, 'potential_gap')).toBe(3)
    // A firm's own bands with nothing marked severe: the top band is now, the one below next.
    const own = [
      { name: 'Minor', minScore: 1, maxScore: 6, tone: 'live' },
      { name: 'Moderate', minScore: 7, maxScore: 14, tone: 'pending' },
      { name: 'Major', minScore: 15, maxScore: 25, tone: 'accent' },
    ]
    expect([20, 10, 3].map((score) => suggestedPhase(score, own, 'gap'))).toEqual([1, 2, 3])

    const { client, findings } = await setup('Roadmap phase')
    const [first, second, third] = findings
    if (!first || !second || !third) throw new Error('Three findings expected.')
    await rate(client.id, first.riskId, 4, 4)
    await rate(client.id, second.riskId, 2, 3)
    await rate(client.id, third.riskId, 1, 2)
    const a = await createAction(world.ctx, client.id, first.id, { title: 'Appoint a DPO' })
    const b = await createAction(world.ctx, client.id, second.id, {
      title: 'Write the retention schedule',
      phase: '3',
      effortDays: '2.5',
    })
    const c = await createAction(world.ctx, client.id, third.id, {
      title: 'Train the front desk',
      effortDays: '4',
    })
    await updateActionPlan(world.ctx, client.id, c.id, {
      title: 'Train the front desk',
      phase: '1',
      effortDays: '4',
    })
    const plan = await roadmap(world.ctx, client.id)
    const placed = Object.fromEntries(
      plan.phases.flatMap((phase) =>
        phase.rows.map((row) => [
          row.id,
          [phase.phase, row.phaseSet, row.suggestedPhase, row.effortDays],
        ]),
      ),
    )
    expect(placed).toEqual({
      [a.id]: [1, false, 1, null],
      [b.id]: [3, true, 2, 2.5],
      [c.id]: [1, true, 3, 4],
    })
    for (const [field, value] of [
      ['phase', '4'],
      ['phase', 'soon'],
      ['effortDays', '-1'],
      ['effortDays', '400'],
      ['effortDays', '1.3'],
    ] as const) {
      expect(
        await errorsOf(
          updateActionPlan(world.ctx, client.id, a.id, { title: 'Appoint a DPO', [field]: value }),
        ),
        `${field} ${value}`,
      ).toEqual([field])
    }
  })

  it('TC-C25.4-01 the roadmap lists the open actions by phase with owner, due date, effort and rating', async () => {
    const { client, findings } = await setup('Roadmap sheet')
    const [first, second] = findings
    if (!first || !second) throw new Error('Findings expected.')
    await rate(client.id, first.riskId, 5, 4)
    await rate(client.id, second.riskId, 2, 2)
    await createAction(world.ctx, client.id, first.id, {
      title: 'Appoint a DPO',
      dueDate: '2026-12-31',
      effortDays: '3',
    })
    await createAction(world.ctx, client.id, first.id, {
      title: 'Publish the DPO contact',
      effortDays: '0.5',
    })
    await createAction(world.ctx, client.id, second.id, { title: 'Map the data flows' })
    const plan = await roadmap(world.ctx, client.id)
    expect(
      plan.phases.map((phase) => [phase.phase, phase.actions, phase.effortDays, phase.unestimated]),
    ).toEqual([
      [1, 2, 3.5, 0],
      [2, 0, 0, 0],
      [3, 1, 0, 1],
    ])
    expect(plan.phases[0]?.rows.map((row) => [row.title, row.band?.name, row.dueDate])).toEqual([
      ['Appoint a DPO', 'Critical', '2026-12-31'],
      ['Publish the DPO contact', 'Critical', null],
    ])

    const workbook = await buildComplianceWorkbook(world.ctx, client.id)
    const book = new ExcelJS.Workbook()
    const bytes = workbook.content
    await book.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    )
    const sheet = book.getWorksheet('Roadmap')
    const rows: string[][] = []
    sheet?.eachRow((row, index) => {
      if (index > 1) rows.push([row.getCell(1).text, row.getCell(2).text, row.getCell(7).text])
    })
    expect(rows).toEqual([
      ['Now', expect.stringMatching(/^REM-/), '3'],
      ['Now', expect.stringMatching(/^REM-/), '0.5'],
      ['Later', expect.stringMatching(/^REM-/), ''],
    ])
  })
})

describe('standards crosswalk', () => {
  it('TC-C25.3-01 every open gap appears under each standard reference of its controls', async () => {
    const { client, cycle, findings } = await setup('Crosswalk')
    const detail = await getAssessment(world.ctx, client.id, cycle.code)
    const controls = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select()
        .from(control)
        .where(
          and(
            eq(control.releaseId, detail.releaseId),
            inArray(
              control.code,
              findings.map((row) => row.controlCode),
            ),
          ),
        ),
    )
    const result = await standardsCrosswalk(world.ctx, client.id)
    expect(result.openGaps).toBe(findings.length)
    for (const standard of STANDARDS) {
      const listed = result.standards.find((row) => row.key === standard.key)
      // Oracle: the references read straight from each finding's control.
      const expected = new Map<string, string[]>()
      for (const row of findings) {
        const refs = controls.find((item) => item.code === row.controlCode)?.[standard.key] ?? []
        for (const ref of refs) expected.set(ref, [...(expected.get(ref) ?? []), row.code])
      }
      expect(
        Object.fromEntries(
          (listed?.references ?? []).map((ref) => [
            ref.reference,
            ref.gaps.map((gap) => gap.code).sort(),
          ]),
        ),
        standard.key,
      ).toEqual(
        Object.fromEntries([...expected].map(([ref, codes]) => [ref, [...new Set(codes)].sort()])),
      )
    }
  })
})

describe('Word deliverables', () => {
  const certificateWords =
    /certif(ied|ies|ication)|fully compliant|100\s*% compliant|compliant with the act/i

  it('TC-C25.2-01 the gap-assessment report is a valid Word file with its sections, the assessment’s figures and its charts as pictures', async () => {
    const { client, cycle, findings } = await setup('Gap report')
    const report = await buildGapReport(world.ctx, client.id, cycle.code)
    expect(report.fileName).toMatch(
      new RegExp(`^${client.code}-${cycle.code}-gap-report-\\d{4}-\\d{2}-\\d{2}\\.docx$`),
    )
    const text = await documentText(report.content)
    for (const section of GAP_REPORT_SECTIONS) expect(text, section).toContain(section)
    const detail = await getAssessment(world.ctx, client.id, cycle.code)
    expect(text).toContain(postureSentence(detail.progress))
    for (const row of findings) expect(text.join('\n')).toContain(row.code)
    const media = await documentMedia(report.content)
    // The penalty bars always, and the radar when three areas or more are scored.
    expect(media.length).toBeGreaterThanOrEqual(1)
    expect(media.every((item) => item.name.endsWith('.png') && item.bytes > 1000)).toBe(true)
  })

  it('TC-C25.2-02 the board memo and the assessment statement hold what they promise and never call the result a certificate or a verdict of compliance', async () => {
    const { client, cycle } = await setup('Memo and statement')
    const detail = await getAssessment(world.ctx, client.id, cycle.code)
    // The disclaimer names the organisation; its wording is the same in every document.
    const disclaimer = new RegExp(
      NOT_A_CERTIFICATE('ORGANISATION')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace('ORGANISATION', '.+?'),
    )
    const memo = (
      await documentText((await buildBoardMemo(world.ctx, client.id, cycle.code)).content)
    ).join('\n')
    for (const section of MEMO_SECTIONS) expect(memo).toContain(section)
    expect(memo).toContain(postureSentence(detail.progress))
    expect(memo).toMatch(/Approve the first phase of the roadmap/)
    expect(memo).toContain('not added together')

    const draft = (
      await documentText((await buildAssessmentStatement(world.ctx, client.id, cycle.code)).content)
    ).join('\n')
    for (const label of [
      'Organisation',
      'Assessment',
      'Scope',
      'Period',
      'Assessed against',
      'Result',
      'Sign-off',
    ]) {
      expect(draft).toContain(label)
    }
    expect(draft).toContain(`knowledge base release ${detail.releaseVersion}`)
    expect(draft).toContain('Not signed off yet')
    await checkAnswered(world.ctx, client.id, cycle.id)
    await signOffCycle(world.ctx, client.id, cycle.id, { acknowledge: true })
    const signed = (
      await documentText((await buildAssessmentStatement(world.ctx, client.id, cycle.code)).content)
    ).join('\n')
    expect(signed).toMatch(/Signed off by .+ on \d{1,2} \w+ \d{4}/)
    for (const textOf of [memo, draft, signed]) {
      expect(textOf).toMatch(disclaimer)
      expect(textOf.replace(disclaimer, '')).not.toMatch(/certificate/i)
      expect(textOf).not.toMatch(certificateWords)
    }
  })
})
