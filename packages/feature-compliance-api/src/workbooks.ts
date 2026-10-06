import { AccessDeniedError, authorize, can } from '@duatf/core-access'
import { formatDay, formatIst, isoDate } from '@duatf/core-utils'
import {
  ACTION_STATUSES,
  assessment,
  desc,
  eq,
  question,
  type ActionStatus,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { listActions, type ActionRow } from './actions'
import { getAssessment, listItems } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import {
  clientFigures,
  departmentBreakdown,
  departmentDashboard,
  portfolio,
  type ClientFigures,
} from './dashboard'
import {
  addTableSheet,
  dashboardSheet,
  fraction,
  percentColumns,
  progressCells,
  PROGRESS_COLUMNS,
  textBar,
  type DashCell,
  type Tile,
} from './excel'
import { listFindings, type FindingRow } from './findings'
import {
  ACTION_STATUS_LABEL,
  ASSESSMENT_STATUS_LABEL,
  CLIENT_STATUS_LABEL,
  COMPLIANCE_LABEL,
} from './labels'
import { clientHeader } from './reports'
import { describeResponse } from './responses'
import { heatmap, listRisks, type Band, type RiskRow } from './risks'

/** Columns of the risk-register sheet, in order. */
export const RISK_REGISTER_COLUMNS = [
  'Risk ID',
  'Risk',
  'Finding',
  'Question',
  'Likelihood (1-5)',
  'Impact (1-5)',
  'Score',
  'Rating',
  'Treatment',
  'Status',
  'Owner',
  'Description',
  'Accepted by client on',
  'Acceptance reason',
  'Last updated',
] as const

/** Sheets of each workbook, in order. */
export const WORKBOOK_SHEETS = {
  overall: ['Overall dashboard', 'Compliance by domain', 'Clients', 'Open risks', 'Open actions'],
  client: ['Dashboard', 'Departments', 'Risk register', 'Findings', 'Remediation', 'Answers'],
  department: ['Department dashboard', 'Answers', 'Findings', 'Remediation', 'Evidence'],
} as const

const TREATMENT: Record<string, string> = {
  mitigate: 'Mitigate',
  accept: 'Accept',
  transfer: 'Transfer',
  avoid: 'Avoid',
}

const RISK_STATUS: Record<string, string> = {
  open: 'Open',
  treated: 'Treated',
  accepted: 'Accepted by client',
  closed: 'Closed',
}

const EVIDENCE_STATUS: Record<string, string> = {
  pending_review: 'Awaiting review',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

const percentText = (pct: number | null | undefined) =>
  pct === null || pct === undefined ? '—' : `${pct}%`

const seriousBands = (bands: readonly Band[]) => bands.filter((band) => band.tone === 'severe')

const seriousRisks = (figures: Pick<ClientFigures, 'openRisksByBand'>, bands: readonly Band[]) =>
  seriousBands(bands).reduce((sum, band) => sum + (figures.openRisksByBand[band.name] ?? 0), 0)

export const toBuffer = async (workbook: ExcelJS.Workbook) =>
  Buffer.from(await workbook.xlsx.writeBuffer())

export const newWorkbook = (title: string) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'DUATF'
  workbook.company = 'ComplyX'
  workbook.created = new Date()
  workbook.title = title
  return workbook
}

export const preparedLine = () => `Prepared with DUATF by ComplyX on ${formatIst(new Date())}.`

/** Counts of actions by status, every status listed. */
const actionStatusRows = (actions: readonly Pick<ActionRow, 'status'>[]): DashCell[][] =>
  ACTION_STATUSES.map((status: ActionStatus) => [
    ACTION_STATUS_LABEL[status],
    actions.filter((row) => row.status === status).length,
  ])

const bandRows = (bands: readonly Band[], openByBand: Record<string, number>): DashCell[][] =>
  bands.map((band) => [{ band }, `${band.minScore}–${band.maxScore}`, openByBand[band.name] ?? 0])

const figureTiles = (figures: ClientFigures, bands: readonly Band[]): Tile[] => {
  const progress = figures.latestAssessment?.progress
  return [
    {
      label: 'Answered',
      value: progress ? percentText(progress.progressPct) : '—',
      note: progress ? `${progress.answered} of ${progress.total} questions` : 'No assessment yet',
    },
    {
      label: 'Compliance',
      value: percentText(progress?.compliancePct),
      note: 'Yes plus half of Partial, over answered in scope',
    },
    {
      label: 'Open gaps',
      value: figures.openFindings.gap + figures.openFindings.potentialGap,
      note: `${figures.openFindings.gap} gaps, ${figures.openFindings.potentialGap} potential`,
    },
    {
      label: 'Serious risks',
      value: seriousRisks(figures, bands),
      note: seriousBands(bands)
        .map((band) => `${figures.openRisksByBand[band.name] ?? 0} ${band.name.toLowerCase()}`)
        .join(', '),
      alarm: seriousRisks(figures, bands) > 0,
    },
    {
      label: 'Open actions',
      value: figures.actions.open,
      note: `${figures.actions.underReview} under review, ${figures.actions.closed} closed`,
    },
    {
      label: 'Overdue actions',
      value: figures.actions.overdue,
      note: 'Past their due date and not yet remediated',
      alarm: figures.actions.overdue > 0,
    },
    {
      label: 'Evidence awaiting review',
      value: figures.evidenceAwaitingReview,
      note: 'Files not yet accepted or rejected',
    },
    {
      label: 'Reviewed',
      value: progress ? percentText(progress.reviewedPct) : '—',
      note: progress ? `${progress.accepted} of ${progress.answered} answers checked` : '',
    },
  ]
}

const riskRegisterRows = (risks: RiskRow[]) =>
  risks.map((row) => [
    row.code,
    row.title,
    row.findingCode,
    row.questionCode,
    row.likelihood,
    row.impact,
    row.score,
    row.band.name,
    TREATMENT[row.treatment] ?? row.treatment,
    RISK_STATUS[row.status] ?? row.status,
    row.ownerName,
    row.description,
    row.acceptedAt ? formatIst(row.acceptedAt) : null,
    row.acceptanceNote,
    formatIst(row.updatedAt),
  ])

const FINDING_COLUMNS = [
  'Finding ID',
  'Finding',
  'Type',
  'Status',
  'Question',
  'Control',
  'Domain',
  'Department',
  'Assessment',
  'Risk score',
  'Opened',
  'Closed',
  'Closed because',
]
const FINDING_WIDTHS = [14, 44, 14, 10, 12, 12, 10, 20, 16, 10, 20, 20, 30]

const findingRows = (findings: FindingRow[]) =>
  findings.map((row) => [
    row.code,
    row.title,
    row.gapType === 'gap' ? 'Gap' : 'Potential gap',
    row.status === 'open' ? 'Open' : 'Closed',
    row.questionCode,
    row.controlCode,
    row.domainCode,
    row.departmentName ?? 'Not assigned',
    row.assessmentCode,
    row.riskScore,
    formatIst(row.openedAt),
    row.closedAt ? formatIst(row.closedAt) : null,
    row.closedReason,
  ])

const ACTION_COLUMNS = [
  'Action ID',
  'Action',
  'Finding',
  'Owner',
  'Department',
  'Due',
  'Status',
  'Overdue',
]
const ACTION_WIDTHS = [14, 44, 16, 22, 20, 14, 18, 10]

const actionRows = (actions: ActionRow[]) =>
  actions.map((row) => [
    row.code,
    row.title,
    row.findingCode,
    row.ownerName,
    row.departmentName,
    row.dueDate ? formatDay(row.dueDate) : null,
    ACTION_STATUS_LABEL[row.status],
    row.overdue ? 'Yes' : 'No',
  ])

const ANSWER_COLUMNS = [
  'Question',
  'Template',
  'Section',
  'Domain',
  'Question text',
  'Department',
  'Answer',
  'Outcome',
  'Checked',
  'Recommendation',
]
const ANSWER_WIDTHS = [10, 10, 22, 8, 60, 18, 24, 14, 10, 50]

/** Answers of an assessment, with the recommendation for every gap. */
const answerRows = async (
  ctx: ServiceContext,
  clientId: string,
  latest: { id: string; releaseId: string },
  departmentId?: string,
) => {
  const items = await listItems(ctx, clientId, latest.id, { department: departmentId })
  const recommendations = await inClient(ctx, clientId, (tx) =>
    tx
      .select({ code: question.code, recommendation: question.recommendation })
      .from(question)
      .where(eq(question.releaseId, latest.releaseId)),
  )
  return items.map((row) => [
    row.questionCode,
    row.questionnaireCode,
    row.section,
    row.domainCode,
    row.text,
    row.departmentName,
    describeResponse(row, row),
    COMPLIANCE_LABEL[row.complianceState],
    row.reviewState === 'accepted' ? 'Yes' : 'No',
    row.complianceState === 'gap' || row.complianceState === 'potential_gap'
      ? (recommendations.find((item) => item.code === row.questionCode)?.recommendation ?? null)
      : null,
  ])
}

const latestAssessmentOf = (ctx: ServiceContext, clientId: string) =>
  inClient(ctx, clientId, async (tx) => {
    const [newest] = await tx
      .select({ id: assessment.id, code: assessment.code, releaseId: assessment.releaseId })
      .from(assessment)
      .where(eq(assessment.tenantId, clientId))
      .orderBy(desc(assessment.createdAt))
      .limit(1)
    return newest ?? null
  })

export const recordExport = (
  ctx: ServiceContext,
  tenantId: string | null,
  entityId: string,
  detail: Record<string, unknown>,
) =>
  ctx.db.transaction((tx) =>
    audit(tx, ctx, { tenantId, action: 'report.export', entity: 'report', entityId, detail }),
  )

/**
 * The client's compliance workbook: a dashboard, the figures by department, the risk register,
 * all findings, remediation actions and the answers of the latest assessment.
 */
export const buildComplianceWorkbook = async (
  ctx: ServiceContext,
  clientId: string,
): Promise<{ fileName: string; content: Buffer }> => {
  authorize(ctx.principal, 'report.export', { clientId })
  const [risks, findings, actions, figures, breakdown, latest, clientRow] = await Promise.all([
    listRisks(ctx, clientId),
    listFindings(ctx, clientId),
    listActions(ctx, clientId),
    clientFigures(ctx, clientId),
    departmentBreakdown(ctx, clientId),
    latestAssessmentOf(ctx, clientId),
    inClient(ctx, clientId, (tx) => clientHeader(tx, clientId)),
  ])
  const detail = latest ? await getAssessment(ctx, clientId, latest.code) : null
  const { bands } = figures

  const workbook = newWorkbook(`${clientRow.name} compliance workbook`)
  const dash = dashboardSheet(workbook, 'Dashboard')
  dash.useBands(bands)
  dash.title(`${clientRow.name}: DPDP compliance dashboard`, [
    `Client ID ${clientRow.code} · ${clientRow.legalName}`,
    detail
      ? `Latest assessment: ${detail.title} (${detail.code}) · ${ASSESSMENT_STATUS_LABEL[detail.status]} · knowledge base ${detail.releaseVersion}`
      : 'No assessment yet.',
    preparedLine(),
  ])
  dash.tiles(figureTiles(figures, bands))
  dash.heading('Compliance by domain (latest assessment)')
  dash.table(
    [{ header: 'Domain' }, ...PROGRESS_COLUMNS],
    (detail?.domains ?? []).map((row) => [
      `${row.code} ${row.title}`,
      ...progressCells(row.progress),
    ]),
  )
  dash.heading('By department')
  dash.table(
    [
      { header: 'Department' },
      { header: 'Answered', kind: 'number' },
      { header: 'Compliance', kind: 'percent' },
      { header: '', kind: 'bar' },
      { header: 'Open gaps', kind: 'number' },
      { header: 'Serious risks', kind: 'number' },
      { header: 'Open actions', kind: 'number' },
      { header: 'Overdue', kind: 'number' },
      { header: 'Evidence to review', kind: 'number' },
    ],
    breakdown.rows.map((row) => {
      const progress = row.latestAssessment?.progress
      return [
        row.fullCode ? `${row.name} (${row.fullCode})` : row.name,
        progress ? `${progress.answered}/${progress.total}` : '—',
        fraction(progress?.compliancePct ?? null),
        textBar(progress?.compliancePct ?? null),
        row.openFindings.gap + row.openFindings.potentialGap,
        seriousRisks(row, bands),
        row.actions.open,
        row.actions.overdue,
        row.evidenceAwaitingReview,
      ]
    }),
  )
  dash.heading('Open risks by rating')
  dash.table(
    [{ header: 'Rating' }, { header: 'Score' }, { header: 'Open risks', kind: 'number' }],
    bandRows(bands, figures.openRisksByBand),
  )
  dash.heading('Risk heatmap')
  dash.heatmap(figures.heatmap)
  dash.heading('Remediation by status')
  dash.table(
    [{ header: 'Status' }, { header: 'Actions', kind: 'number' }],
    actionStatusRows(actions),
  )

  const departments = addTableSheet(
    workbook,
    'Departments',
    [
      'Department ID',
      'Department',
      'Head',
      'Questions',
      'Answered',
      'Compliance',
      'Yes',
      'Partial',
      'No',
      'Not applicable',
      'Open gaps',
      'Open potential gaps',
      ...bands.map((band) => `${band.name} risks`),
      'Open actions',
      'Overdue actions',
      'Under review',
      'Closed actions',
      'Evidence awaiting review',
    ],
    breakdown.rows.map((row) => {
      const progress = row.latestAssessment?.progress
      return [
        row.fullCode || null,
        row.name,
        row.headName,
        progress?.total ?? 0,
        progress?.answered ?? 0,
        fraction(progress?.compliancePct ?? null),
        progress?.compliant ?? 0,
        progress?.potentialGap ?? 0,
        progress?.gap ?? 0,
        progress?.excluded ?? 0,
        row.openFindings.gap,
        row.openFindings.potentialGap,
        ...bands.map((band) => row.openRisksByBand[band.name] ?? 0),
        row.actions.open,
        row.actions.overdue,
        row.actions.underReview,
        row.actions.closed,
        row.evidenceAwaitingReview,
      ]
    }),
    [18, 30, 22, 10, 10, 12, 8, 8, 8, 12, 10, 12],
  )
  percentColumns(departments, [6], breakdown.rows.length)

  addTableSheet(
    workbook,
    'Risk register',
    RISK_REGISTER_COLUMNS,
    riskRegisterRows(risks),
    [12, 40, 16, 12, 10, 10, 8, 10, 12, 18, 20, 40, 20, 40, 20],
  )
  addTableSheet(workbook, 'Findings', FINDING_COLUMNS, findingRows(findings), FINDING_WIDTHS)
  addTableSheet(workbook, 'Remediation', ACTION_COLUMNS, actionRows(actions), ACTION_WIDTHS)
  if (latest) {
    addTableSheet(
      workbook,
      'Answers',
      ANSWER_COLUMNS,
      await answerRows(ctx, clientId, latest),
      ANSWER_WIDTHS,
    )
  }
  const content = await toBuffer(workbook)
  await recordExport(ctx, clientId, 'compliance-workbook', {
    risks: risks.length,
    findings: findings.length,
    actions: actions.length,
  })
  return { fileName: `${clientRow.code}-compliance-${isoDate(new Date())}.xlsx`, content }
}

/**
 * The overall workbook across every client the user may export: a dashboard, compliance by
 * domain for each client, the client figures, and all open risks and unfinished actions.
 */
export const buildPortfolioWorkbook = async (
  ctx: ServiceContext,
): Promise<{ fileName: string; content: Buffer }> => {
  const view = await portfolio(ctx)
  const rows = view.rows.filter((row) => can(ctx.principal, 'report.export', { clientId: row.id }))
  if (rows.length === 0) throw new AccessDeniedError('report.export')
  const { bands } = view
  const perClient = await Promise.all(
    rows.map(async (row) => ({
      client: row,
      risks: await listRisks(ctx, row.id),
      actions: await listActions(ctx, row.id),
    })),
  )
  const openRisks = perClient.flatMap(({ client, risks }) =>
    risks
      .filter((risk) => risk.status === 'open' || risk.status === 'treated')
      .map((risk) => ({ client, risk })),
  )
  const unfinished = perClient.flatMap(({ client, actions }) =>
    actions
      .filter((action) => action.status !== 'closed' && action.status !== 'accepted_risk')
      .map((action) => ({ client, action })),
  )
  const sum = (pick: (row: (typeof rows)[number]) => number) =>
    rows.reduce((total, row) => total + pick(row), 0)
  const compliance = rows
    .map((row) => row.latestAssessment?.progress.compliancePct ?? null)
    .filter((value) => value !== null)
  const averageCompliance = compliance.length
    ? Math.round((compliance.reduce((total, value) => total + value, 0) * 10) / compliance.length) /
      10
    : null
  const openByBand = Object.fromEntries(
    bands.map((band) => [band.name, sum((row) => row.openRisksByBand[band.name] ?? 0)]),
  )

  const workbook = newWorkbook('DUATF overall compliance workbook')
  const dash = dashboardSheet(workbook, 'Overall dashboard', 14)
  dash.useBands(bands)
  dash.title('ComplyX: DPDP compliance, all clients', [
    `${rows.length} clients · latest assessment of each client`,
    preparedLine(),
  ])
  dash.tiles([
    {
      label: 'Clients',
      value: rows.length,
      note: `${rows.filter((row) => row.status === 'active' || row.status === 'onboarding').length} active or onboarding`,
    },
    {
      label: 'Assessments running',
      value: rows.filter(
        (row) => row.latestAssessment && row.latestAssessment.status !== 'completed',
      ).length,
      note: 'Latest cycle not completed',
    },
    {
      label: 'Average compliance',
      value: percentText(averageCompliance),
      note: 'Mean of each client’s latest assessment',
    },
    {
      label: 'Open gaps',
      value: sum((row) => row.openFindings.gap + row.openFindings.potentialGap),
      note: `${sum((row) => row.openFindings.gap)} gaps, ${sum((row) => row.openFindings.potentialGap)} potential`,
    },
    {
      label: 'Serious risks',
      value: sum((row) => seriousRisks(row, bands)),
      note: seriousBands(bands)
        .map((band) => `${openByBand[band.name] ?? 0} ${band.name.toLowerCase()}`)
        .join(', '),
      alarm: sum((row) => seriousRisks(row, bands)) > 0,
    },
    { label: 'Open actions', value: sum((row) => row.actions.open), note: 'Not yet remediated' },
    {
      label: 'Overdue actions',
      value: sum((row) => row.actions.overdue),
      alarm: sum((row) => row.actions.overdue) > 0,
      note: 'Past their due date',
    },
    {
      label: 'Evidence awaiting review',
      value: sum((row) => row.evidenceAwaitingReview),
      note: 'Across all clients',
    },
  ])
  dash.heading('Clients')
  dash.table(
    [
      { header: 'Client' },
      { header: 'Latest assessment' },
      { header: 'Answered', kind: 'number' },
      { header: 'Compliance', kind: 'percent' },
      { header: '', kind: 'bar' },
      { header: 'Open gaps', kind: 'number' },
      ...bands.map((band) => ({ header: band.name, kind: 'number' as const })),
      { header: 'Open actions', kind: 'number' },
      { header: 'Overdue', kind: 'number' },
    ],
    rows.map((row) => {
      const latest = row.latestAssessment
      return [
        `${row.name} (${row.code}) · ${CLIENT_STATUS_LABEL[row.status]}`,
        latest ? `${latest.code} · ${ASSESSMENT_STATUS_LABEL[latest.status]}` : 'None yet',
        latest ? `${latest.progress.answered}/${latest.progress.total}` : '—',
        fraction(latest?.progress.compliancePct ?? null),
        textBar(latest?.progress.compliancePct ?? null),
        row.openFindings.gap + row.openFindings.potentialGap,
        ...bands.map((band) => row.openRisksByBand[band.name] ?? 0),
        row.actions.open,
        row.actions.overdue,
      ]
    }),
  )
  dash.heading('Open risks by rating, all clients')
  dash.table(
    [{ header: 'Rating' }, { header: 'Score' }, { header: 'Open risks', kind: 'number' }],
    bandRows(bands, openByBand),
  )
  dash.heading('Risk heatmap, all clients')
  dash.heatmap(heatmap(openRisks.map(({ risk }) => risk)))
  dash.heading('Actions due next')
  const allowed = new Set(rows.map((row) => row.code))
  dash.table(
    [
      { header: 'Client' },
      { header: 'Action' },
      { header: 'Owner' },
      { header: 'Due' },
      { header: 'Status' },
    ],
    view.dueActions
      .filter((row) => allowed.has(row.clientCode))
      .map((row) => [
        `${row.clientName} (${row.clientCode})`,
        `${row.code}: ${row.title}`,
        row.ownerName ?? 'Not assigned',
        row.dueDate ? `${formatDay(row.dueDate)}${row.overdue ? ' (overdue)' : ''}` : 'No date',
        ACTION_STATUS_LABEL[row.status],
      ]),
  )

  const domains = view.domains
  const matrix = addTableSheet(
    workbook,
    'Compliance by domain',
    ['Client', 'Overall', ...domains.map((row) => `${row.code} ${row.title}`)],
    rows.map((row) => {
      const latest = row.latestAssessment
      return [
        `${row.name} (${row.code})`,
        fraction(latest?.progress.compliancePct ?? null),
        ...domains.map((item) =>
          fraction(
            latest?.domains.find((entry) => entry.code === item.code)?.progress.compliancePct ??
              null,
          ),
        ),
      ]
    }),
    [30, 11, ...domains.map(() => 13)],
  )
  matrix.getRow(1).height = 60
  percentColumns(
    matrix,
    Array.from({ length: domains.length + 1 }, (_, index) => index + 2),
    rows.length,
  )

  const clients = addTableSheet(
    workbook,
    'Clients',
    [
      'Client ID',
      'Client',
      'Industry',
      'Status',
      'Latest assessment',
      'Assessment status',
      'Questions',
      'Answered',
      'Compliance',
      'Reviewed',
      'Open gaps',
      'Open potential gaps',
      ...bands.map((band) => `${band.name} risks`),
      'Open actions',
      'Overdue actions',
      'Under review',
      'Closed actions',
      'Evidence awaiting review',
    ],
    rows.map((row) => {
      const latest = row.latestAssessment
      return [
        row.code,
        row.name,
        row.industry,
        CLIENT_STATUS_LABEL[row.status],
        latest?.code ?? null,
        latest ? ASSESSMENT_STATUS_LABEL[latest.status] : null,
        latest?.progress.total ?? 0,
        latest?.progress.answered ?? 0,
        fraction(latest?.progress.compliancePct ?? null),
        fraction(latest?.progress.reviewedPct ?? null),
        row.openFindings.gap,
        row.openFindings.potentialGap,
        ...bands.map((band) => row.openRisksByBand[band.name] ?? 0),
        row.actions.open,
        row.actions.overdue,
        row.actions.underReview,
        row.actions.closed,
        row.evidenceAwaitingReview,
      ]
    }),
    [12, 26, 22, 12, 18, 16, 10, 10, 12, 12, 10, 12],
  )
  percentColumns(clients, [9, 10], rows.length)

  addTableSheet(
    workbook,
    'Open risks',
    ['Client', ...RISK_REGISTER_COLUMNS.slice(0, 11)],
    openRisks.map(({ client, risk }) => [
      client.code,
      ...(riskRegisterRows([risk])[0]?.slice(0, 11) ?? []),
    ]),
    [12, 12, 40, 16, 12, 10, 10, 8, 10, 12, 18, 20],
  )
  addTableSheet(
    workbook,
    'Open actions',
    ['Client', ...ACTION_COLUMNS],
    unfinished.map(({ client, action }) => [client.code, ...(actionRows([action])[0] ?? [])]),
    [12, ...ACTION_WIDTHS],
  )

  const content = await toBuffer(workbook)
  await recordExport(ctx, null, 'overall-workbook', { clients: rows.map((row) => row.code) })
  return { fileName: `DUATF-overall-${isoDate(new Date())}.xlsx`, content }
}

/**
 * One department's workbook: its dashboard, its answers in the latest assessment, its
 * findings, remediation actions and evidence.
 */
export const buildDepartmentWorkbook = async (
  ctx: ServiceContext,
  clientId: string,
  departmentCode: string,
): Promise<{ fileName: string; content: Buffer }> => {
  authorize(ctx.principal, 'report.export', { clientId })
  const view = await departmentDashboard(ctx, clientId, departmentCode)
  const { department, client, figures, bands } = view
  const [findings, latest] = await Promise.all([
    listFindings(ctx, clientId, { departmentId: department.id }),
    latestAssessmentOf(ctx, clientId),
  ])
  const titles = new Map(view.domainTitles.map((row) => [row.code, row.title]))

  const workbook = newWorkbook(`${client.name} ${department.name} workbook`)
  const dash = dashboardSheet(workbook, 'Department dashboard')
  dash.useBands(bands)
  dash.title(`${department.name}: ${client.name}`, [
    `Department ID ${department.fullCode}${department.headName ? ` · contact ${department.headName}` : ''}`,
    figures.latestAssessment
      ? `Latest assessment: ${figures.latestAssessment.title} (${figures.latestAssessment.code}) · ${ASSESSMENT_STATUS_LABEL[figures.latestAssessment.status]}`
      : 'No assessment yet.',
    preparedLine(),
  ])
  dash.tiles(figureTiles(figures, bands))
  dash.heading('Compliance by domain (questions of this department)')
  dash.table(
    [{ header: 'Domain' }, ...PROGRESS_COLUMNS],
    (figures.latestAssessment?.domains ?? []).map((row) => [
      `${row.code} ${titles.get(row.code) ?? ''}`.trim(),
      ...progressCells(row.progress),
    ]),
  )
  dash.heading('Open findings')
  dash.table(
    [{ header: 'Finding' }, { header: 'Type' }, { header: 'Question' }, { header: 'Risk' }],
    view.findings.map((row) => [
      `${row.code}: ${row.title}`,
      row.gapType === 'gap' ? 'Gap' : 'Potential gap',
      row.questionCode,
      row.band ? { band: row.band, text: `${row.band.name} · ${row.riskScore ?? ''}` } : '—',
    ]),
  )
  dash.heading('Open risks by rating')
  dash.table(
    [{ header: 'Rating' }, { header: 'Score' }, { header: 'Open risks', kind: 'number' }],
    bandRows(bands, figures.openRisksByBand),
  )
  dash.heading('Risk heatmap')
  dash.heatmap(view.heatmap)
  dash.heading('Remediation by status')
  dash.table(
    [{ header: 'Status' }, { header: 'Actions', kind: 'number' }],
    actionStatusRows(view.actions),
  )

  addTableSheet(
    workbook,
    'Answers',
    ANSWER_COLUMNS,
    latest ? await answerRows(ctx, clientId, latest, department.id) : [],
    ANSWER_WIDTHS,
  )
  addTableSheet(workbook, 'Findings', FINDING_COLUMNS, findingRows(findings), FINDING_WIDTHS)
  addTableSheet(workbook, 'Remediation', ACTION_COLUMNS, actionRows(view.actions), ACTION_WIDTHS)
  addTableSheet(
    workbook,
    'Evidence',
    [
      'Evidence ID',
      'Title',
      'File',
      'Status',
      'Uploaded by',
      'Uploaded',
      'Valid until',
      'Used for',
    ],
    view.evidence.map((row) => [
      row.code,
      row.title,
      row.fileName,
      EVIDENCE_STATUS[row.status] ?? row.status,
      row.uploadedByName,
      formatIst(row.uploadedAt),
      row.validUntil ? `${formatDay(row.validUntil)}${row.expired ? ' (expired)' : ''}` : null,
      `${row.linkCount} questions`,
    ]),
    [14, 40, 30, 16, 22, 20, 16, 12],
  )

  const content = await toBuffer(workbook)
  await recordExport(ctx, clientId, `department-workbook/${department.code}`, {
    findings: findings.length,
    actions: view.actions.length,
  })
  return {
    fileName: `${client.code}-${department.code}-department-${isoDate(new Date())}.xlsx`,
    content,
  }
}
