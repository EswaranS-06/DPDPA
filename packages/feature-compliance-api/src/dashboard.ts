import { authorize, isFirmRole, type Principal } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  appUser,
  asc,
  assessment,
  assessmentItem,
  count,
  department,
  desc,
  domain,
  eq,
  evidence,
  finding,
  frameworkRelease,
  inArray,
  lt,
  notInArray,
  remediationAction,
  risk,
  sql,
  tenant,
  type AnyColumn,
  type AssessmentStatus,
  type Transaction,
} from '@duatf/platform-db'
import { FINAL_ACTION_STATUSES, listActions } from './actions'
import { listClients, type ClientSummary } from './clients'
import { inClient, inUserScope, type ServiceContext } from './context'
import { departmentCode } from './departments'
import { NotFoundError } from './errors'
import { listEvidence } from './evidence'
import { listFindings } from './findings'
import { summariseProgress, type Progress, type StateCount } from './progress'
import { heatmap, listBands, ratingFor, type Band } from './risks'

export type DomainProgress = { code: string; progress: Progress }

export type ClientFigures = {
  latestAssessment: {
    id: string
    code: string
    title: string
    status: AssessmentStatus
    dueDate: string | null
    progress: Progress
    /** Progress by domain, for domains with at least one question in scope of the figures. */
    domains: DomainProgress[]
  } | null
  openFindings: { gap: number; potentialGap: number }
  openRisksByBand: Record<string, number>
  actions: { open: number; overdue: number; underReview: number; closed: number }
  evidenceAwaitingReview: number
}

/** Key for figures of questions, findings, actions and evidence that have no department. */
export const NO_DEPARTMENT = 'none'

const OPEN_RISK = ['open', 'treated'] as const
// Actions that need no more work from the client: finished, or fixed and awaiting closure.
const FINISHED = new Set<string>([...FINAL_ACTION_STATUSES, 'remediated'])

type Grouping = { by: 'client' } | { by: 'department' }

/** The grouping column as a plain value, so client and department figures share one query. */
const keyOf = (column: AnyColumn) => sql<string | null>`${column}`
const keyed = (value: string | null) => value ?? NO_DEPARTMENT

/**
 * Figures for each key, computed with a handful of grouped queries. Keys are client ids, or
 * (grouping by department, for a single client) department ids and NO_DEPARTMENT. The
 * department of a finding or risk is the department its question is assigned to.
 */
const figuresFor = async (
  tx: Transaction,
  scope: { clientIds: string[]; keys: string[] } & Grouping,
  bands: Band[],
): Promise<Map<string, ClientFigures>> => {
  const { clientIds, keys } = scope
  const byClient = scope.by === 'client'
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

  const itemKey = byClient ? assessmentItem.tenantId : assessmentItem.departmentId
  const counts = latestIds.length
    ? await tx
        .select({
          key: keyOf(itemKey),
          domainCode: assessmentItem.domainCode,
          complianceState: assessmentItem.complianceState,
          reviewState: assessmentItem.reviewState,
          n: count(),
        })
        .from(assessmentItem)
        .where(inArray(assessmentItem.assessmentId, latestIds))
        .groupBy(
          itemKey,
          assessmentItem.domainCode,
          assessmentItem.complianceState,
          assessmentItem.reviewState,
        )
    : []

  const findingKey = byClient ? finding.tenantId : assessmentItem.departmentId
  const findings = await tx
    .select({ key: keyOf(findingKey), gapType: finding.gapType, n: count() })
    .from(finding)
    .innerJoin(assessmentItem, eq(assessmentItem.id, finding.itemId))
    .where(and(inArray(finding.tenantId, clientIds), eq(finding.status, 'open')))
    .groupBy(findingKey, finding.gapType)

  const riskKey = byClient ? risk.tenantId : assessmentItem.departmentId
  const risks = await tx
    .select({ key: keyOf(riskKey), score: risk.score, n: count() })
    .from(risk)
    .leftJoin(finding, eq(finding.id, risk.findingId))
    .leftJoin(assessmentItem, eq(assessmentItem.id, finding.itemId))
    .where(and(inArray(risk.tenantId, clientIds), inArray(risk.status, [...OPEN_RISK])))
    .groupBy(riskKey, risk.score)

  const actionKey = byClient ? remediationAction.tenantId : remediationAction.departmentId
  const actions = await tx
    .select({ key: keyOf(actionKey), status: remediationAction.status, n: count() })
    .from(remediationAction)
    .where(inArray(remediationAction.tenantId, clientIds))
    .groupBy(actionKey, remediationAction.status)
  const overdue = await tx
    .select({ key: keyOf(actionKey), n: count() })
    .from(remediationAction)
    .where(
      and(
        inArray(remediationAction.tenantId, clientIds),
        lt(remediationAction.dueDate, today),
        notInArray(remediationAction.status, [...FINAL_ACTION_STATUSES, 'remediated']),
      ),
    )
    .groupBy(actionKey)

  const evidenceKey = byClient ? evidence.tenantId : evidence.departmentId
  const pendingEvidence = await tx
    .select({ key: keyOf(evidenceKey), n: count() })
    .from(evidence)
    .where(and(inArray(evidence.tenantId, clientIds), eq(evidence.status, 'pending_review')))
    .groupBy(evidenceKey)

  for (const key of keys) {
    const mine = <Row extends { key: string | null }>(rows: Row[]) =>
      rows.filter((row) => keyed(row.key) === key)
    const current = byClient ? latest.get(key) : latest.get(clientIds[0] ?? '')
    const byBand: Record<string, number> = Object.fromEntries(bands.map((band) => [band.name, 0]))
    for (const row of mine(risks)) {
      const name = ratingFor(row.score, bands).name
      byBand[name] = (byBand[name] ?? 0) + row.n
    }
    const actionCount = (match: (status: string) => boolean) =>
      mine(actions)
        .filter((row) => match(row.status))
        .reduce((sum, row) => sum + row.n, 0)
    const itemCounts: (StateCount & { domainCode: string })[] = mine(counts)
    const domainCodes = [...new Set(itemCounts.map((row) => row.domainCode))].sort()
    const gapsOf = (gapType: string) =>
      mine(findings)
        .filter((row) => row.gapType === gapType)
        .reduce((sum, row) => sum + row.n, 0)
    result.set(key, {
      latestAssessment: current
        ? {
            ...current,
            progress: summariseProgress(itemCounts),
            domains: domainCodes.map((code) => ({
              code,
              progress: summariseProgress(itemCounts.filter((row) => row.domainCode === code)),
            })),
          }
        : null,
      openFindings: { gap: gapsOf('gap'), potentialGap: gapsOf('potential_gap') },
      openRisksByBand: byBand,
      actions: {
        open: actionCount((status) => !FINISHED.has(status)),
        overdue: mine(overdue).reduce((sum, row) => sum + row.n, 0),
        underReview: actionCount((status) => status === 'under_review'),
        closed: actionCount((status) => status === 'closed'),
      },
      evidenceAwaitingReview: mine(pendingEvidence).reduce((sum, row) => sum + row.n, 0),
    })
  }
  return result
}

