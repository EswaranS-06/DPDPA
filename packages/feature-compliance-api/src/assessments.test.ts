import {
  and,
  assessmentItem,
  desc,
  eq,
  frameworkRelease,
  inArray,
  question,
  sql,
  withTenants,
  type AnswerOption,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  answerItem,
  changeAssessmentStatus,
  checkAnswered,
  checkItem,
  createAssessment,
  departmentQuestionPicker,
  getAssessment,
  listItems,
  setDepartmentQuestions,
} from './assessments'
import { createReassessment } from './actions'
import { RuleError, type ValidationError } from './errors'
import { COMPLIANCE_OF } from './progress'
import { bankCodes, closeWorld, newClient, newDepartment, openWorld, type World } from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

const published = async () => {
  const [release] = await world.owner.db
    .select({ id: frameworkRelease.id, version: frameworkRelease.version })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  return release
}

const optionsOf = async (codes: string[]) => {
  const release = await published()
  const rows = await world.owner.db
    .select({ code: question.code, answerType: question.answerType, options: question.options })
    .from(question)
    .where(and(eq(question.releaseId, release?.id ?? ''), inArray(question.code, codes)))
  return new Map(rows.map((row) => [row.code, row]))
}

describe('questions chosen for a department', () => {
  it('TC-C19.3-01 a new department gets exactly the chosen questions, whole questionnaires and sections included, in the first cycle', async () => {
    const client = await newClient(world)
    const internal = await bankCodes(world, { questionnaire: 'TPL-002' })
    const governance = await bankCodes(world, { questionnaire: 'TPL-001', section: 'Governance' })
    const chosen = [...internal, ...governance, 'A8.2']
    const hr = await newDepartment(world, client.id, 'HR', chosen)

    expect(hr.change).toEqual({ added: chosen.length, removed: 0, kept: [] })
    expect(hr.cycle?.code).toBe(`ASM-${client.code}-001`)
    expect(hr.items.map((item) => item.questionCode).sort()).toEqual([...chosen].sort())
    const detail = await getAssessment(world.ctx, client.id, hr.cycle?.code ?? '')
    expect(detail.releaseVersion).toBe((await published())?.version)
    expect(detail.questionnaires.map((row) => [row.code, row.progress.total])).toEqual([
      ['TPL-001', governance.length + 1],
      ['TPL-002', internal.length],
    ])

    // The picker marks them chosen for this department only.
    const picker = await departmentQuestionPicker(world.ctx, client.id, hr.id)
    const picked = picker.questionnaires
      .flatMap((group) => group.sections.flatMap((section) => section.questions))
      .filter((row) => row.selected)
      .map((row) => row.code)
    expect(picked.sort()).toEqual([...chosen].sort())
  })

  it('TC-C19.3-02 the same question for two departments is answered separately', async () => {
    const client = await newClient(world)
    const hr = await newDepartment(world, client.id, 'HR', ['B0.12', 'B0.7'])
    const fin = await newDepartment(world, client.id, 'FIN', ['B0.12'])
    expect(fin.cycle?.id).toBe(hr.cycle?.id)
    await answerItem(world.ctx, client.id, hr.item('B0.12').id, { answer: 'yes' })
    await answerItem(world.ctx, client.id, fin.item('B0.12').id, { answer: 'no' })
    const rows = await listItems(world.ctx, client.id, hr.cycle?.id ?? '')
    expect(
      rows
        .filter((row) => row.questionCode === 'B0.12')
        .map((row) => [row.departmentCode, row.complianceState])
        .sort(),
    ).toEqual([
      ['FIN', 'gap'],
      ['HR', 'compliant'],
    ])
  })

  it('TC-C19.3-03 taking questions away removes unanswered ones and keeps answered ones', async () => {
    const client = await newClient(world)
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'A1.2', 'A1.3'])
    await answerItem(world.ctx, client.id, hr.item('A1.1').id, { answer: 'no' })
    const change = await setDepartmentQuestions(world.ctx, client.id, hr.id, {
      questions: ['A1.3', 'A2.1'],
    })
    expect(change.added).toBe(1)
    expect(change.removed).toBe(1)
    expect(change.kept).toEqual(['A1.1 (has a finding)'])
    const rows = await listItems(world.ctx, client.id, hr.cycle?.id ?? '', { department: hr.id })
    expect(rows.map((row) => row.questionCode).sort()).toEqual(['A1.1', 'A1.3', 'A2.1'])
    await expect(
      setDepartmentQuestions(world.ctx, client.id, hr.id, { questions: ['ZZ9.9'] }),
    ).rejects.toMatchObject({ fieldErrors: { questions: 'Unknown questions: ZZ9.9.' } })
  })
})

