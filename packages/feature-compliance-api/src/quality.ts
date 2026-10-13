import { authorize } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  asc,
  assessmentItem,
  count,
  department,
  eq,
  evidence,
  evidenceLink,
  finding,
  inArray,
  question,
  remediationAction,
  risk,
  type ActionStatus,
  type Answer,
  type EvidenceStatus,
  type FindingStatus,
  type RiskStatus,
  type Transaction,
} from '@duatf/platform-db'
import { findAssessment } from './assessments'
import { inClient, type ServiceContext } from './context'
import { freshnessOf } from './evidence'

// The quality check of an assessment (ADR-0009): rules read the cycle's answers, evidence,
// findings, actions and risks and return what should be looked at before it is signed off.
// It is computed each time and never stored.

export type QualitySeverity = 'error' | 'warning' | 'note'

type RuleText = { severity: QualitySeverity; title: string; advice: string }

/**
 * Every rule, in the order issues are listed. An error means the answer or record cannot stand
 * as it is; a warning should be dealt with; a note is for information.
 */
export const QUALITY_RULES = {
  yes_no_evidence_asked: {
    severity: 'error',
    title: 'Yes, with no evidence, on a question that asks for evidence',
    advice: 'Attach the evidence the question lists, or change the answer.',
  },
  evidence_rejected: {
    severity: 'error',
    title: 'The answer rests only on rejected evidence',
    advice: 'Attach evidence that can be accepted, or change the answer.',
  },
  evidence_expired: {
    severity: 'error',
    title: 'Every piece of evidence behind the answer has expired',
    advice: 'Ask for a current document and attach it.',
  },
  acceptance_lapsed: {
    severity: 'error',
    title: 'The acceptance of a risk has lapsed',
    advice: 'Record the client’s renewed acceptance with a new date, or reopen the risk.',
  },
  yes_no_evidence: {
    severity: 'warning',
    title: 'Yes, with no evidence',
    advice: 'Attach what shows it, or say in the note what was seen.',
  },
  partial_no_evidence: {
    severity: 'warning',
    title: 'Partial, with no evidence',
    advice: 'A partial answer is still a claim; attach what shows the part that is in place.',
  },
  evidence_awaiting_review: {
    severity: 'warning',
    title: 'The evidence behind the answer is not reviewed yet',
    advice: 'Accept or reject the files waiting for review.',
  },
  gap_no_note: {
    severity: 'warning',
    title: 'A gap with no note',
    advice: 'Say what was found, so the finding can be understood without the auditor.',
  },
  partial_no_note: {
    severity: 'warning',
    title: 'A potential gap with no note',
    advice: 'Say what is in place and what is missing.',
  },
  finding_no_action: {
    severity: 'warning',
    title: 'An open finding with no remediation action',
    advice: 'Plan an action, or record the client’s acceptance of the risk.',
  },
  action_overdue: {
    severity: 'warning',
    title: 'An action past its due date',
    advice: 'Update its status or agree a new date.',
  },
  evidence_expiring: {
    severity: 'note',
    title: 'Evidence behind the answer expires soon',
    advice: 'Ask for the renewed document before it runs out.',
  },
  action_no_owner: {
    severity: 'note',
    title: 'An action with no owner',
    advice: 'Name the person at the client who carries it out.',
  },
  action_no_due_date: {
    severity: 'note',
    title: 'An action with no due date',
    advice: 'Agree a date, so it shows in the roadmap and the reminders.',
  },
  acceptance_no_end_date: {
    severity: 'note',
    title: 'A risk accepted with no end date',
    advice: 'Record until when the client accepts it.',
  },
} as const satisfies Record<string, RuleText>

export type QualityRule = keyof typeof QUALITY_RULES
export const QUALITY_RULE_ORDER = Object.keys(QUALITY_RULES) as QualityRule[]

export type QualitySubject =
  | { kind: 'item'; questionCode: string; departmentCode: string | null }
  | { kind: 'finding'; code: string }
  | { kind: 'action'; code: string }
  | { kind: 'risk'; code: string; findingCode: string | null }

export type QualityIssue = {
  rule: QualityRule
  severity: QualitySeverity
  /** What the issue is about, as shown in the list: "B2.2 Access control" or "REM-MALLARD-004". */
  label: string
  departmentName: string | null
  subject: QualitySubject
}

export type QualityEvidence = { status: EvidenceStatus; validUntil: string | null }

export type QualityInput = {
  items: {
    questionCode: string
    title: string
    departmentCode: string | null
    departmentName: string | null
    answer: Answer
    /** False for questions that only record facts; they are never flagged. */
    scored: boolean
    comment: string | null
    /** The question lists evidence it needs, or requires an attachment. */
    evidenceAsked: boolean
    evidence: QualityEvidence[]
  }[]
  findings: {
    code: string
    title: string
    status: FindingStatus
    departmentName: string | null
    actions: number
    riskStatus: RiskStatus | null
  }[]
  actions: {
    code: string
    title: string
    status: ActionStatus
    dueDate: string | null
    owned: boolean
    departmentName: string | null
  }[]
  risks: {
    code: string
    title: string
    status: RiskStatus
    acceptedUntil: string | null
    findingCode: string | null
  }[]
}

