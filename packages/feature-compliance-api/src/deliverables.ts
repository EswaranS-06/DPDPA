import { authorize } from '@duatf/core-access'
import { formatDay, isoDate } from '@duatf/core-utils'
import {
  barsSvg,
  bullets,
  buildDocument,
  facts,
  heading,
  pageBreak,
  para,
  picture,
  radarSvg,
  svgToPng,
  table,
  type Block,
} from '@duatf/platform-documents'
import { count, eq, obligation, question } from '@duatf/platform-db'
import { getAssessment } from './assessments'
import { inClient, type ServiceContext } from './context'
import { standardsCrosswalk } from './crosswalk'
import { listFindings } from './findings'
import { coverage, penaltyExposure } from './insights'
import { ASSESSMENT_STATUS_LABEL } from './labels'
import { MATURITY_LEVELS, MATURITY_MAX, maturityProfile } from './maturity'
import { explainCompliance, type Progress } from './progress'
import { clientHeader } from './reports'
import { listBands, ratingFor } from './risks'
import { roadmap } from './roadmap'
import { listSignoffs } from './signoff'
import { recordExport } from './workbooks'

// Word deliverables of an assessment (ADR-0009 decision 13): the gap-assessment report, a
// two-page board memo and a one-page assessment statement. None of them calls the result a
// certificate or says that the organisation complies with the Act.

export const FIRM = 'ComplyX'

export const GAP_REPORT_SECTIONS = [
  'Summary',
  'Scope and method',
  'Maturity by requirement area',
  'Compliance by requirement area',
  'Findings and recommendations',
  'Open gaps by Schedule item',
  'Evidence and remediation coverage',
  'Roadmap',
  'Standards crosswalk',
  'About this report',
] as const

export const MEMO_SECTIONS = [
  'Where the organisation stands',
  'What needs attention first',
  'Schedule items with open gaps',
  'Decisions for the Board',
] as const

/** Said on the statement, the memo and the report: what the result is and is not. */
export const NOT_A_CERTIFICATE = (organisation: string) =>
  `This document records the result of an assessment against the knowledge base release named in it. It is not a certificate, and it does not state that ${organisation} complies with the Digital Personal Data Protection Act, 2023 or the Digital Personal Data Protection Rules, 2025.`

const pct = (value: number | null) => (value === null ? 'not yet scored' : `${value}%`)

/** The posture with the working behind it, in one sentence. */
export const postureSentence = (progress: Progress) => {
  const working = explainCompliance(progress)
  if (working.scored === 0) return 'No answer in scope has been scored yet.'
  return `Compliance posture ${pct(working.pct)}: ${working.yes} Yes and ${working.partial} Partial (counted as half) out of ${working.scored} scored answers${
    working.no ? `, with ${working.no} No` : ''
  }. ${working.notApplicable} not applicable and ${working.notAnswered} not yet answered are left out.`
}

const level = (value: number | null) => (value === null ? '—' : value.toFixed(1))

/** Everything the three deliverables draw on, read once. */
const loadDeliverable = async (ctx: ServiceContext, clientId: string, assessmentCode: string) => {
  authorize(ctx.principal, 'report.export', { clientId })
  const detail = await getAssessment(ctx, clientId, assessmentCode)
  const [
    client,
    findings,
    maturity,
    penalty,
    covered,
    plan,
    crosswalk,
    signoffs,
    bands,
    commencement,
    recommendations,
  ] = await Promise.all([
    inClient(ctx, clientId, (tx) => clientHeader(tx, clientId)),
    listFindings(ctx, clientId, { assessmentId: detail.id, status: 'open' }),
    maturityProfile(ctx, clientId, detail.code),
    penaltyExposure(ctx, clientId),
    coverage(ctx, clientId, detail.code),
    roadmap(ctx, clientId),
    standardsCrosswalk(ctx, clientId),
    listSignoffs(ctx, clientId, detail.id),
    listBands(ctx.db),
    inClient(ctx, clientId, (tx) =>
      tx
        .select({ date: obligation.inForce, obligations: count() })
        .from(obligation)
        .where(eq(obligation.releaseId, detail.releaseId))
        .groupBy(obligation.inForce),
    ),
    inClient(ctx, clientId, (tx) =>
      tx
        .select({ code: question.code, recommendation: question.recommendation })
        .from(question)
        .where(eq(question.releaseId, detail.releaseId)),
    ),
  ])
  const approved = signoffs.find((row) => row.status === 'approved') ?? null
  const organisation = client.legalName || client.name
  const today = isoDate(new Date())
  const ranked = [...findings].sort(
    (a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0) || a.code.localeCompare(b.code),
  )
  return {
    client,
    organisation,
    detail,
    findings: ranked.map((row) => ({
      ...row,
      band: row.riskScore === null ? null : ratingFor(row.riskScore, bands),
      recommendation:
        recommendations.find((item) => item.code === row.questionCode)?.recommendation ?? '',
    })),
    maturity,
    penalty,
    covered,
    plan,
    crosswalk,
    approved,
    commencement: commencement
      .map((row) => ({ date: row.date, obligations: row.obligations }))
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    today,
  }
}
type Deliverable = Awaited<ReturnType<typeof loadDeliverable>>