/** Domains of the published knowledge base, in order, for dashboard headings. */
const publishedDomains = async (tx: Transaction) => {
  const [release] = await tx
    .select({ id: frameworkRelease.id })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  if (!release) return []
  return tx
    .select({ code: domain.code, title: domain.title })
    .from(domain)
    .where(eq(domain.releaseId, release.id))
    .orderBy(asc(domain.code))
}

/** A 5 x 5 grid of open risks for a set of clients (and optionally one department). */
const riskGrid = async (tx: Transaction, clientIds: string[], departmentId?: string) => {
  const grid = heatmap([])
  if (clientIds.length === 0) return grid
  const rows = await tx
    .select({ likelihood: risk.likelihood, impact: risk.impact, n: count() })
    .from(risk)
    .leftJoin(finding, eq(finding.id, risk.findingId))
    .leftJoin(assessmentItem, eq(assessmentItem.id, finding.itemId))
    .where(
      and(
        inArray(risk.tenantId, clientIds),
        inArray(risk.status, [...OPEN_RISK]),
        departmentId ? eq(assessmentItem.departmentId, departmentId) : undefined,
      ),
    )
    .groupBy(risk.likelihood, risk.impact)
  for (const row of rows) {
    const cells = grid[5 - row.likelihood]
    if (cells) cells[row.impact - 1] = (cells[row.impact - 1] ?? 0) + row.n
  }
  return grid
}

export type PortfolioRow = ClientSummary & ClientFigures

/**
 * Every client the user may see, with its latest assessment and open work, plus totals, the
 * risk heatmap across clients and the unfinished actions due first.
 */
export const portfolio = async (ctx: ServiceContext) => {
  const clients = await listClients(ctx)
  const bands = await listBands(ctx.db)
  const clientIds = clients.map((client) => client.id)
  const today = isoDate(new Date())
  const { figures, grid, domains, due } = await inUserScope(ctx, async (tx) => ({
    figures: await figuresFor(tx, { clientIds, keys: clientIds, by: 'client' }, bands),
    grid: await riskGrid(tx, clientIds),
    domains: await publishedDomains(tx),
    due: clientIds.length
      ? await tx
          .select({
            id: remediationAction.id,
            code: remediationAction.code,
            title: remediationAction.title,
            status: remediationAction.status,
            dueDate: remediationAction.dueDate,
            clientCode: tenant.code,
            clientName: tenant.name,
            ownerName: appUser.displayName,
            departmentName: department.name,
          })
          .from(remediationAction)
          .innerJoin(tenant, eq(tenant.id, remediationAction.tenantId))
          .leftJoin(appUser, eq(appUser.id, remediationAction.ownerUserId))
          .leftJoin(department, eq(department.id, remediationAction.departmentId))
          .where(
            and(
              inArray(remediationAction.tenantId, clientIds),
              notInArray(remediationAction.status, ['closed', 'accepted_risk', 'remediated']),
            ),
          )
          .orderBy(sql`${remediationAction.dueDate} asc nulls last`, asc(remediationAction.code))
          .limit(12)
      : [],
  }))
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
    domains,
    heatmap: grid,
    dueActions: due.map((row) => ({
      ...row,
      overdue: row.dueDate !== null && row.dueDate < today,
    })),
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
      openActions: sum((row) => row.actions.open),
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
  const { figures, grid } = await inClient(ctx, clientId, async (tx) => ({
    figures: await figuresFor(tx, { clientIds: [clientId], keys: [clientId], by: 'client' }, bands),
    grid: await riskGrid(tx, [clientId]),
  }))
  const found = figures.get(clientId)
  if (!found) throw new Error('No figures for this client.')
  return { ...found, bands, heatmap: grid }
}

