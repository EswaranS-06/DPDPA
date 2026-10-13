import { AccessDeniedError } from '@duatf/core-access'
import { addCalendarDays, isoDate } from '@duatf/core-utils'
import {
  and,
  appUser,
  assessment,
  assessmentSignoff,
  desc,
  eq,
  frameworkRelease,
  inArray,
  question,
  risk,
  withTenants,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAction, getAction } from './actions'
import { answerItem, checkAnswered, checkItem, setDepartmentQuestions } from './assessments'
import { attentionFor } from './attention'
import { RuleError, ValidationError } from './errors'
import {
  evidenceFreshnessCounts,
  freshnessOf,
  listEvidence,
  reviewEvidence,
  setEvidenceValidity,
  uploadEvidence,
} from './evidence'
import { listFindings } from './findings'
import { checkQuality, countIssues, qualityCheck, type QualityInput } from './quality'
import { acceptRisk, listRisks, reopenRisk } from './risks'
import {
  decideSignoff,
  listSignoffs,
  requestSignoff,
  signOffCycle,
  withdrawSignoff,
} from './signoff'
import {
  as,
  closeWorld,
  newClient,
  newDepartment,
  newPerson,
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

const TODAY = '2026-10-13'
const day = (offset: number) => addCalendarDays(TODAY, offset)

const item = (
  questionCode: string,
  answer: QualityInput['items'][number]['answer'],
  more: Partial<QualityInput['items'][number]> = {},
): QualityInput['items'][number] => ({
  questionCode,
  title: `Question ${questionCode}`,
  departmentCode: 'IT',
  departmentName: 'IT',
  answer,
  scored: true,
  comment: 'Seen on site.',
  evidenceAsked: false,
  evidence: [],
  ...more,
})

const accepted = (validUntil: string | null = null) => ({ status: 'accepted' as const, validUntil })

describe('quality rules', () => {
  it('TC-C22.1-01 each quality rule fires on its worked case and stays silent on a sound one', () => {
    const worked: QualityInput = {
      items: [
        item('Q01', 'yes', { evidenceAsked: true }),
        item('Q02', 'yes'),
        item('Q03', 'partial'),
        item('Q04', 'yes', { evidence: [{ status: 'rejected', validUntil: null }] }),
        item('Q05', 'yes', { evidence: [accepted(day(-1))] }),
        item('Q06', 'partial', {
          evidence: [
            { status: 'pending_review', validUntil: null },
            { status: 'rejected', validUntil: null },
          ],
        }),
        item('Q07', 'no', { comment: '  ' }),
        item('Q08', 'partial', { comment: null, evidence: [accepted()] }),
        item('Q09', 'yes', { evidence: [accepted(day(30))] }),
        // Sound: current evidence, a note on the gap, facts recorded without a score.
        item('Q10', 'yes', { evidence: [accepted(day(31)), accepted(day(-5))] }),
        item('Q11', 'no'),
        item('Q12', 'yes', { scored: false }),
        item('Q13', 'not_applicable'),
        item('Q14', 'not_assessed'),
      ],
      findings: [
        {
          code: 'FND-1',
          title: 'Open, nothing planned',
          status: 'open',
          departmentName: 'IT',
          actions: 0,
          riskStatus: 'open',
        },
        {
          code: 'FND-2',
          title: 'Open, risk accepted',
          status: 'open',
          departmentName: 'IT',
          actions: 0,
          riskStatus: 'accepted',
        },
        {
          code: 'FND-3',
          title: 'Closed',
          status: 'closed',
          departmentName: 'IT',
          actions: 0,
          riskStatus: 'closed',
        },
        {
          code: 'FND-4',
          title: 'Open, planned',
          status: 'open',
          departmentName: 'IT',
          actions: 1,
          riskStatus: 'open',
        },
      ],
      actions: [
        {
          code: 'REM-1',
          title: 'Late',
          status: 'in_progress',
          dueDate: day(-1),
          owned: true,
          departmentName: 'IT',
        },
        {
          code: 'REM-2',
          title: 'Nobody, no date',
          status: 'open',
          dueDate: null,
          owned: false,
          departmentName: 'IT',
        },
        {
          code: 'REM-3',
          title: 'Closed late',
          status: 'closed',
          dueDate: day(-9),
          owned: false,
          departmentName: 'IT',
        },
        {
          code: 'REM-4',
          title: 'Due today',
          status: 'assigned',
          dueDate: TODAY,
          owned: true,
          departmentName: 'IT',
        },
      ],
      risks: [
        {
          code: 'RSK-1',
          title: 'Lapsed',
          status: 'accepted',
          acceptedUntil: day(-1),
          findingCode: 'FND-2',
        },
        {
          code: 'RSK-2',
          title: 'No date',
          status: 'accepted',
          acceptedUntil: null,
          findingCode: null,
        },
        {
          code: 'RSK-3',
          title: 'In place',
          status: 'accepted',
          acceptedUntil: TODAY,
          findingCode: null,
        },
        { code: 'RSK-4', title: 'Open', status: 'open', acceptedUntil: null, findingCode: 'FND-1' },
      ],
    }
    const issues = checkQuality(worked, TODAY)
    expect(
      issues.map((issue) => `${issue.severity} ${issue.rule} ${issue.label.split(' ')[0]}`),
    ).toEqual([
      'error yes_no_evidence_asked Q01',
      'error evidence_rejected Q04',
      'error evidence_expired Q05',
      'error acceptance_lapsed RSK-1',
      'warning yes_no_evidence Q02',
      'warning partial_no_evidence Q03',
      'warning evidence_awaiting_review Q06',
      'warning gap_no_note Q07',
      'warning partial_no_note Q08',
      'warning finding_no_action FND-1',
      'warning action_overdue REM-1',
      'note evidence_expiring Q09',
      'note action_no_owner REM-2',
      'note action_no_due_date REM-2',
      'note acceptance_no_end_date RSK-2',
    ])
    expect(countIssues(issues)).toEqual({ error: 4, warning: 7, note: 4 })

    const sound: QualityInput = {
      items: worked.items.filter((row) =>
        ['Q10', 'Q11', 'Q12', 'Q13', 'Q14'].includes(row.questionCode),
      ),
      findings: worked.findings.filter((row) => row.code !== 'FND-1'),
      actions: worked.actions.filter((row) => ['REM-3', 'REM-4'].includes(row.code)),
      risks: worked.risks.filter((row) => ['RSK-3', 'RSK-4'].includes(row.code)),
    }
    expect(checkQuality(sound, TODAY)).toEqual([])
  })

  it('TC-C22.1-02 on a real cycle the check lists the flagged answers, evidence, findings, actions and risks', async () => {
    const client = await newClient(world, 'Quality')
    const ops = await newDepartment(world, client.id, 'OPS', ['A1.1', 'A1.3', 'A2.1', 'A3.1'])
    const cycle = ops.cycle
    if (!cycle) throw new Error('No open cycle.')
    await answerItem(world.ctx, client.id, ops.item('A1.1').id, { answer: 'yes' })
    await answerItem(world.ctx, client.id, ops.item('A1.3').id, {
      answer: '2',
      comment: 'A draft policy exists; it is not approved.',
    })
    await answerItem(world.ctx, client.id, ops.item('A2.1').id, { answer: '0' })
    await answerItem(world.ctx, client.id, ops.item('A3.1').id, { answer: 'yes' })
    await uploadEvidence(
      world.ctx,
      client.id,
      { title: 'Notice as published', itemIds: ops.item('A3.1').id },
      { name: 'notice.pdf', bytes: pdf('notice') },
    )
    const [gap] = await listFindings(world.ctx, client.id, { status: 'open' })
    const planned = await createAction(world.ctx, client.id, gap?.id ?? '', {
      title: 'Approve the policy',
    })

    // Whether a bare Yes is an error depends on the question asking for evidence.
    const [bank] = await world.owner.db
      .select({ required: question.evidenceRequired, attachment: question.attachmentRequired })
      .from(question)
      .innerJoin(frameworkRelease, eq(frameworkRelease.id, question.releaseId))
      .where(and(eq(question.code, 'A1.1'), eq(frameworkRelease.status, 'published')))
      .orderBy(desc(frameworkRelease.publishedAt))
      .limit(1)
    const asked = Boolean(bank?.attachment) || (bank?.required.length ?? 0) > 0

    const report = await qualityCheck(world.ctx, client.id, cycle.code)
    const flagged = report.issues.map((issue) => `${issue.rule}:${issue.label.split(' ')[0]}`)
    const findings = await listFindings(world.ctx, client.id, { status: 'open' })
    const unplanned = findings.filter((row) => row.id !== gap?.id).map((row) => row.code)
    expect(flagged).toEqual(
      expect.arrayContaining([
        `${asked ? 'yes_no_evidence_asked' : 'yes_no_evidence'}:A1.1`,
        'partial_no_evidence:A1.3',
        'gap_no_note:A2.1',
        ...unplanned.map((code) => `finding_no_action:${code}`),
      ]),
    )
    expect(flagged.filter((entry) => entry.endsWith(':A3.1'))).toEqual([])
    expect(flagged.filter((entry) => entry.startsWith('finding_no_action'))).toHaveLength(1)
    expect(flagged).toEqual(
      expect.arrayContaining([
        `action_no_owner:${planned.code}`,
        `action_no_due_date:${planned.code}`,
      ]),
    )
    const severities = report.issues.map((issue) => issue.severity)
    expect(severities).toEqual([...severities].sort((a, b) => order(a) - order(b)))
    expect(report.counts.error + report.counts.warning + report.counts.note).toBe(
      report.issues.length,
    )
    expect(report.groups.flatMap((group) => group.issues)).toHaveLength(report.issues.length)

    // Another client's user sees nothing of this one.
    const other = await newClient(world, 'Other')
    const stranger = principalWith({ role: 'client_dpo', clientId: other.id })
    await expect(qualityCheck(as(world, stranger), client.id, cycle.code)).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
  })
})

const order = (severity: string) => ['error', 'warning', 'note'].indexOf(severity)

describe('expiry', () => {
  it('TC-C22.2-01 evidence past or near its valid-until date is reported as expired or expiring', async () => {
    const today = isoDate(new Date())
    expect([
      freshnessOf(null, today),
      freshnessOf(addCalendarDays(today, -1), today),
      freshnessOf(today, today),
      freshnessOf(addCalendarDays(today, 30), today),
      freshnessOf(addCalendarDays(today, 31), today),
    ]).toEqual([null, 'expired', 'expiring', 'expiring', 'valid'])

    const client = await newClient(world, 'Expiry')
    const ops = await newDepartment(world, client.id, 'OPS', ['A3.1'])
    const cycle = ops.cycle
    if (!cycle) throw new Error('No open cycle.')
    await answerItem(world.ctx, client.id, ops.item('A3.1').id, { answer: 'yes' })
    const upload = (name: string, validUntil?: string) =>
      uploadEvidence(
        world.ctx,
        client.id,
        { title: name, validUntil, itemIds: ops.item('A3.1').id },
        { name: `${name}.pdf`, bytes: pdf(name) },
      )
    const old = await upload('old-certificate', addCalendarDays(today, -1))
    await upload('undated')
    const soon = await upload('renewal-due', addCalendarDays(today, 10))
    await upload('current', addCalendarDays(today, 200))

    expect(await evidenceFreshnessCounts(world.ctx, client.id)).toEqual({ expired: 1, expiring: 1 })
    expect(
      (await listEvidence(world.ctx, client.id, { freshness: 'expired' })).map((row) => row.code),
    ).toEqual([old.code])
    expect(
      (await listEvidence(world.ctx, client.id, { freshness: 'expiring' })).map((row) => row.code),
    ).toEqual([soon.code])
    const kinds = async () =>
      Object.fromEntries(
        (await attentionFor(world.ctx, [client.id]))
          .filter((row) => row.kind.startsWith('evidence_exp'))
          .map((row) => [row.kind, row.count]),
      )
    expect(await kinds()).toEqual({ evidence_expired: 1, evidence_expiring: 1 })

    // A rejected file no longer counts; a renewed date clears the alert.
    await reviewEvidence(world.ctx, client.id, old.id, { decision: 'rejected', note: 'Expired.' })
    await setEvidenceValidity(world.ctx, client.id, soon.id, {
      validUntil: addCalendarDays(today, 400),
    })
    expect(await evidenceFreshnessCounts(world.ctx, client.id)).toEqual({ expired: 0, expiring: 0 })
    expect(await kinds()).toEqual({})
    const viewer = principalWith({ role: 'client_viewer', clientId: client.id })
    await expect(
      setEvidenceValidity(as(world, viewer), client.id, soon.id, { validUntil: '' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
  })

  it('TC-C22.2-02 a risk is accepted until a date; after it the acceptance has lapsed and is renewed or reopened', async () => {
    const today = isoDate(new Date())
    const client = await newClient(world, 'Acceptance')
    const ops = await newDepartment(world, client.id, 'OPS', ['A1.1'])
    await answerItem(world.ctx, client.id, ops.item('A1.1').id, { answer: 'no', comment: 'None.' })
    const [gap] = await listFindings(world.ctx, client.id, { status: 'open' })
    const action = await createAction(world.ctx, client.id, gap?.id ?? '', { title: 'Appoint' })
    const [row] = await listRisks(world.ctx, client.id)
    const riskId = row?.id ?? ''
    const note = 'The board accepts this until the new system is live.'
    const refusal = (until: string | undefined) =>
      acceptRisk(world.ctx, client.id, riskId, { note, until }).catch((error: unknown) => error)
    for (const until of [undefined, today, addCalendarDays(today, -3)]) {
      const error = await refusal(until)
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).fieldErrors.until).toBeTruthy()
    }
    await acceptRisk(world.ctx, client.id, riskId, { note, until: addCalendarDays(today, 90) })
    const read = async () =>
      (await listRisks(world.ctx, client.id)).find((entry) => entry.id === riskId)
    expect(await read()).toMatchObject({
      status: 'accepted',
      acceptedUntil: addCalendarDays(today, 90),
      acceptanceLapsed: false,
    })
    expect((await getAction(world.ctx, client.id, action.code)).status).toBe('accepted_risk')

    // The date passes.
    await withTenants(world.owner.db, 'all', (tx) =>
      tx
        .update(risk)
        .set({ acceptedUntil: addCalendarDays(today, -1) })
        .where(eq(risk.id, riskId)),
    )
    expect((await read())?.acceptanceLapsed).toBe(true)
    const lapsed = async () =>
      (await attentionFor(world.ctx, [client.id])).find(
        (entry) => entry.kind === 'acceptances_lapsed',
      )?.count ?? 0
    expect(await lapsed()).toBe(1)

    // Renewed with a new date.
    await acceptRisk(world.ctx, client.id, riskId, { note, until: addCalendarDays(today, 30) })
    expect(await read()).toMatchObject({ status: 'accepted', acceptanceLapsed: false })
    expect(await lapsed()).toBe(0)

    // Or reopened: the risk and the actions the acceptance set aside are open again.
    await expect(
      reopenRisk(world.ctx, client.id, riskId, { note: 'short' }),
    ).rejects.toBeInstanceOf(ValidationError)
    await reopenRisk(world.ctx, client.id, riskId, {
      note: 'The client decided to fix it instead.',
    })
    expect(await read()).toMatchObject({
      status: 'open',
      treatment: 'mitigate',
      acceptedUntil: null,
      acceptanceNote: null,
    })
    expect((await getAction(world.ctx, client.id, action.code)).status).toBe('open')
    await expect(
      reopenRisk(world.ctx, client.id, riskId, { note: 'It is not accepted any more.' }),
    ).rejects.toBeInstanceOf(RuleError)
  })
})

/** A person who can be named as approver: active staff with a login. */
const approverWith = async (role: 'lead_auditor' | 'firm_admin' | 'auditor') => {
  const person = await newPerson(world, role)
  await world.owner.db
    .update(appUser)
    .set({ loginEnabled: true, status: 'active' })
    .where(inArray(appUser.id, [person.userId]))
  return person
}

describe('sign-off', () => {
  it('TC-C22.3-01 a cycle goes to a named approver with a deadline, locks its answers and completes only on that approver’s decision', async () => {
    const today = isoDate(new Date())
    const client = await newClient(world, 'Signoff')
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'B0.3'])
    const cycleId = hr.cycle?.id ?? ''
    const senior = await approverWith('lead_auditor')
    const admin = await approverWith('firm_admin')
    const junior = await approverWith('auditor')
    const requester = as(world, junior)
    const request = (approverUserId: string, dueDate = addCalendarDays(today, 7)) =>
      requestSignoff(requester, client.id, cycleId, { approverUserId, dueDate })
    const status = async () =>
      (
        await withTenants(world.owner.db, 'all', (tx) =>
          tx
            .select({ status: assessment.status })
            .from(assessment)
            .where(eq(assessment.id, cycleId)),
        )
      )[0]?.status

    await answerItem(requester, client.id, hr.item('A1.1').id, {
      answer: 'no',
      comment: 'Nobody is appointed.',
    })
    await expect(request(senior.userId)).rejects.toThrow('1 questions are not answered yet.')
    await answerItem(requester, client.id, hr.item('B0.3').id, { text: 'Darwinbox HRMS' })
    await expect(request(senior.userId)).rejects.toThrow('2 answers are not checked yet.')
    await checkAnswered(requester, client.id, cycleId)

    // An auditor cannot complete the cycle alone, and cannot name another auditor.
    await expect(signOffCycle(requester, client.id, cycleId, {})).rejects.toBeInstanceOf(
      AccessDeniedError,
    )
    const unfit = await request(junior.userId).catch((error: unknown) => error)
    expect((unfit as ValidationError).fieldErrors.approverUserId).toBeTruthy()
    const past = await request(senior.userId, addCalendarDays(today, -1)).catch(
      (error: unknown) => error,
    )
    expect((past as ValidationError).fieldErrors.dueDate).toBeTruthy()

    await request(senior.userId)
    expect(await status()).toBe('in_review')
    await expect(request(senior.userId)).rejects.toBeInstanceOf(RuleError)
    await expect(
      answerItem(requester, client.id, hr.item('A1.1').id, { answer: 'yes' }),
    ).rejects.toThrow(/waiting for sign-off/)
    await expect(
      checkItem(requester, client.id, hr.item('A1.1').id, { checked: 'false' }),
    ).rejects.toThrow(/waiting for sign-off/)
    await expect(
      setDepartmentQuestions(world.ctx, client.id, hr.id, { questions: ['A1.1'] }),
    ).rejects.toThrow(/waiting for sign-off/)
    const waiting = (await attentionFor(as(world, senior), [client.id])).find(
      (entry) => entry.kind === 'signoffs_to_decide',
    )
    expect(waiting).toMatchObject({ count: 1, earliestDue: addCalendarDays(today, 7) })
    expect(
      (await attentionFor(as(world, admin), [client.id])).some(
        (entry) => entry.kind === 'signoffs_to_decide',
      ),
    ).toBe(false)

    // Only the named approver decides.
    await expect(
      decideSignoff(as(world, admin), client.id, cycleId, { decision: 'approve' }),
    ).rejects.toThrow('sent to someone else')
    await expect(
      decideSignoff(requester, client.id, cycleId, { decision: 'approve' }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    const vague = await decideSignoff(as(world, senior), client.id, cycleId, {
      decision: 'changes',
      note: 'redo',
    }).catch((error: unknown) => error)
    expect((vague as ValidationError).fieldErrors.note).toBeTruthy()
    await decideSignoff(as(world, senior), client.id, cycleId, {
      decision: 'changes',
      note: 'Say which system holds the HR records.',
    })
    expect(await status()).toBe('in_progress')
    await answerItem(requester, client.id, hr.item('B0.3').id, {
      text: 'Darwinbox HRMS, on AWS Mumbai',
    })
    await checkAnswered(requester, client.id, cycleId)

    // Sent again, withdrawn, sent to the administrator and approved.
    await request(senior.userId)
    await withdrawSignoff(requester, client.id, cycleId)
    expect(await status()).toBe('in_progress')
    await request(admin.userId)
    await decideSignoff(as(world, admin), client.id, cycleId, {
      decision: 'approve',
      acknowledge: 'on',
    })
    expect(await status()).toBe('completed')
    const history = await listSignoffs(world.ctx, client.id, cycleId)
    expect(history.map((row) => row.status)).toEqual(['approved', 'withdrawn', 'changes_requested'])
    expect(history[0]).toMatchObject({
      approverUserId: admin.userId,
      requestedBy: junior.userId,
      ownDecision: false,
      dueDate: addCalendarDays(today, 7),
    })
    await expect(
      decideSignoff(as(world, admin), client.id, cycleId, { decision: 'approve' }),
    ).rejects.toBeInstanceOf(RuleError)
  })

  it('TC-C22.3-02 signing off with open errors needs an acknowledgement, and the sign-off keeps the issue counts and posture of that moment', async () => {
    const client = await newClient(world, 'Acknowledge')
    const hr = await newDepartment(world, client.id, 'HR', ['A1.1', 'A3.1'])
    const cycleId = hr.cycle?.id ?? ''
    await answerItem(world.ctx, client.id, hr.item('A1.1').id, { answer: 'no', comment: 'None.' })
    await answerItem(world.ctx, client.id, hr.item('A3.1').id, { answer: 'yes' })
    const file = await uploadEvidence(
      world.ctx,
      client.id,
      { title: 'Notice', itemIds: hr.item('A3.1').id },
      { name: 'notice.pdf', bytes: pdf('notice') },
    )
    await reviewEvidence(world.ctx, client.id, file.id, {
      decision: 'rejected',
      note: 'This is the old notice.',
    })
    await checkAnswered(world.ctx, client.id, cycleId)
    const report = await qualityCheck(world.ctx, client.id, hr.cycle?.code ?? '')
    expect(
      report.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.rule),
    ).toEqual(['evidence_rejected'])

    const refused = await signOffCycle(world.ctx, client.id, cycleId, {}).catch(
      (error: unknown) => error,
    )
    expect(refused).toBeInstanceOf(ValidationError)
    expect((refused as ValidationError).fieldErrors.acknowledge).toMatch(/1 error/)
    await signOffCycle(world.ctx, client.id, cycleId, {
      acknowledge: 'on',
      note: 'The current notice was seen on the website on the visit.',
    })
    const [signed] = await withTenants(world.owner.db, 'all', (tx) =>
      tx.select().from(assessmentSignoff).where(eq(assessmentSignoff.assessmentId, cycleId)),
    )
    expect(signed).toMatchObject({
      status: 'approved',
      acknowledged: true,
      requestedBy: world.ctx.principal.userId,
      approverUserId: world.ctx.principal.userId,
      snapshot: {
        errors: 1,
        warnings: report.counts.warning,
        notes: report.counts.note,
        answered: 2,
        total: 2,
        compliancePct: 50,
      },
    })
    await expect(
      signOffCycle(world.ctx, client.id, cycleId, { acknowledge: 'on' }),
    ).rejects.toBeInstanceOf(RuleError)
  })
})
