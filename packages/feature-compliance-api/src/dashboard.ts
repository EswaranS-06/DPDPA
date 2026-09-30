import { authorize, isFirmRole, type Principal } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  assessment,
  assessmentItem,
  count,
  desc,
  eq,
  evidence,
  finding,
  inArray,
  lt,
  notInArray,
  remediationAction,
  risk,
  type AssessmentStatus,
  type Transaction,
} from '@duatf/platform-db'
import { FINAL_ACTION_STATUSES } from './actions'
import { listClients, type ClientSummary } from './clients'
import { inClient, inUserScope, type ServiceContext } from './context'
import { summariseProgress, type Progress } from './progress'
import { listBands, ratingFor, type Band } from './risks'

export type ClientFigures = {
  latestAssessment: {
    id: string
    code: string
    title: string
    status: AssessmentStatus
    dueDate: string | null
    progress: Progress
  } | null
  openFindings: { gap: number; potentialGap: number }
  openRisksByBand: Record<string, number>
  actions: { open: number; overdue: number; underReview: number; closed: number }
  evidenceAwaitingReview: number
}

const OPEN_RISK = ['open', 'treated'] as const
// Actions that need no more work from the client: finished, or fixed and awaiting closure.
const FINISHED = new Set<string>([...FINAL_ACTION_STATUSES, 'remediated'])

/** Figures for a set of clients, computed with a handful of grouped queries. */
const figuresFor = async (
  tx: Transaction,
  clientIds: string[],
  bands: Band[],
): Promise<Map<string, ClientFigures>> => {
  const result = new Map<string, ClientFigures>()
  if (clientIds.length === 0) return result
  const today = isoDate(new Date())

  const assessments = await tx
    .select({
      id: assessment.id,
      tenantId: assessment.tenantId,
      code: assessment.code,
      title: assessment.title,
      status: assessment.status,
      dueDate: assessment.dueDate,
    })
    .from(assessment)
    .where(inArray(assessment.tenantId, clientIds))
    .orderBy(desc(assessment.createdAt))
  const latest = new Map<string, (typeof assessments)[number]>()
  for (const row of assessments) if (!latest.has(row.tenantId)) latest.set(row.tenantId, row)
  const latestIds = [...latest.values()].map((row) => row.id)
  const counts = latestIds.length
    ? await tx
        .select({
          assessmentId: assessmentItem.assessmentId,
          complianceState: assessmentItem.complianceState,
          reviewState: assessmentItem.reviewState,
          n: count(),
        })
        .from(assessmentItem)
        .where(inArray(assessmentItem.assessmentId, latestIds))
        .groupBy(
          assessmentItem.assessmentId,
          assessmentItem.complianceState,
          assessmentItem.reviewState,
        )
    : []

  const findings = await tx
    .select({ tenantId: finding.tenantId, gapType: finding.gapType, n: count() })
    .from(finding)
    .where(and(inArray(finding.tenantId, clientIds), eq(finding.status, 'open')))
    .groupBy(finding.tenantId, finding.gapType)

  const risks = await tx
    .select({ tenantId: risk.tenantId, score: risk.score, n: count() })
    .from(risk)
    .where(and(inArray(risk.tenantId, clientIds), inArray(risk.status, [...OPEN_RISK])))
    .groupBy(risk.tenantId, risk.score)

  const actions = await tx
    .select({ tenantId: remediationAction.tenantId, status: remediationAction.status, n: count() })
    .from(remediationAction)
    .where(inArray(remediationAction.tenantId, clientIds))
    .groupBy(remediationAction.tenantId, remediationAction.status)
  const overdue = await tx
    .select({ tenantId: remediationAction.tenantId, n: count() })
    .from(remediationAction)
    .where(
      and(
        inArray(remediationAction.tenantId, clientIds),
        lt(remediationAction.dueDate, today),
        notInArray(remediationAction.status, [...FINAL_ACTION_STATUSES, 'remediated']),
      ),
    )
    .groupBy(remediationAction.tenantId)

  const pendingEvidence = await tx
    .select({ tenantId: evidence.tenantId, n: count() })
    .from(evidence)
    .where(and(inArray(evidence.tenantId, clientIds), eq(evidence.status, 'pending_review')))
    .groupBy(evidence.tenantId)

  for (const clientId of clientIds) {
    const current = latest.get(clientId)
    const byBand: Record<string, number> = Object.fromEntries(bands.map((band) => [band.name, 0]))
    for (const row of risks.filter((item) => item.tenantId === clientId)) {
      const name = ratingFor(row.score, bands).name
      byBand[name] = (byBand[name] ?? 0) + row.n
    }
    const actionCount = (match: (status: string) => boolean) =>
      actions
        .filter((row) => row.tenantId === clientId && match(row.status))
        .reduce((sum, row) => sum + row.n, 0)
    result.set(clientId, {
      latestAssessment: current
        ? {
            ...current,
            progress: summariseProgress(counts.filter((row) => row.assessmentId === current.id)),
          }
        : null,
      openFindings: {
        gap: findings.find((row) => row.tenantId === clientId && row.gapType === 'gap')?.n ?? 0,
        potentialGap:
          findings.find((row) => row.tenantId === clientId && row.gapType === 'potential_gap')?.n ??
          0,
      },
      openRisksByBand: byBand,
      actions: {
        open: actionCount((status) => !FINISHED.has(status)),
        overdue: overdue.find((row) => row.tenantId === clientId)?.n ?? 0,
        underReview: actionCount((status) => status === 'under_review'),
        closed: actionCount((status) => status === 'closed'),
      },
      evidenceAwaitingReview: pendingEvidence.find((row) => row.tenantId === clientId)?.n ?? 0,
    })
  }
  return result
}

