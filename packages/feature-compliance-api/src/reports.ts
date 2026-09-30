import { authorize } from '@duatf/core-access'
import { formatDay, formatIst, isoDate } from '@duatf/core-utils'
import {
  assessment,
  clientProfile,
  desc,
  eq,
  question,
  tenant,
  type Transaction,
} from '@duatf/platform-db'
import ExcelJS from 'exceljs'
import { listActions } from './actions'
import { getAssessment, listItems } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import { NotFoundError } from './errors'
import { listFindings } from './findings'
import {
  ACTION_STATUS_LABEL,
  ANSWER_LABEL,
  APPLICABILITY_LABEL,
  COMPLIANCE_LABEL,
  REVIEW_LABEL,
} from './labels'
import { heatmap, listBands, listRisks, ratingFor } from './risks'

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

const addSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  columns: readonly string[],
  rows: (string | number | null)[][],
  widths: number[],
) => {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = columns.map((header, index) => ({ header, width: widths[index] ?? 18 }))
  for (const row of rows) sheet.addRow(row)
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F2E9C' } }
  header.alignment = { vertical: 'middle', wrapText: true }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  sheet.eachRow((row, index) => {
    if (index > 1) row.alignment = { vertical: 'top', wrapText: true }
  })
  return sheet
}

const clientHeader = async (tx: Transaction, clientId: string) => {
  const [row] = await tx
    .select({
      code: tenant.code,
      name: tenant.name,
      legalName: clientProfile.legalName,
      applicability: clientProfile.applicability,
      applicabilityNote: clientProfile.applicabilityNote,
    })
    .from(tenant)
    .innerJoin(clientProfile, eq(clientProfile.tenantId, tenant.id))
    .where(eq(tenant.id, clientId))
  if (!row) throw new NotFoundError('Client')
  return row
}

/**
 * The client's compliance workbook: risk register, findings, remediation actions and the
 * answers of the latest assessment, one sheet each.
 */
export const buildComplianceWorkbook = async (
  ctx: ServiceContext,
  clientId: string,
): Promise<{ fileName: string; content: Buffer }> => {
  authorize(ctx.principal, 'report.export', { clientId })
  const [risks, findings, actions] = await Promise.all([
    listRisks(ctx, clientId),
    listFindings(ctx, clientId),
    listActions(ctx, clientId),
  ])
  const { latest, clientRow } = await inClient(ctx, clientId, async (tx) => {
    const [newest] = await tx
      .select({ id: assessment.id, releaseId: assessment.releaseId })
      .from(assessment)
      .where(eq(assessment.tenantId, clientId))
      .orderBy(desc(assessment.createdAt))
      .limit(1)
    return { latest: newest, clientRow: await clientHeader(tx, clientId) }
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'DUATF'
  workbook.created = new Date()
  workbook.title = `${clientRow.name} compliance workbook`

  addSheet(
    workbook,
    'Risk register',
    RISK_REGISTER_COLUMNS,
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
    ]),
    [12, 40, 16, 12, 10, 10, 8, 10, 12, 18, 20, 40, 20, 40, 20],
  )
  addSheet(
    workbook,
    'Findings',
    [
      'Finding ID',
      'Finding',
      'Type',
      'Status',
      'Question',
      'Control',
      'Domain',
      'Assessment',
      'Opened',
      'Closed',
      'Closed because',
    ],
    findings.map((row) => [
      row.code,
      row.title,
      row.gapType === 'gap' ? 'Gap' : 'Potential gap',
      row.status === 'open' ? 'Open' : 'Closed',
      row.questionCode,
      row.controlCode,
      row.domainCode,
      row.assessmentCode,
      formatIst(row.openedAt),
      row.closedAt ? formatIst(row.closedAt) : null,
      row.closedReason,
    ]),
    [14, 44, 14, 10, 12, 12, 10, 16, 20, 20, 24],
  )
  addSheet(
    workbook,
    'Remediation',
    ['Action ID', 'Action', 'Finding', 'Owner', 'Department', 'Due', 'Status', 'Overdue'],
    actions.map((row) => [
      row.code,
      row.title,
      row.findingCode,
      row.ownerName,
      row.departmentName,
      row.dueDate ? formatDay(row.dueDate) : null,
      ACTION_STATUS_LABEL[row.status],
      row.overdue ? 'Yes' : 'No',
    ]),
    [14, 44, 16, 22, 18, 14, 18, 10],
  )
  if (latest) {
    const items = await listItems(ctx, clientId, latest.id)
    const details = await inClient(ctx, clientId, (tx) =>
      tx
        .select({ code: question.code, recommendation: question.recommendation })
        .from(question)
        .where(eq(question.releaseId, latest.releaseId)),
    )
    addSheet(
      workbook,
      'Answers',
      [
        'Question',
        'Domain',
        'Question text',
        'Department',
        'Answer',
        'Outcome',
        'Review',
        'Recommendation',
      ],
      items.map((row) => [
        row.questionCode,
        row.domainCode,
        row.text,
        row.departmentName,
        ANSWER_LABEL[row.answer],
        COMPLIANCE_LABEL[row.complianceState],
        REVIEW_LABEL[row.reviewState],
        row.complianceState === 'gap' || row.complianceState === 'potential_gap'
          ? (details.find((item) => item.code === row.questionCode)?.recommendation ?? null)
          : null,
      ]),
      [12, 8, 60, 18, 14, 14, 12, 50],
    )
  }
  const content = Buffer.from(await workbook.xlsx.writeBuffer())
  await ctx.db.transaction((tx) =>
    audit(tx, ctx, {
      tenantId: clientId,
      action: 'report.export',
      entity: 'report',
      entityId: 'compliance-workbook',
      detail: { risks: risks.length, findings: findings.length, actions: actions.length },
    }),
  )
  return {
    fileName: `${clientRow.code}-compliance-${isoDate(new Date())}.xlsx`,
    content,
  }
}

