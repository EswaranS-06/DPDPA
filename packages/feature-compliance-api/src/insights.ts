import { authorize } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  and,
  asc,
  assessment,
  assessmentItem,
  department,
  desc,
  dpia,
  eq,
  evidence,
  evidenceLink,
  finding,
  inArray,
  ne,
  obligation,
  processingActivity,
  processingActivityElement,
  question,
  remediationAction,
  type GapType,
  type Transaction,
} from '@duatf/platform-db'
import { publishedRelease } from './assessments'
import { inClient, type ServiceContext } from './context'
import { penaltyCrore } from './maturity'
import { categoryInfo, higherLevel, type Level } from './personalData'
import { nameKey } from './processors'

// Figures behind the visuals (ADR-0009): penalty exposure by Schedule item, evidence and action
// coverage, and the personal data map of the RoPA. All are read from the records each time.

/**
 * Said wherever penalty items are shown: the maximums are ceilings set by the Schedule, the
 * Board decides the amount (s.33), and they are never added up into one figure.
 */
export const PENALTY_NOTE =
  'The Schedule to the DPDP Act sets the most the Board may impose for each kind of breach. The Board decides the amount, having regard to the matters in s.33(2), such as the nature, gravity and duration of the breach and the steps taken to mitigate it. The maximums are ceilings, not predictions, and are not added together.'

type OpenFinding = {
  code: string
  title: string
  gapType: GapType
  questionCode: string
  releaseId: string
}

const openFindings = (tx: Transaction, clientId: string): Promise<OpenFinding[]> =>
  tx
    .select({
      code: finding.code,
      title: finding.title,
      gapType: finding.gapType,
      questionCode: finding.questionCode,
      releaseId: assessment.releaseId,
    })
    .from(finding)
    .innerJoin(assessment, eq(assessment.id, finding.assessmentId))
    .where(and(eq(finding.tenantId, clientId), eq(finding.status, 'open')))
    .orderBy(asc(finding.code))

/**
 * The obligations behind each open finding's question, in the release its cycle uses, and those
 * of any further release named (the published one, so the Schedule items show with no gap open).
 */
const obligationsOf = async (
  tx: Transaction,
  findings: readonly OpenFinding[],
  alsoRelease?: string,
) => {
  const releases = [
    ...new Set([...findings.map((row) => row.releaseId), ...(alsoRelease ? [alsoRelease] : [])]),
  ]
  if (releases.length === 0) return { questions: [], obligations: [] }
  const [questions, obligations] = await Promise.all([
    tx
      .select({
        releaseId: question.releaseId,
        code: question.code,
        obligationCodes: question.obligationCodes,
      })
      .from(question)
      .where(inArray(question.releaseId, releases)),
    tx
      .select({
        releaseId: obligation.releaseId,
        code: obligation.code,
        tier: obligation.penaltyTier,
        text: obligation.penaltyText,
        inForce: obligation.inForce,
      })
      .from(obligation)
      .where(inArray(obligation.releaseId, releases)),
  ])
  return { questions, obligations }
}

export type PenaltyItem = {
  tier: string
  /** The Schedule item as the knowledge base words it. */
  text: string
  /** Its maximum in crore of rupees; null where the item names no such amount. */
  maxCrore: number | null
  findings: { code: string; title: string; gapType: GapType }[]
}

/**
 * Groups open findings under the Schedule items of the obligations their questions test. A
 * finding whose question tests obligations under two items appears under both. Pure.
 */