export type PortfolioRow = ClientSummary & ClientFigures

/** Every client the user may see, with its latest assessment and open work, plus totals. */
export const portfolio = async (ctx: ServiceContext) => {
  const clients = await listClients(ctx)
  const bands = await listBands(ctx.db)
  const figures = await inUserScope(ctx, (tx) =>
    figuresFor(
      tx,
      clients.map((client) => client.id),
      bands,
    ),
  )
  const rows: PortfolioRow[] = clients.map((client) => {
    const found = figures.get(client.id)
    if (!found) throw new Error(`No figures for client ${client.code}`)
    return { ...client, ...found }
  })
  const sum = (pick: (row: PortfolioRow) => number) =>
    rows.reduce((total, row) => total + pick(row), 0)
  return {
    bands,
    rows,
    totals: {
      clients: rows.length,
      activeClients: rows.filter((row) => row.status === 'active' || row.status === 'onboarding')
        .length,
      assessmentsInProgress: rows.filter(
        (row) => row.latestAssessment && row.latestAssessment.status !== 'completed',
      ).length,
      openGaps: sum((row) => row.openFindings.gap),
      openPotentialGaps: sum((row) => row.openFindings.potentialGap),
      openRisksByBand: Object.fromEntries(
        bands.map((band) => [band.name, sum((row) => row.openRisksByBand[band.name] ?? 0)]),
      ) as Record<string, number>,
      overdueActions: sum((row) => row.actions.overdue),
      evidenceAwaitingReview: sum((row) => row.evidenceAwaitingReview),
    },
  }
}
export type Portfolio = Awaited<ReturnType<typeof portfolio>>

/** The same figures for one client, for its dashboard. */
export const clientFigures = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const bands = await listBands(ctx.db)
  const figures = await inClient(ctx, clientId, (tx) => figuresFor(tx, [clientId], bands))
  const found = figures.get(clientId)
  if (!found) throw new Error('No figures for this client.')
  return { ...found, bands }
}

/**
 * Where a user lands after signing in: client users with one organisation go straight to it;
 * everyone else sees the portfolio (or the list of their organisations).
 */
export const homeFor = (principal: Principal, clientCodes: readonly string[]): string | null => {
  const firmUser = principal.assignments.some((assignment) => isFirmRole(assignment.role))
  if (firmUser) return null
  return clientCodes.length === 1 ? `/clients/${clientCodes[0] ?? ''}` : null
}
