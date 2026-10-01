import { can, type Capability, type Principal } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  assessment,
  assessmentItem,
  count,
  eq,
  evidence,
  finding,
  inArray,
  isNull,
  lt,
  min,
  ne,
  notExists,
  notInArray,
  or,
  remediationAction,
  risk,
  sql,
  type ActionStatus,
  type AnyColumn,
  type AssessmentStatus,
  type SQL,
  type Transaction,
} from '@duatf/platform-db'
import { listClients } from './clients'
import { inUserScope, type ServiceContext } from './context'
import { listBands } from './risks'

/**
 * The work a user can act on now, most urgent first. Each kind is offered only to people who
 * hold the capability to do it, and department owners see only their own departments.
 */
export const ATTENTION_KINDS = [
  'overdue_actions',
  'returned_answers',
  'answers_to_review',
  'evidence_to_review',
  'actions_to_verify',
  'serious_risks',
  'findings_without_actions',
  'unanswered',
  'my_actions',
] as const
export type AttentionKind = (typeof ATTENTION_KINDS)[number]

export type AttentionItem = {
  kind: AttentionKind
  clientId: string
  clientCode: string
  clientName: string
  count: number
  /** The assessment the items belong to, for answer and review work. */
  assessmentCode: string | null
  /** The earliest due date among the items, when they have one. */
  earliestDue: string | null
}

/** Actions that still need work from their owner; remediated ones wait on the auditor. */
const WORKABLE_ACTIONS: ActionStatus[] = [
  'open',
  'assigned',
  'in_progress',
  'pending_evidence',
  'rejected',
]
const UNFINISHED_ACTIONS: ActionStatus[] = ['closed', 'accepted_risk', 'remediated']
const AWAITING_VERIFICATION: ActionStatus[] = ['under_review', 'remediated']

type Reach = 'all' | string[] | null

/**
 * Where in a client the user may use a department-scoped capability: everywhere ("all"), in
 * some departments, or nowhere (null).
 */
export const reachOf = (principal: Principal, capability: Capability, clientId: string): Reach => {
  if (!can(principal, capability, { clientId })) {
    const departments = principal.assignments
      .filter((assignment) => assignment.clientId === clientId && assignment.departmentId)
      .map((assignment) => assignment.departmentId ?? '')
      .filter((departmentId) => can(principal, capability, { clientId, departmentId }))
    return departments.length ? departments : null
  }
  return 'all'
}

const inReach = (column: AnyColumn, reach: Reach): SQL | undefined =>
  reach === 'all' || reach === null ? undefined : inArray(column, reach)

const OPEN_CYCLES: AssessmentStatus[] = ['in_progress', 'in_review']

/** What needs the user's attention across the clients they can see (or the ones given). */
export const attentionFor = async (
  ctx: ServiceContext,
  onlyClientIds?: readonly string[],
): Promise<AttentionItem[]> => {
  const { principal } = ctx
  const clients = (await listClients(ctx)).filter(
    (client) => !onlyClientIds || onlyClientIds.includes(client.id),
  )
  if (!clients.length) return []
  const bands = await listBands(ctx.db)
  const serious = bands.filter((band) => band.tone === 'severe')
  const today = isoDate(new Date())
  const items: AttentionItem[] = []

  await inUserScope(ctx, async (tx) => {
    for (const client of clients) {
      const add = (
        kind: AttentionKind,
        rows: { n: number; due?: string | null; assessmentCode?: string | null }[],
      ) => {
        for (const row of rows) {
          if (row.n > 0) {
            items.push({
              kind,
              clientId: client.id,
              clientCode: client.code,
              clientName: client.name,
              count: row.n,
              assessmentCode: row.assessmentCode ?? null,
              earliestDue: row.due ?? null,
            })
          }
        }
      }
      const update = reachOf(principal, 'action.update', client.id)
      if (update) {
        add('overdue_actions', await overdueActions(tx, client.id, update, principal.userId, today))
      }
      const answer = reachOf(principal, 'assessment.answer', client.id)
      if (answer) {
        add('returned_answers', await itemsByCycle(tx, client.id, answer, 'returned'))
      }
      if (can(principal, 'assessment.review', { clientId: client.id })) {
        add('answers_to_review', await itemsByCycle(tx, client.id, 'all', 'to_review'))
      }
      if (can(principal, 'evidence.review', { clientId: client.id })) {
        add('evidence_to_review', [await evidenceToReview(tx, client.id)])
      }
      if (can(principal, 'action.verify', { clientId: client.id })) {
        add('actions_to_verify', [await actionsToVerify(tx, client.id, principal.userId)])
      }
      if (can(principal, 'risk.accept', { clientId: client.id }) && serious.length) {
        const scores = serious.map((band) => [band.minScore, band.maxScore] as const)
        add('serious_risks', [await seriousRisks(tx, client.id, scores)])
      }
      if (can(principal, 'action.manage', { clientId: client.id })) {
        add('findings_without_actions', [await findingsWithoutActions(tx, client.id)])
      }
      if (answer) {
        add('unanswered', await itemsByCycle(tx, client.id, answer, 'unanswered'))
      }
      add('my_actions', [await myActions(tx, client.id, principal.userId)])
    }
  })

  const order = new Map(ATTENTION_KINDS.map((kind, index) => [kind, index]))
  return items.sort(
    (a, b) =>
      (order.get(a.kind) ?? 0) - (order.get(b.kind) ?? 0) ||
      a.clientName.localeCompare(b.clientName),
  )
}