const hasActivity = (figures: ClientFigures) =>
  (figures.latestAssessment?.progress.total ?? 0) > 0 ||
  figures.openFindings.gap + figures.openFindings.potentialGap > 0 ||
  Object.values(figures.openRisksByBand).some((n) => n > 0) ||
  figures.actions.open + figures.actions.closed > 0 ||
  figures.evidenceAwaitingReview > 0

/** A department (or "Not assigned", with no id) and its figures. */
type DepartmentFigures = ClientFigures & {
  id: string | null
  code: string
  name: string
  active: boolean
  headName: string | null
  fullCode: string
}

/**
 * The client's figures department by department (latest assessment, open findings and risks,
 * actions, evidence). Questions and records with no department appear as "Not assigned"; the
 * rows add up to the client's figures.
 */
export const departmentBreakdown = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const bands = await listBands(ctx.db)
  return inClient(ctx, clientId, async (tx) => {
    const [client] = await tx
      .select({ code: tenant.code })
      .from(tenant)
      .where(eq(tenant.id, clientId))
    if (!client) throw new NotFoundError('Client')
    const departments = await tx
      .select({
        id: department.id,
        code: department.code,
        name: department.name,
        active: department.active,
        headName: department.headName,
      })
      .from(department)
      .where(eq(department.tenantId, clientId))
      .orderBy(asc(department.code))
    const figures = await figuresFor(
      tx,
      {
        clientIds: [clientId],
        keys: [...departments.map((row) => row.id), NO_DEPARTMENT],
        by: 'department',
      },
      bands,
    )
    const figuresOf = (key: string) => {
      const found = figures.get(key)
      if (!found) throw new Error(`No figures for department ${key}`)
      return found
    }
    const rows: DepartmentFigures[] = departments
      .map((row) => ({
        ...row,
        fullCode: departmentCode(client.code, row.code),
        ...figuresOf(row.id),
      }))
      .filter((row) => row.active || hasActivity(row))
    const unassigned = figuresOf(NO_DEPARTMENT)
    if (hasActivity(unassigned)) {
      rows.push({
        id: null,
        code: '',
        name: 'Not assigned',
        active: true,
        headName: null,
        fullCode: '',
        ...unassigned,
      })
    }
    return { bands, rows }
  })
}
export type DepartmentBreakdown = Awaited<ReturnType<typeof departmentBreakdown>>
export type DepartmentFigureRow = DepartmentBreakdown['rows'][number]

/**
 * One department's dashboard: its share of the latest assessment, its open findings and
 * risks, its remediation actions and its evidence.
 */
export const departmentDashboard = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const bands = await listBands(ctx.db)
  const view = await inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({ department, clientCode: tenant.code, clientName: tenant.name })
      .from(department)
      .innerJoin(tenant, eq(tenant.id, department.tenantId))
      .where(and(eq(department.tenantId, clientId), eq(department.code, code.toUpperCase())))
    if (!row) throw new NotFoundError(`Department ${code}`)
    const found = row.department
    const figures = (
      await figuresFor(tx, { clientIds: [clientId], keys: [found.id], by: 'department' }, bands)
    ).get(found.id)
    if (!figures) throw new Error('No figures for this department.')
    return {
      department: { ...found, fullCode: departmentCode(row.clientCode, found.code) },
      client: { id: clientId, code: row.clientCode, name: row.clientName },
      figures,
      heatmap: await riskGrid(tx, [clientId], found.id),
      domainTitles: await publishedDomains(tx),
    }
  })
  const [findings, actions, files] = await Promise.all([
    listFindings(ctx, clientId, { status: 'open', departmentId: view.department.id }),
    listActions(ctx, clientId, { departmentId: view.department.id }),
    listEvidence(ctx, clientId, { departmentId: view.department.id }),
  ])
  return {
    ...view,
    bands,
    findings: findings.map((row) => ({
      ...row,
      band: row.riskScore === null ? null : ratingFor(row.riskScore, bands),
    })),
    actions,
    evidence: files,
  }
}
export type DepartmentDashboard = Awaited<ReturnType<typeof departmentDashboard>>

/**
 * Where a user lands after signing in: client users with one organisation go straight to it;
 * everyone else sees the portfolio (or the list of their organisations).
 */
export const homeFor = (principal: Principal, clientCodes: readonly string[]): string | null => {
  const firmUser = principal.assignments.some((assignment) => isFirmRole(assignment.role))
  if (firmUser) return null
  return clientCodes.length === 1 ? `/clients/${clientCodes[0] ?? ''}` : null
}