describe('answers by type', () => {
  it('TC-C19.4-01 every option of every chosen question gives the outcome the knowledge base sets for it', async () => {
    const client = await newClient(world)
    // One question of every kind: yes/no, yes/no scored in reverse, yes/no recorded only,
    // maturity, a scored choice, a recorded choice, several choices and free text.
    const codes = ['A1.1', 'B0.7', 'B0.8', 'A1.3', 'C1.5', 'A1.4', 'B0.1', 'B0.3']
    const shapes = await optionsOf(codes)
    const dep = await newDepartment(world, client.id, 'OPS', codes)
    const mismatches: string[] = []
    for (const code of codes) {
      const shape = shapes.get(code)
      const itemId = dep.item(code).id
      for (const option of shape?.options ?? ([] as AnswerOption[])) {
        const input =
          shape?.answerType === 'multi_choice'
            ? { choices: [option.value] }
            : { answer: option.value }
        const { complianceState } = await answerItem(world.ctx, client.id, itemId, input)
        const expected = {
          compliant: 'compliant',
          potential_gap: 'potential_gap',
          gap: 'gap',
          informational: 'informational',
        }[option.outcome]
        if (complianceState !== expected) {
          mismatches.push(`${code}=${option.value}: ${complianceState}, expected ${expected}`)
        }
      }
    }
    expect(mismatches).toEqual([])

    // The outcomes ComplyX set: Yes on B0.7 is a gap; maturity 2 is partial; 3 and 4 comply.
    const literal = async (code: string, input: Record<string, unknown>) =>
      (await answerItem(world.ctx, client.id, dep.item(code).id, input)).complianceState
    expect(await literal('B0.7', { answer: 'yes' })).toBe('gap')
    expect(await literal('B0.7', { answer: 'no' })).toBe('compliant')
    expect(await literal('B0.8', { answer: 'no' })).toBe('informational')
    expect(await literal('A1.3', { answer: '2' })).toBe('potential_gap')
    expect(await literal('A1.3', { answer: '3' })).toBe('compliant')
    expect(await literal('A1.3', { answer: '1' })).toBe('gap')
    expect(await literal('C1.5', { answer: '≤24 hours' })).toBe('compliant')
    expect(await literal('C1.5', { answer: '≤72 hours' })).toBe('gap')
    expect(await literal('B0.3', { text: 'Darwinbox; payroll sheet' })).toBe('informational')
    expect(
      await literal('B0.1', { choices: ['Personal identifiers', 'Health and medical data'] }),
    ).toBe('informational')

    // Answers that do not fit the question are refused; Not applicable needs a reason.
    const refused = async (code: string, input: Record<string, unknown>) =>
      Object.keys(
        (
          (await answerItem(world.ctx, client.id, dep.item(code).id, input).catch(
            (error: unknown) => error,
          )) as ValidationError
        ).fieldErrors,
      )
    expect(await refused('A1.3', { answer: 'yes' })).toEqual(['answer'])
    // B0.1 offers the categories of personal data, not the sectors the workbook listed.
    expect(await refused('B0.1', { choices: ['Healthcare'] })).toEqual(['answer'])
    expect(await refused('B0.3', {})).toEqual(['answer'])
    expect(await refused('A1.1', { answer: 'not_applicable', naReason: 'short' })).toEqual([
      'naReason',
    ])

    // The stored answer and state always agree with the gap rule, even when written directly.
    const stored = await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .select({ answer: assessmentItem.answer, state: assessmentItem.complianceState })
        .from(assessmentItem)
        .where(eq(assessmentItem.departmentId, dep.id)),
    )
    for (const row of stored) expect(row.state, row.answer).toBe(COMPLIANCE_OF[row.answer])
    await expect(
      withTenants(world.owner.db, 'all', (tx) =>
        tx.execute(
          sql`update assessment_item set answer = 'not_applicable', na_reason = null where id = ${dep.item('A1.1').id}`,
        ),
      ),
    ).rejects.toThrow()
  })

  it('TC-C19.4-02 the posture counts maturity and choices like Yes, Partial and No and leaves recorded answers out', async () => {
    const client = await newClient(world)
    const codes = await bankCodes(world, { questionnaire: 'TPL-001' })
    const shapes = await optionsOf(codes)
    const dep = await newDepartment(world, client.id, 'GOV', codes)
    // Oracle: answer each question with its options in turn, and count the outcomes chosen.
    const tally = { compliant: 0, potential_gap: 0, gap: 0, informational: 0, na: 0, open: 0 }
    for (const [index, code] of codes.entries()) {
      const options = shapes.get(code)?.options ?? []
      const turn = index % (options.length + 2)
      const itemId = dep.item(code).id
      if (turn === options.length) {
        await answerItem(world.ctx, client.id, itemId, {
          answer: 'not_applicable',
          naReason: 'Outside the scope agreed for this cycle.',
        })
        tally.na += 1
      } else if (turn === options.length + 1) {
        tally.open += 1
      } else {
        const option = options[turn]
        if (!option) throw new Error(`No option ${turn} for ${code}`)
        await answerItem(world.ctx, client.id, itemId, { answer: option.value })
        tally[option.outcome] += 1
      }
    }
    const detail = await getAssessment(world.ctx, client.id, dep.cycle?.code ?? '')
    const scored = tally.compliant + tally.potential_gap + tally.gap
    expect(detail.progress).toMatchObject({
      total: codes.length,
      compliant: tally.compliant,
      potentialGap: tally.potential_gap,
      gap: tally.gap,
      excluded: tally.na,
      informational: tally.informational,
      pending: tally.open,
      // Compliant plus half of Partial, over the scored answers, to one decimal.
      compliancePct:
        Math.round(((tally.compliant * 2 + tally.potential_gap) * 1000) / (scored * 2)) / 10,
    })
  })
})

