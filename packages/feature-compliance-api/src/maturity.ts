import { authorize, can } from '@duatf/core-access'
import {
  and,
  asc,
  assessment,
  assessmentItem,
  clientMaturityTarget,
  desc,
  domain,
  eq,
  obligation,
  question,
  type ComplianceState,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { publishedRelease } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import { NotFoundError, parseInput, ValidationError } from './errors'
import { maturityOf } from './responses'

// Maturity by domain against a target (ADR-0009). A domain's level is the mean of its maturity
// answers (0 to 4). A domain with only Yes, Partial and No questions uses the lowest level each
// outcome stands for: 3, 2 and 0. Gaps to target are ranked by their size and by the highest
// penalty item of the domain's obligations.

export const MATURITY_MAX = 4
/** Level 3 (Defined) is the lowest level the question bank counts as compliant. */
export const DEFAULT_TARGET = 3
export const MATURITY_LEVELS = ['Not in place', 'Initial', 'Developing', 'Defined', 'Managed']

/** The level a scored outcome stands for where a domain has no maturity question. */
export const EQUIVALENT_LEVEL: Partial<Record<ComplianceState, number>> = {
  compliant: 3,
  potential_gap: 2,
  gap: 0,
}

export type MaturityAnswer = {
  /** The level chosen on a maturity question; null for other kinds of question. */
  level: number | null
  state: ComplianceState
}

const mean = (values: readonly number[]) =>
  Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10

/**
 * The level a domain has reached, from its answers: the mean of its maturity answers, or, with
 * none, of the equivalents of its Yes, Partial and No answers. Null when nothing is scored yet.
 */
export const domainLevel = (
  answers: readonly MaturityAnswer[],
): { level: number; basis: 'maturity' | 'equivalent'; answers: number } | null => {
  const rated = answers.filter((answer) => EQUIVALENT_LEVEL[answer.state] !== undefined)
  const chosen = rated.flatMap((answer) => (answer.level === null ? [] : [answer.level]))
  if (chosen.length) return { level: mean(chosen), basis: 'maturity', answers: chosen.length }
  const equivalents = rated.flatMap((answer) => {
    const level = EQUIVALENT_LEVEL[answer.state]
    return level === undefined ? [] : [level]
  })
  return equivalents.length
    ? { level: mean(equivalents), basis: 'equivalent', answers: equivalents.length }
    : null
}

/** The Schedule maximum a penalty text names, in crore of rupees, or null when it names none. */
export const penaltyCrore = (text: string | null): number | null => {
  const match = /Rs\.?\s*([\d,.]+)\s*crore/i.exec(text ?? '')
  return match ? Number((match[1] ?? '').replace(/,/g, '')) : null
}

/** How much a penalty item weighs in the ranking: its maximum over Rs 50 crore, at least 1. */
export const penaltyWeight = (text: string | null): number =>
  Math.max(1, (penaltyCrore(text) ?? 50) / 50)

export type MaturityRow = {
  domainCode: string
  title: string
  level: number | null
  basis: 'maturity' | 'equivalent' | null
  answers: number
  previousLevel: number | null
  target: number
  gap: number
  penaltyTier: string | null
  penaltyText: string | null
  weight: number
  /** Gap times weight: what to close first. */
  priority: number
}

/** Domains with a gap to target, the largest weighted gap first. */
export const rankGaps = (rows: readonly MaturityRow[]): MaturityRow[] =>
  rows
    .filter((row) => row.gap > 0)
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        b.gap - a.gap ||
        b.weight - a.weight ||
        a.domainCode.localeCompare(b.domainCode),
    )

/** Builds a row; the gap is never negative and is 0 until the domain has a level. */
export const maturityRow = (
  input: Omit<MaturityRow, 'gap' | 'weight' | 'priority'>,
): MaturityRow => {
  const gap =
    input.level === null ? 0 : Math.max(0, Math.round((input.target - input.level) * 10) / 10)
  const weight = penaltyWeight(input.penaltyText)
  return { ...input, gap, weight, priority: Math.round(gap * weight * 10) / 10 }
}

const answersByDomain = async (tx: Transaction, cycle: { id: string; releaseId: string }) => {
  const rows = await tx
    .select({
      domainCode: assessmentItem.domainCode,
      state: assessmentItem.complianceState,
      response: assessmentItem.response,
      answerType: question.answerType,
    })
    .from(assessmentItem)
    .innerJoin(
      question,
      and(eq(question.releaseId, cycle.releaseId), eq(question.code, assessmentItem.questionCode)),
    )
    .where(eq(assessmentItem.assessmentId, cycle.id))
  const grouped = new Map<string, MaturityAnswer[]>()
  for (const row of rows) {
    const list = grouped.get(row.domainCode) ?? []
    list.push({
      level: maturityOf(row, row.response),
      state: row.state,
    })
    grouped.set(row.domainCode, list)
  }
  return grouped
}