const overdueActions = async (
  tx: Transaction,
  clientId: string,
  reach: Reach,
  userId: string,
  today: string,
) => {
  const departments = inReach(remediationAction.departmentId, reach)
  const [row] = await tx
    .select({ n: count(), due: min(remediationAction.dueDate) })
    .from(remediationAction)
    .where(
      and(
        eq(remediationAction.tenantId, clientId),
        notInArray(remediationAction.status, UNFINISHED_ACTIONS),
        lt(remediationAction.dueDate, today),
        departments ? or(departments, eq(remediationAction.ownerUserId, userId)) : undefined,
      ),
    )
  return [{ n: row?.n ?? 0, due: row?.due ?? null }]
}

/** Answer work in open assessments, per assessment. */
const itemsByCycle = (
  tx: Transaction,
  clientId: string,
  reach: Reach,
  which: 'returned' | 'to_review' | 'unanswered',
) => {
  const condition =
    which === 'returned'
      ? eq(assessmentItem.reviewState, 'returned')
      : which === 'to_review'
        ? and(
            ne(assessmentItem.answer, 'not_assessed'),
            eq(assessmentItem.reviewState, 'not_reviewed'),
          )
        : eq(assessmentItem.answer, 'not_assessed')
  return tx
    .select({
      n: count(),
      due: min(assessment.dueDate),
      assessmentCode: assessment.code,
    })
    .from(assessmentItem)
    .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
    .where(
      and(
        eq(assessmentItem.tenantId, clientId),
        which === 'unanswered'
          ? eq(assessment.status, 'in_progress')
          : inArray(assessment.status, OPEN_CYCLES),
        condition,
        inReach(assessmentItem.departmentId, reach),
      ),
    )
    .groupBy(assessment.code, assessment.createdAt)
    .orderBy(sql`${assessment.createdAt} desc`)
}

const evidenceToReview = async (tx: Transaction, clientId: string) => {
  const [row] = await tx
    .select({ n: count() })
    .from(evidence)
    .where(and(eq(evidence.tenantId, clientId), eq(evidence.status, 'pending_review')))
  return { n: row?.n ?? 0 }
}

/** Actions waiting for an auditor to verify or close them; the owner cannot do either. */
const actionsToVerify = async (tx: Transaction, clientId: string, userId: string) => {
  const [row] = await tx
    .select({ n: count(), due: min(remediationAction.dueDate) })
    .from(remediationAction)
    .where(
      and(
        eq(remediationAction.tenantId, clientId),
        inArray(remediationAction.status, AWAITING_VERIFICATION),
        or(isNull(remediationAction.ownerUserId), ne(remediationAction.ownerUserId, userId)),
      ),
    )
  return { n: row?.n ?? 0, due: row?.due ?? null }
}

const seriousRisks = async (
  tx: Transaction,
  clientId: string,
  scores: (readonly [number, number])[],
) => {
  const [row] = await tx
    .select({ n: count() })
    .from(risk)
    .where(
      and(
        eq(risk.tenantId, clientId),
        eq(risk.status, 'open'),
        or(...scores.map(([low, high]) => sql`${risk.score} between ${low} and ${high}`)),
      ),
    )
  return { n: row?.n ?? 0 }
}

const findingsWithoutActions = async (tx: Transaction, clientId: string) => {
  const [row] = await tx
    .select({ n: count() })
    .from(finding)
    .where(
      and(
        eq(finding.tenantId, clientId),
        eq(finding.status, 'open'),
        notExists(
          tx
            .select({ one: sql`1` })
            .from(remediationAction)
            .where(eq(remediationAction.findingId, finding.id)),
        ),
      ),
    )
  return { n: row?.n ?? 0 }
}

const myActions = async (tx: Transaction, clientId: string, userId: string) => {
  const [row] = await tx
    .select({ n: count(), due: min(remediationAction.dueDate) })
    .from(remediationAction)
    .where(
      and(
        eq(remediationAction.tenantId, clientId),
        eq(remediationAction.ownerUserId, userId),
        inArray(remediationAction.status, WORKABLE_ACTIONS),
      ),
    )
  return { n: row?.n ?? 0, due: row?.due ?? null }
}