const signoffLine = (data: Deliverable) =>
  data.approved
    ? `Signed off by ${data.approved.approverName} on ${formatDay(isoDate(data.approved.decidedAt ?? data.approved.requestedAt))}${
        data.approved.ownDecision ? ', who also completed the cycle' : ''
      }.`
    : 'Not signed off yet. Until it is, this is a draft.'

const headerOf = (data: Deliverable, name: string) =>
  `${data.client.name}: ${name}, ${data.detail.code}`
const footer = (data: Deliverable) => `Prepared by ${FIRM} on ${formatDay(data.today)}`

const radarPicture = (data: Deliverable): Block[] => {
  const rows = data.maturity.assessed
  if (rows.length < 3) return []
  const image = svgToPng(
    radarSvg({
      axes: rows.map((row) => row.domainCode),
      series: [
        { label: data.detail.code, values: rows.map((row) => row.level), style: 'area' },
        { label: 'Target', values: rows.map((row) => row.target), style: 'outline' },
      ],
      max: MATURITY_MAX,
    }),
  )
  return [
    picture(
      image.png,
      { width: Math.round(image.width * 0.82), height: Math.round(image.height * 0.82) },
      {
        title: 'Maturity by requirement area',
        description: rows
          .map((row) => `${row.domainCode} ${row.title}: ${level(row.level)}, target ${row.target}`)
          .join('; '),
      },
    ),
  ]
}

const penaltyPicture = (data: Deliverable): Block[] => {
  if (!data.penalty.items.length) return []
  const image = svgToPng(
    barsSvg({
      rows: data.penalty.items.map((item) => ({
        label: `${item.tier} ${item.text}`,
        value: item.findings.length,
        valueText: `${item.findings.length} open gap${item.findings.length === 1 ? '' : 's'}`,
        quiet: item.findings.length === 0,
      })),
    }),
  )
  return [
    picture(
      image.png,
      { width: Math.round(image.width * 0.66), height: Math.round(image.height * 0.66) },
      {
        title: 'Open gaps by Schedule item',
        description: data.penalty.items
          .map((item) => `${item.tier}: ${item.findings.length} open gaps`)
          .join('; '),
      },
    ),
  ]
}

const fileName = (data: Deliverable, kind: string) =>
  `${data.client.code}-${data.detail.code}-${kind}-${data.today}.docx`

