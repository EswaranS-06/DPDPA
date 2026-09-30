import { authorize } from '@duatf/core-access'
import { formatIst, isoDate } from '@duatf/core-utils'
import { clientProfile, eq, question, tenant, type Transaction } from '@duatf/platform-db'
import { listActions } from './actions'
import { getAssessment } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import { NotFoundError } from './errors'
import { listFindings } from './findings'
import { ACTION_STATUS_LABEL, APPLICABILITY_LABEL } from './labels'
import { heatmap, listBands, listRisks, ratingFor } from './risks'

/** Name, legal name and applicability of a client, for report headings. */
export const clientHeader = async (tx: Transaction, clientId: string) => {
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