describe('self-check and cycles', () => {
  it('TC-C19.5-01 a cycle completes only when every question is answered and every answer is ticked as checked', async () => {
    const client = await newClient(world)
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'B0.3'])
    const cycleId = hr.cycle?.id ?? ''
    await answerItem(world.ctx, client.id, hr.item('A1.1').id, { answer: 'yes' })
    await expect(
      checkItem(world.ctx, client.id, hr.item('B0.3').id, { checked: 'true' }),
    ).rejects.toBeInstanceOf(RuleError)
    await expect(
      changeAssessmentStatus(world.ctx, client.id, cycleId, 'completed'),
    ).rejects.toThrow('1 questions are not answered yet.')

    await answerItem(world.ctx, client.id, hr.item('B0.3').id, { text: 'Darwinbox HRMS' })
    await checkItem(world.ctx, client.id, hr.item('A1.1').id, { checked: 'true' })
    await expect(
      changeAssessmentStatus(world.ctx, client.id, cycleId, 'completed'),
    ).rejects.toThrow('1 answers are not checked yet.')
    // Changing an answer takes its tick away.
    await answerItem(world.ctx, client.id, hr.item('A1.1').id, { answer: 'partial' })
    expect(await checkAnswered(world.ctx, client.id, cycleId)).toBe(2)
    await changeAssessmentStatus(world.ctx, client.id, cycleId, 'completed')
    await expect(
      answerItem(world.ctx, client.id, hr.item('A1.1').id, { answer: 'yes' }),
    ).rejects.toBeInstanceOf(RuleError)
  })

  it('TC-C19.5-02 after a completed cycle questions change only in the next cycle, which takes over each department’s questions', async () => {
    const client = await newClient(world)
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'B0.12'])
    const cycleId = hr.cycle?.id ?? ''
    await answerItem(world.ctx, client.id, hr.item('A1.1').id, { answer: 'yes' })
    await answerItem(world.ctx, client.id, hr.item('B0.12').id, { answer: 'no' })
    await checkAnswered(world.ctx, client.id, cycleId)
    await changeAssessmentStatus(world.ctx, client.id, cycleId, 'completed')

    await expect(
      setDepartmentQuestions(world.ctx, client.id, hr.id, { questions: ['A1.1'] }),
    ).rejects.toThrow(/is completed. Start the next cycle/)
    await expect(
      createAssessment(world.ctx, client.id, { title: 'Second' }),
    ).resolves.toMatchObject({ copied: 0 })
    await expect(createAssessment(world.ctx, client.id, { title: 'Third' })).rejects.toBeInstanceOf(
      RuleError,
    )
  })

  it('TC-C19.5-03 the next cycle copies each active department’s questions, with no answers', async () => {
    const client = await newClient(world)
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'B0.12'])
    const tech = await newDepartment(world, client.id, 'IT', ['A8.2'])
    const cycleId = hr.cycle?.id ?? ''
    for (const item of [hr.item('A1.1'), hr.item('B0.12'), tech.item('A8.2')]) {
      await answerItem(world.ctx, client.id, item.id, {
        answer: item.answerType === 'maturity' ? '4' : 'yes',
      })
    }
    await checkAnswered(world.ctx, client.id, cycleId)
    await changeAssessmentStatus(world.ctx, client.id, cycleId, 'completed')
    const next = await createReassessment(world.ctx, client.id, cycleId, { title: 'Cycle 2' })
    expect(next.copied).toBe(3)
    const rows = await listItems(world.ctx, client.id, next.id)
    expect(
      rows.map((row) => `${row.departmentCode}/${row.questionCode}/${row.answer}`).sort(),
    ).toEqual(['HR/A1.1/not_assessed', 'HR/B0.12/not_assessed', 'IT/A8.2/not_assessed'])
  })
})