export const groupByPenalty = (
  findings: readonly OpenFinding[],
  questions: readonly { releaseId: string; code: string; obligationCodes: readonly string[] }[],
  obligations: readonly {
    releaseId: string
    code: string
    tier: string | null
    text: string | null
  }[],
): PenaltyItem[] => {
  const items = new Map<string, PenaltyItem>()
  for (const row of obligations) {
    if (!row.tier || !row.text || items.has(row.tier)) continue
    items.set(row.tier, {
      tier: row.tier,
      text: row.text,
      maxCrore: penaltyCrore(row.text),
      findings: [],
    })
  }
  for (const row of findings) {
    const codes =
      questions.find((item) => item.releaseId === row.releaseId && item.code === row.questionCode)
        ?.obligationCodes ?? []
    const tiers = new Set(
      obligations
        .filter((item) => item.releaseId === row.releaseId && codes.includes(item.code))
        .flatMap((item) => (item.tier ? [item.tier] : [])),
    )
    for (const tier of tiers) {
      items.get(tier)?.findings.push({ code: row.code, title: row.title, gapType: row.gapType })
    }
  }
  return [...items.values()].sort(
    (a, b) => (b.maxCrore ?? -1) - (a.maxCrore ?? -1) || a.tier.localeCompare(b.tier),
  )
}

/** Each Schedule item with the open gaps under it. There is deliberately no total. */
export const penaltyExposure = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const findings = await openFindings(tx, clientId)
    const published = await publishedRelease(tx)
    const { questions, obligations } = await obligationsOf(tx, findings, published.id)
    const items = groupByPenalty(findings, questions, obligations)
    return {
      items,
      exposed: items.filter((item) => item.findings.length > 0),
      openFindings: findings.length,
      note: PENALTY_NOTE,
    }
  })
}
export type PenaltyExposure = Awaited<ReturnType<typeof penaltyExposure>>

/** Open gaps by the date the obligations behind them start to apply, earliest first. */
export const gapsByCommencement = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  const today = isoDate(new Date())
  return inClient(ctx, clientId, async (tx) => {
    const findings = await openFindings(tx, clientId)
    const { questions, obligations } = await obligationsOf(tx, findings)
    const counts = new Map<string, number>()
    for (const row of findings) {
      const codes =
        questions.find((item) => item.releaseId === row.releaseId && item.code === row.questionCode)
          ?.obligationCodes ?? []
      const dates = obligations
        .filter((item) => item.releaseId === row.releaseId && codes.includes(item.code))
        .map((item) => (item.inForce && item.inForce > today ? item.inForce : 'now'))
      if (dates.length === 0) continue
      // A gap counts from the earliest date any of its obligations applies.
      const first = dates.includes('now') ? 'now' : (dates.sort()[0] ?? 'now')
      counts.set(first, (counts.get(first) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([date, gaps]) => ({ date: date === 'now' ? null : date, gaps }))
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  })
}

/** How much of the cycle's scored answers rest on accepted evidence, and of the findings on actions. */
export const coverage = async (ctx: ServiceContext, clientId: string, assessmentCode?: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [cycle] = await tx
      .select({ id: assessment.id, code: assessment.code, title: assessment.title })
      .from(assessment)
      .where(
        and(
          eq(assessment.tenantId, clientId),
          assessmentCode ? eq(assessment.code, assessmentCode.toUpperCase()) : undefined,
        ),
      )
      .orderBy(desc(assessment.createdAt))
      .limit(1)
    const scored = cycle
      ? await tx
          .select({ id: assessmentItem.id })
          .from(assessmentItem)
          .where(
            and(
              eq(assessmentItem.assessmentId, cycle.id),
              inArray(assessmentItem.complianceState, ['compliant', 'potential_gap', 'gap']),
            ),
          )
      : []
    const ids = scored.map((row) => row.id)
    const evidenced = ids.length
      ? await tx
          .selectDistinct({ itemId: evidenceLink.itemId })
          .from(evidenceLink)
          .innerJoin(evidence, eq(evidence.id, evidenceLink.evidenceId))
          .where(
            and(
              eq(evidenceLink.tenantId, clientId),
              inArray(evidenceLink.itemId, ids),
              eq(evidence.status, 'accepted'),
            ),
          )
      : []
    const open = await tx
      .select({ id: finding.id })
      .from(finding)
      .where(and(eq(finding.tenantId, clientId), eq(finding.status, 'open')))
    const openIds = open.map((row) => row.id)
    const planned = openIds.length
      ? await tx
          .selectDistinct({ findingId: remediationAction.findingId })
          .from(remediationAction)
          .where(
            and(
              eq(remediationAction.tenantId, clientId),
              inArray(remediationAction.findingId, openIds),
              ne(remediationAction.status, 'accepted_risk'),
            ),
          )
      : []
    return {
      assessment: cycle ?? null,
      evidence: { covered: evidenced.length, total: ids.length },
      actions: { covered: planned.length, total: openIds.length },
    }
  })
}
export type Coverage = Awaited<ReturnType<typeof coverage>>