/** The client's maturity by domain in a cycle (the latest unless one is named), against its targets. */
export const maturityProfile = async (
  ctx: ServiceContext,
  clientId: string,
  assessmentCode?: string,
) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const cycles = await tx
      .select({
        id: assessment.id,
        code: assessment.code,
        title: assessment.title,
        status: assessment.status,
        releaseId: assessment.releaseId,
        previousAssessmentId: assessment.previousAssessmentId,
      })
      .from(assessment)
      .where(eq(assessment.tenantId, clientId))
      .orderBy(desc(assessment.createdAt))
    const cycle = assessmentCode
      ? cycles.find((row) => row.code === assessmentCode.toUpperCase())
      : cycles[0]
    if (assessmentCode && !cycle) throw new NotFoundError(`Assessment ${assessmentCode}`)
    const previous = cycle?.previousAssessmentId
      ? (cycles.find((row) => row.id === cycle.previousAssessmentId) ?? null)
      : null
    const releaseId = cycle?.releaseId ?? (await publishedRelease(tx)).id
    const [domains, obligations, targets, current, earlier] = await Promise.all([
      tx
        .select({ code: domain.code, title: domain.title })
        .from(domain)
        .where(eq(domain.releaseId, releaseId))
        .orderBy(asc(domain.code)),
      tx
        .select({
          domainCode: obligation.domainCode,
          tier: obligation.penaltyTier,
          text: obligation.penaltyText,
        })
        .from(obligation)
        .where(eq(obligation.releaseId, releaseId)),
      tx
        .select({
          domainCode: clientMaturityTarget.domainCode,
          target: clientMaturityTarget.target,
        })
        .from(clientMaturityTarget)
        .where(eq(clientMaturityTarget.tenantId, clientId)),
      cycle ? answersByDomain(tx, cycle) : Promise.resolve(new Map<string, MaturityAnswer[]>()),
      previous
        ? answersByDomain(tx, previous)
        : Promise.resolve(new Map<string, MaturityAnswer[]>()),
    ])
    const rows = domains.map((row) => {
      const reached = domainLevel(current.get(row.code) ?? [])
      // The heaviest penalty item among the domain's obligations.
      const penalty = obligations
        .filter((item) => item.domainCode === row.code && item.tier)
        .sort((a, b) => penaltyWeight(b.text) - penaltyWeight(a.text))[0]
      return maturityRow({
        domainCode: row.code,
        title: row.title,
        level: reached?.level ?? null,
        basis: reached?.basis ?? null,
        answers: reached?.answers ?? 0,
        previousLevel: domainLevel(earlier.get(row.code) ?? [])?.level ?? null,
        target: targets.find((item) => item.domainCode === row.code)?.target ?? DEFAULT_TARGET,
        penaltyTier: penalty?.tier ?? null,
        penaltyText: penalty?.text ?? null,
      })
    })
    const assessed = rows.filter((row) => row.level !== null)
    return {
      assessment: cycle ? { code: cycle.code, title: cycle.title, status: cycle.status } : null,
      previous: previous ? { code: previous.code, title: previous.title } : null,
      rows,
      /** Domains with at least one scored answer: the ones a chart can show. */
      assessed,
      ranked: rankGaps(rows),
      overall: assessed.length
        ? {
            level: mean(assessed.map((row) => row.level ?? 0)),
            target: mean(assessed.map((row) => row.target)),
          }
        : null,
      canEdit: can(ctx.principal, 'assessment.review', { clientId }),
    }
  })
}
export type MaturityProfile = Awaited<ReturnType<typeof maturityProfile>>

/** Sets the client's target level for domains; a domain left out keeps its target. */
export const setMaturityTargets = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'assessment.review', { clientId })
  const input = parseInput(
    z.object({
      targets: z.record(
        z.string(),
        z.coerce
          .number({ error: 'Choose a level from 0 to 4.' })
          .int('Choose a level from 0 to 4.')
          .min(0, 'Choose a level from 0 to 4.')
          .max(MATURITY_MAX, 'Choose a level from 0 to 4.'),
      ),
    }),
    raw,
  )
  await inClient(ctx, clientId, async (tx) => {
    const release = await publishedRelease(tx)
    const known = await tx
      .select({ code: domain.code })
      .from(domain)
      .where(eq(domain.releaseId, release.id))
    const unknown = Object.keys(input.targets).filter(
      (code) => !known.some((row) => row.code === code),
    )
    if (unknown.length) {
      throw new ValidationError({ targets: `Unknown domains: ${unknown.join(', ')}.` })
    }
    for (const [domainCode, target] of Object.entries(input.targets)) {
      await tx
        .insert(clientMaturityTarget)
        .values({ tenantId: clientId, domainCode, target })
        .onConflictDoUpdate({
          target: [clientMaturityTarget.tenantId, clientMaturityTarget.domainCode],
          set: { target, updatedAt: new Date() },
        })
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'maturity.targets',
      entity: 'client',
      entityId: clientId,
      detail: { targets: input.targets },
    })
  })
}

/** Reads the targets of a form: fields target_D01, target_D02 and so on. */
export const targetsFromForm = (values: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([key, value]) => key.startsWith('target_') && value !== '')
      .map(([key, value]) => [key.slice('target_'.length), value]),
  )