/** The gap-assessment report: the whole picture of one cycle, with its charts as pictures. */
export const buildGapReport = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentCode: string,
): Promise<{ fileName: string; content: Buffer }> => {
  const data = await loadDeliverable(ctx, clientId, assessmentCode)
  const { detail, maturity } = data
  const working = explainCompliance(detail.progress)
  const gaps = data.findings.filter((row) => row.gapType === 'gap').length
  const children: Block[] = [
    para([{ text: 'DPDP gap assessment report', bold: true }], { size: 44 }),
    para(data.organisation, { size: 28 }),
    facts([
      ['Assessment', `${detail.title} (${detail.code})`],
      [
        'Period',
        detail.periodStart
          ? `${formatDay(detail.periodStart)}${detail.periodEnd ? ` to ${formatDay(detail.periodEnd)}` : ''}`
          : null,
      ],
      ['Knowledge base release', detail.releaseVersion],
      ['Status of the cycle', ASSESSMENT_STATUS_LABEL[detail.status]],
      ['Sign-off', signoffLine(data)],
      ['Prepared by', `${FIRM}, ${formatDay(data.today)}`],
    ]),
    pageBreak(),

    heading(GAP_REPORT_SECTIONS[0]),
    para(postureSentence(detail.progress)),
    facts([
      ['Questions answered', `${detail.progress.answered} of ${detail.progress.total}`],
      ['Compliance posture', pct(working.pct)],
      [
        'Open findings',
        `${data.findings.length}: ${gaps} gaps, ${data.findings.length - gaps} potential gaps`,
      ],
      [
        'Mean maturity',
        maturity.overall
          ? `${level(maturity.overall.level)} against a mean target of ${level(maturity.overall.target)}`
          : null,
      ],
      [
        'Answers with accepted evidence',
        `${data.covered.evidence.covered} of ${data.covered.evidence.total}`,
      ],
      [
        'Open findings with an action',
        `${data.covered.actions.covered} of ${data.covered.actions.total}`,
      ],
    ]),

    heading(GAP_REPORT_SECTIONS[1]),
    para(
      `The assessment asked the questions of DUATF's question bank (knowledge base release ${detail.releaseVersion}) of each department in scope. Each answer was checked against the evidence the department gave. A Yes counts in full, a Partial as half and a No not at all; questions that do not apply are left out of the posture. Obligations that start on later dates were assessed as well.`,
    ),
    table(
      ['Department', 'Questions', 'Answered', 'Compliance'],
      detail.departments.map((row) => [
        row.name,
        row.progress.total,
        row.progress.answered,
        pct(row.progress.compliancePct),
      ]),
      [46, 18, 18, 18],
    ),

    heading(GAP_REPORT_SECTIONS[2]),
    para(
      `A requirement area's level is the mean of its maturity answers on a scale of 0 (${MATURITY_LEVELS[0]}) to ${MATURITY_MAX} (${MATURITY_LEVELS[MATURITY_MAX]}); where an area has only Yes, Partial and No questions, they stand for levels 3, 2 and 0. Level 3 is the lowest level the question bank counts as compliant. Areas with no scored answer are left off the chart.`,
    ),
    ...radarPicture(data),
    table(
      ['Requirement area', 'Level', 'Target', 'Gap', 'Priority'],
      maturity.rows.map((row) => [
        `${row.domainCode} ${row.title}`,
        level(row.level),
        row.target,
        level(row.gap),
        row.gap > 0 ? level(row.priority) : '—',
      ]),
      [52, 12, 12, 12, 12],
    ),

    heading(GAP_REPORT_SECTIONS[3]),
    table(
      ['Requirement area', 'Answered', 'Yes', 'Partial', 'No', 'Compliance'],
      detail.domains.map((row) => [
        `${row.code} ${row.title}`,
        `${row.progress.answered} of ${row.progress.total}`,
        row.progress.compliant,
        row.progress.potentialGap,
        row.progress.gap,
        pct(row.progress.compliancePct),
      ]),
      [40, 14, 10, 12, 10, 14],
    ),

    heading(GAP_REPORT_SECTIONS[4]),
    para(`${data.findings.length} findings are open, the highest risk first.`),
    table(
      ['Finding', 'Area', 'Type', 'Risk', 'Recommendation'],
      data.findings.map((row) => [
        `${row.code} ${row.title}`,
        row.domainCode,
        row.gapType === 'gap' ? 'Gap' : 'Potential gap',
        row.band ? `${row.band.name} (${row.riskScore})` : 'Not rated',
        row.recommendation || null,
      ]),
      [30, 8, 12, 12, 38],
    ),

    heading(GAP_REPORT_SECTIONS[5]),
    para(data.penalty.note),
    ...penaltyPicture(data),
    table(
      ['Schedule item', 'Open gaps'],
      data.penalty.items.map((item) => [`${item.tier} ${item.text}`, item.findings.length]),
      [80, 20],
    ),

    heading(GAP_REPORT_SECTIONS[6]),
    ...bullets([
      `${data.covered.evidence.covered} of ${data.covered.evidence.total} scored answers rest on accepted evidence.`,
      `${data.covered.actions.covered} of ${data.covered.actions.total} open findings have a remediation action.`,
    ]),

    heading(GAP_REPORT_SECTIONS[7]),
    para(
      `${data.plan.total} unfinished actions, in three phases. An action's phase is the one set for it, or else the one its risk rating suggests.`,
    ),
    ...data.plan.phases.flatMap((phase) => [
      heading(`${phase.label}, ${phase.window}`, 2),
      para(
        `${phase.actions} action${phase.actions === 1 ? '' : 's'}, ${phase.effortDays} days of effort estimated${
          phase.unestimated ? `, ${phase.unestimated} not yet estimated` : ''
        }${phase.overdue ? `, ${phase.overdue} overdue` : ''}.`,
        { muted: true },
      ),
      ...(phase.rows.length
        ? [
            table(
              ['Action', 'Finding', 'Owner', 'Due', 'Effort', 'Risk'],
              phase.rows.map((row) => [
                `${row.code} ${row.title}`,
                row.findingCode,
                row.ownerName,
                row.dueDate ? formatDay(row.dueDate) : null,
                row.effortDays === null ? null : `${row.effortDays} d`,
                row.band?.name ?? null,
              ]),
              [34, 16, 16, 14, 8, 12],
            ),
          ]
        : []),
    ]),

    heading(GAP_REPORT_SECTIONS[8]),
    para(
      `Each open gap appears under every reference that the knowledge base gives for its control, so a client running these standards can see where the same work counts.`,
    ),
    ...data.crosswalk.standards.flatMap((standard) => [
      heading(standard.label, 2),
      ...(standard.references.length
        ? [
            table(
              [standard.part, 'Controls', 'Open gaps'],
              standard.references.map((row) => [
                row.reference,
                row.controls.join(', '),
                row.gaps.length,
              ]),
              [30, 50, 20],
            ),
          ]
        : [para('No open gap maps to this standard.', { muted: true })]),
    ]),

    heading(GAP_REPORT_SECTIONS[9]),
    para(
      `Generated by DUATF from the records of ${data.client.name} on ${formatDay(data.today)}: answers, evidence, findings, risks and actions. ${NOT_A_CERTIFICATE(data.organisation)}`,
    ),
  ]
  const content = await buildDocument({
    title: `DPDP gap assessment report, ${data.client.name}`,
    subject: `${detail.title} (${detail.code})`,
    header: headerOf(data, 'gap assessment report'),
    footer: footer(data),
    children,
  })
  await recordExport(ctx, clientId, `gap-report/${detail.code}`, { findings: data.findings.length })
  return { fileName: fileName(data, 'gap-report'), content }
}