/** Sections every executive report contains, in order. */
export const EXECUTIVE_SECTIONS = [
  'Summary',
  'Scope and method',
  'Compliance by domain',
  'Key findings',
  'Risk register',
  'Remediation',
  'About this report',
] as const

/** Everything the printable executive report shows for one assessment. */
export const executiveReport = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentCode: string,
) => {
  authorize(ctx.principal, 'report.view', { clientId })
  const client = await inClient(ctx, clientId, (tx) => clientHeader(tx, clientId))
  const detail = await getAssessment(ctx, clientId, assessmentCode)
  const [findings, risks, actions, bands] = await Promise.all([
    listFindings(ctx, clientId, { assessmentId: detail.id, status: 'open' }),
    listRisks(ctx, clientId),
    listActions(ctx, clientId),
    listBands(ctx.db),
  ])
  const findingIds = new Set(findings.map((row) => row.id))
  const assessmentRisks = risks.filter(
    (row) => row.findingCode !== null && findings.some((item) => item.code === row.findingCode),
  )
  const keyFindings = [...findings]
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
    .slice(0, 10)
  const assessmentActions = actions.filter((row) => findingIds.has(row.findingId))
  const byStatus = Object.entries(
    assessmentActions.reduce<Record<string, number>>((totals, row) => {
      const label = ACTION_STATUS_LABEL[row.status]
      totals[label] = (totals[label] ?? 0) + 1
      return totals
    }, {}),
  )
  const recommendations = await inClient(ctx, clientId, (tx) =>
    tx
      .select({ code: question.code, recommendation: question.recommendation })
      .from(question)
      .where(eq(question.releaseId, detail.releaseId)),
  )
  await ctx.db.transaction((tx) =>
    audit(tx, ctx, {
      tenantId: clientId,
      action: 'report.view',
      entity: 'report',
      entityId: `executive/${detail.code}`,
    }),
  )
  return {
    sections: EXECUTIVE_SECTIONS,
    generatedOn: isoDate(new Date()),
    generatedAt: formatIst(new Date()),
    preparedFor: {
      name: client.name,
      legalName: client.legalName,
      code: client.code,
      applicability: APPLICABILITY_LABEL[client.applicability],
      applicabilityNote: client.applicabilityNote,
    },
    assessment: {
      code: detail.code,
      title: detail.title,
      status: detail.status,
      releaseVersion: detail.releaseVersion,
      periodStart: detail.periodStart,
      periodEnd: detail.periodEnd,
      progress: detail.progress,
      domains: detail.domains,
    },
    keyFindings: keyFindings.map((row) => ({
      ...row,
      band: row.riskScore === null ? null : ratingFor(row.riskScore, bands),
      recommendation:
        recommendations.find((item) => item.code === row.questionCode)?.recommendation ?? '',
    })),
    openFindingCount: findings.length,
    bands,
    riskHeatmap: heatmap(assessmentRisks),
    risksByBand: bands.map((band) => ({
      band,
      count: assessmentRisks.filter(
        (row) => row.band.name === band.name && (row.status === 'open' || row.status === 'treated'),
      ).length,
    })),
    acceptedRisks: assessmentRisks.filter((row) => row.status === 'accepted').length,
    actionsByStatus: byStatus,
    overdueActions: assessmentActions.filter((row) => row.overdue).length,
  }
}
export type ExecutiveReport = Awaited<ReturnType<typeof executiveReport>>