export type DataMapCategory = {
  code: string
  title: string
  /** Distinct data elements of the category in the RoPA. */
  elements: number
  /** Activities that handle at least one of them. */
  activities: number
  highestLevel: Level
}

type MapActivity = {
  id: string
  departmentId: string
  processors: readonly string[]
  principals: readonly string[]
  transfersAbroad: string
  elements: { title: string; category: string; level: Level }[]
}

/** Categories and counters of a RoPA. Pure. */
export const summariseDataMap = (activities: readonly MapActivity[]) => {
  const byCategory = new Map<
    string,
    { titles: Set<string>; activities: Set<string>; level: Level }
  >()
  for (const activity of activities) {
    for (const element of activity.elements) {
      const seen = byCategory.get(element.category) ?? {
        titles: new Set<string>(),
        activities: new Set<string>(),
        level: element.level,
      }
      seen.titles.add(element.title)
      seen.activities.add(activity.id)
      seen.level = higherLevel(seen.level, element.level)
      byCategory.set(element.category, seen)
    }
  }
  const categories: DataMapCategory[] = [...byCategory.entries()]
    .map(([code, seen]) => ({
      code,
      title: categoryInfo(code).title,
      elements: seen.titles.size,
      activities: seen.activities.size,
      highestLevel: seen.level,
    }))
    .sort((a, b) => b.elements - a.elements || a.title.localeCompare(b.title))
  const elements = activities.flatMap((activity) => activity.elements)
  return {
    categories,
    counters: {
      activities: activities.length,
      departments: new Set(activities.map((activity) => activity.departmentId)).size,
      elements: new Set(elements.map((element) => element.title)).size,
      restricted: new Set(
        elements.filter((element) => element.level === 'L4').map((element) => element.title),
      ).size,
      processors: new Set(
        activities.flatMap((activity) => activity.processors.map(nameKey)).filter(Boolean),
      ).size,
      transfersAbroad: activities.filter((activity) => activity.transfersAbroad === 'yes').length,
      children: activities.filter((activity) =>
        activity.principals.some((name) => /child|minor|student|under 18/i.test(name)),
      ).length,
    },
  }
}

/** The personal data map of the client's RoPA: what kinds of data, how much and how sensitive. */
export const personalDataMap = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const activities = await tx
      .select({
        id: processingActivity.id,
        departmentId: processingActivity.departmentId,
        processors: processingActivity.processors,
        principals: processingActivity.principals,
        transfersAbroad: processingActivity.transfersAbroad,
      })
      .from(processingActivity)
      .innerJoin(department, eq(department.id, processingActivity.departmentId))
      .where(eq(processingActivity.tenantId, clientId))
    const ids = activities.map((row) => row.id)
    const elements = ids.length
      ? await tx
          .select({
            activityId: processingActivityElement.activityId,
            title: processingActivityElement.title,
            category: processingActivityElement.category,
            level: processingActivityElement.level,
          })
          .from(processingActivityElement)
          .where(inArray(processingActivityElement.activityId, ids))
      : []
    const dpias = await tx
      .select({ status: dpia.status })
      .from(dpia)
      .where(eq(dpia.tenantId, clientId))
    const summary = summariseDataMap(
      activities.map((row) => ({
        ...row,
        elements: elements
          .filter((element) => element.activityId === row.id)
          .map((element) => ({
            title: element.title,
            category: element.category,
            level: element.level as Level,
          })),
      })),
    )
    return {
      ...summary,
      counters: {
        ...summary.counters,
        dpiasCompleted: dpias.filter((row) => row.status === 'completed').length,
      },
    }
  })
}
export type PersonalDataMap = Awaited<ReturnType<typeof personalDataMap>>