const SEVERITY_ORDER: QualitySeverity[] = ['error', 'warning', 'note']
const FINISHED_ACTIONS: ActionStatus[] = ['closed', 'accepted_risk', 'remediated']

/** How a file stands on a day: usable, expiring within 30 days, expired, or not accepted. */
export const evidenceStanding = (
  file: QualityEvidence,
  today: string,
): 'usable' | 'expiring' | 'expired' | 'pending' | 'rejected' => {
  if (file.status === 'rejected') return 'rejected'
  if (file.status === 'pending_review') return 'pending'
  const freshness = freshnessOf(file.validUntil, today)
  return freshness === 'expired' || freshness === 'expiring' ? freshness : 'usable'
}

const blank = (text: string | null) => (text ?? '').trim() === ''

/** Applies every rule. Pure: the same input and day always give the same issues. */
export const checkQuality = (input: QualityInput, today: string): QualityIssue[] => {
  const issues: QualityIssue[] = []
  const raise = (
    rule: QualityRule,
    label: string,
    departmentName: string | null,
    subject: QualitySubject,
  ) => issues.push({ rule, severity: QUALITY_RULES[rule].severity, label, departmentName, subject })

  for (const item of input.items) {
    if (!item.scored) continue
    const label = `${item.questionCode} ${item.title}`
    const subject: QualitySubject = {
      kind: 'item',
      questionCode: item.questionCode,
      departmentCode: item.departmentCode,
    }
    const flag = (rule: QualityRule) => raise(rule, label, item.departmentName, subject)
    if (item.answer === 'no' && blank(item.comment)) flag('gap_no_note')
    if (item.answer === 'partial' && blank(item.comment)) flag('partial_no_note')
    if (item.answer !== 'yes' && item.answer !== 'partial') continue

    const standing = item.evidence.map((file) => evidenceStanding(file, today))
    const good = standing.filter((state) => state === 'usable' || state === 'expiring')
    if (standing.length === 0) {
      flag(
        item.answer === 'partial'
          ? 'partial_no_evidence'
          : item.evidenceAsked
            ? 'yes_no_evidence_asked'
            : 'yes_no_evidence',
      )
    } else if (good.length === 0) {
      // Nothing usable: say why, most recoverable reason first.
      if (standing.includes('pending')) flag('evidence_awaiting_review')
      else if (standing.includes('expired')) flag('evidence_expired')
      else flag('evidence_rejected')
    } else if (!good.includes('usable')) {
      flag('evidence_expiring')
    }
  }

  for (const row of input.findings) {
    if (row.status === 'open' && row.actions === 0 && row.riskStatus !== 'accepted') {
      raise('finding_no_action', `${row.code} ${row.title}`, row.departmentName, {
        kind: 'finding',
        code: row.code,
      })
    }
  }

  for (const row of input.actions) {
    if (FINISHED_ACTIONS.includes(row.status)) continue
    const label = `${row.code} ${row.title}`
    const subject: QualitySubject = { kind: 'action', code: row.code }
    if (row.dueDate !== null && row.dueDate < today) {
      raise('action_overdue', label, row.departmentName, subject)
    }
    if (!row.owned) raise('action_no_owner', label, row.departmentName, subject)
    if (row.dueDate === null) raise('action_no_due_date', label, row.departmentName, subject)
  }

  for (const row of input.risks) {
    if (row.status !== 'accepted') continue
    const subject: QualitySubject = { kind: 'risk', code: row.code, findingCode: row.findingCode }
    if (row.acceptedUntil === null) {
      raise('acceptance_no_end_date', `${row.code} ${row.title}`, null, subject)
    } else if (row.acceptedUntil < today) {
      raise('acceptance_lapsed', `${row.code} ${row.title}`, null, subject)
    }
  }

  const ruleRank = new Map(QUALITY_RULE_ORDER.map((rule, index) => [rule, index]))
  return issues.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      (ruleRank.get(a.rule) ?? 0) - (ruleRank.get(b.rule) ?? 0) ||
      (a.departmentName ?? '').localeCompare(b.departmentName ?? '') ||
      a.label.localeCompare(b.label, 'en', { numeric: true }),
  )
}

export type QualityCounts = Record<QualitySeverity, number>

export const countIssues = (issues: readonly QualityIssue[]): QualityCounts => ({
  error: issues.filter((issue) => issue.severity === 'error').length,
  warning: issues.filter((issue) => issue.severity === 'warning').length,
  note: issues.filter((issue) => issue.severity === 'note').length,
})