/** A two-page memo for the Board of Directors: where things stand and what to decide. */
export const buildBoardMemo = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentCode: string,
): Promise<{ fileName: string; content: Buffer }> => {
  const data = await loadDeliverable(ctx, clientId, assessmentCode)
  const { detail, maturity, plan } = data
  const now = plan.phases[0] ?? { actions: 0, effortDays: 0, unestimated: 0 }
  const unowned = plan.phases.flatMap((phase) => phase.rows).filter((row) => !row.ownerName).length
  const later = data.commencement.filter((row) => row.date && row.date > data.today)
  const inForce = data.commencement
    .filter((row) => !row.date || row.date <= data.today)
    .reduce((sum, row) => sum + row.obligations, 0)
  const total = data.commencement.reduce((sum, row) => sum + row.obligations, 0)
  const children: Block[] = [
    para([{ text: 'Memo to the Board of Directors', bold: true }], { size: 36 }),
    facts([
      ['To', `The Board of Directors, ${data.organisation}`],
      ['From', FIRM],
      ['Date', formatDay(data.today)],
      ['Subject', `DPDP compliance assessment ${detail.code}: result and decisions`],
    ]),

    heading(MEMO_SECTIONS[0]),
    para(postureSentence(detail.progress)),
    para(
      `${data.findings.length} findings are open.${
        maturity.overall
          ? ` The mean maturity across ${maturity.assessed.length} requirement areas is ${level(maturity.overall.level)}, against a target of ${level(maturity.overall.target)}.`
          : ''
      } ${inForce} of ${total} obligations in the knowledge base apply today${
        later.length
          ? `; ${later.map((row) => `${row.obligations} more from ${formatDay(row.date ?? '')}`).join(' and ')}`
          : ''
      }.`,
    ),

    heading(MEMO_SECTIONS[1]),
    ...bullets(
      maturity.ranked
        .slice(0, 5)
        .map(
          (row) =>
            `${row.title}: level ${level(row.level)} against a target of ${row.target}${row.penaltyTier ? `, Schedule item ${row.penaltyTier}` : ''}.`,
        ),
    ),
    ...(data.findings.length
      ? [
          para('The highest-risk open findings:', { muted: true }),
          ...bullets(
            data.findings
              .slice(0, 5)
              .map((row) => `${row.code} ${row.title}${row.band ? ` (${row.band.name})` : ''}.`),
          ),
        ]
      : []),

    heading(MEMO_SECTIONS[2]),
    ...bullets(
      data.penalty.exposed.map(
        (item) =>
          `${item.tier} ${item.text}: ${item.findings.length} open gap${item.findings.length === 1 ? '' : 's'}.`,
      ),
    ),
    para(data.penalty.note, { muted: true }),

    heading(MEMO_SECTIONS[3]),
    ...bullets([
      `Approve the first phase of the roadmap: ${now.actions} action${now.actions === 1 ? '' : 's'} within 3 months, ${now.effortDays} days of effort estimated${now.unestimated ? ` and ${now.unestimated} still to estimate` : ''}.`,
      ...(unowned
        ? [
            `Name an owner for the ${unowned} unfinished action${unowned === 1 ? '' : 's'} that have none.`,
          ]
        : []),
      'Confirm the maturity target for each requirement area. Level 3 applies unless the Board sets another.',
      'Ask for the next report once the first phase is due.',
    ]),
    para(NOT_A_CERTIFICATE(data.organisation), { muted: true, size: 18 }),
  ]
  const content = await buildDocument({
    title: `Board memo, ${data.client.name}`,
    subject: `${detail.title} (${detail.code})`,
    header: headerOf(data, 'board memo'),
    footer: footer(data),
    children,
  })
  await recordExport(ctx, clientId, `board-memo/${detail.code}`, {})
  return { fileName: fileName(data, 'board-memo'), content }
}

/** A one-page statement of what was assessed, against what, with what result and sign-off. */
export const buildAssessmentStatement = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentCode: string,
): Promise<{ fileName: string; content: Buffer }> => {
  const data = await loadDeliverable(ctx, clientId, assessmentCode)
  const { detail } = data
  const gaps = data.findings.filter((row) => row.gapType === 'gap').length
  const children: Block[] = [
    para([{ text: 'Assessment statement', bold: true }], { size: 36 }),
    facts([
      ['Organisation', data.organisation],
      ['Assessment', `${detail.title} (${detail.code})`],
      [
        'Scope',
        `${detail.departments.length} department${detail.departments.length === 1 ? '' : 's'}: ${detail.departments
          .map((row) => row.name)
          .join(', ')}; ${detail.progress.total} questions`,
      ],
      [
        'Period',
        detail.periodStart
          ? `${formatDay(detail.periodStart)}${detail.periodEnd ? ` to ${formatDay(detail.periodEnd)}` : ''}`
          : null,
      ],
      [
        'Assessed against',
        `DPDP Act, 2023 and DPDP Rules, 2025, as in knowledge base release ${detail.releaseVersion}`,
      ],
      ['Status of the cycle', ASSESSMENT_STATUS_LABEL[detail.status]],
      ['Result', postureSentence(detail.progress)],
      [
        'Open findings',
        `${data.findings.length}: ${gaps} gaps and ${data.findings.length - gaps} potential gaps`,
      ],
      ['Sign-off', signoffLine(data)],
      ['Prepared by', `${FIRM}, ${formatDay(data.today)}`],
    ]),
    para(NOT_A_CERTIFICATE(data.organisation), { muted: true }),
  ]
  const content = await buildDocument({
    title: `Assessment statement, ${data.client.name}`,
    subject: `${detail.title} (${detail.code})`,
    header: headerOf(data, 'assessment statement'),
    footer: footer(data),
    children,
  })
  await recordExport(ctx, clientId, `statement/${detail.code}`, {})
  return { fileName: fileName(data, 'statement'), content }
}