/** Reads everything the rules need for one cycle. */
export const loadQualityInput = async (
  tx: Transaction,
  clientId: string,
  cycle: { id: string; releaseId: string },
): Promise<QualityInput> => {
  const items = await tx
    .select({
      id: assessmentItem.id,
      questionCode: assessmentItem.questionCode,
      title: question.title,
      departmentCode: department.code,
      departmentName: department.name,
      answer: assessmentItem.answer,
      scored: question.scored,
      comment: assessmentItem.comment,
      attachmentRequired: question.attachmentRequired,
      evidenceRequired: question.evidenceRequired,
    })
    .from(assessmentItem)
    .innerJoin(
      question,
      and(eq(question.releaseId, cycle.releaseId), eq(question.code, assessmentItem.questionCode)),
    )
    .leftJoin(department, eq(department.id, assessmentItem.departmentId))
    .where(and(eq(assessmentItem.assessmentId, cycle.id), eq(assessmentItem.tenantId, clientId)))
    .orderBy(asc(department.code), asc(assessmentItem.seq))
  const itemIds = items.map((row) => row.id)
  const files = itemIds.length
    ? await tx
        .select({
          itemId: evidenceLink.itemId,
          status: evidence.status,
          validUntil: evidence.validUntil,
        })
        .from(evidenceLink)
        .innerJoin(evidence, eq(evidence.id, evidenceLink.evidenceId))
        .where(and(eq(evidenceLink.tenantId, clientId), inArray(evidenceLink.itemId, itemIds)))
    : []
  const findings = await tx
    .select({
      id: finding.id,
      code: finding.code,
      title: finding.title,
      status: finding.status,
      departmentName: department.name,
      riskStatus: risk.status,
    })
    .from(finding)
    .innerJoin(assessmentItem, eq(assessmentItem.id, finding.itemId))
    .leftJoin(department, eq(department.id, assessmentItem.departmentId))
    .leftJoin(risk, eq(risk.findingId, finding.id))
    .where(and(eq(finding.assessmentId, cycle.id), eq(finding.tenantId, clientId)))
    .orderBy(asc(finding.code))
  const findingIds = findings.map((row) => row.id)
  const actions = findingIds.length
    ? await tx
        .select({
          findingId: remediationAction.findingId,
          code: remediationAction.code,
          title: remediationAction.title,
          status: remediationAction.status,
          dueDate: remediationAction.dueDate,
          ownerUserId: remediationAction.ownerUserId,
          ownerName: remediationAction.ownerName,
          departmentName: department.name,
        })
        .from(remediationAction)
        .leftJoin(department, eq(department.id, remediationAction.departmentId))
        .where(
          and(
            eq(remediationAction.tenantId, clientId),
            inArray(remediationAction.findingId, findingIds),
          ),
        )
        .orderBy(asc(remediationAction.code))
    : []
  const risks = findingIds.length
    ? await tx
        .select({
          code: risk.code,
          title: risk.title,
          status: risk.status,
          acceptedUntil: risk.acceptedUntil,
          findingCode: finding.code,
        })
        .from(risk)
        .innerJoin(finding, eq(finding.id, risk.findingId))
        .where(and(eq(risk.tenantId, clientId), inArray(risk.findingId, findingIds)))
        .orderBy(asc(risk.code))
    : []
  return {
    items: items.map((row) => ({
      questionCode: row.questionCode,
      title: row.title,
      departmentCode: row.departmentCode,
      departmentName: row.departmentName,
      answer: row.answer,
      scored: row.scored,
      comment: row.comment,
      evidenceAsked: row.attachmentRequired || row.evidenceRequired.length > 0,
      evidence: files
        .filter((file) => file.itemId === row.id)
        .map((file) => ({ status: file.status, validUntil: file.validUntil })),
    })),
    findings: findings.map((row) => ({
      code: row.code,
      title: row.title,
      status: row.status,
      departmentName: row.departmentName,
      // Actions set aside by an accepted risk are not work on the finding.
      actions: actions.filter(
        (action) => action.findingId === row.id && action.status !== 'accepted_risk',
      ).length,
      riskStatus: row.riskStatus,
    })),
    actions: actions.map((row) => ({
      code: row.code,
      title: row.title,
      status: row.status,
      dueDate: row.dueDate,
      owned: row.ownerUserId !== null || !blank(row.ownerName),
      departmentName: row.departmentName,
    })),
    risks,
  }
}

/** The issues of a cycle and their counts, for use inside another transaction. */
export const qualityOf = async (
  tx: Transaction,
  clientId: string,
  cycle: { id: string; releaseId: string },
) => {
  const issues = checkQuality(await loadQualityInput(tx, clientId, cycle), isoDate(new Date()))
  return { issues, counts: countIssues(issues) }
}

/** The quality check of one assessment: its issues, errors first, grouped by rule. */
export const qualityCheck = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const found = await findAssessment(tx, clientId, code)
    const [scoredRow] = await tx
      .select({ n: count() })
      .from(assessmentItem)
      .where(eq(assessmentItem.assessmentId, found.id))
    const { issues, counts } = await qualityOf(tx, clientId, found)
    return {
      assessment: { id: found.id, code: found.code, status: found.status },
      questions: scoredRow?.n ?? 0,
      issues,
      counts,
      groups: QUALITY_RULE_ORDER.map((rule) => ({
        rule,
        ...QUALITY_RULES[rule],
        issues: issues.filter((issue) => issue.rule === rule),
      })).filter((group) => group.issues.length > 0),
    }
  })
}
export type QualityReport = Awaited<ReturnType<typeof qualityCheck>>
