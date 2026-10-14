import { authorize, can } from '@duatf/core-access'
import { addCalendarDays, isoDate } from '@duatf/core-utils'
import {
  and,
  asc,
  department,
  dpia,
  dpiaRisk,
  DPIA_OUTCOMES,
  eq,
  inArray,
  processingActivity,
  processingActivityElement,
  type DpiaOutcome,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
import {
  NotFoundError,
  optionalDate,
  optionalText,
  parseInput,
  requiredText,
  RuleError,
  ValidationError,
} from './errors'
import { higherLevel, type Level } from './personalData'
import { blankToUndefined, nextRegisterCode } from './registerCodes'
import { listBands, ratingFor } from './risks'
import { refLabel } from './ropa'

// DPIA records (ADR-0009). A Significant Data Fiduciary must carry out a Data Protection Impact
// Assessment every 12 months (s.10(2)(c)(i), R13(1)); others use the same shape voluntarily. The
// Act says what it comprises: the rights of the Data Principals, the purpose of processing, and
// the assessment and management of the risk to those rights. One DPIA per RoPA activity.

export const DPIA_OUTCOME_LABEL: Record<DpiaOutcome, string> = {
  proceed: 'Proceed as described',
  proceed_with_measures: 'Proceed once the measures are in place',
  do_not_proceed: 'Do not proceed',
}

/** A completed DPIA is reviewed after this many days unless another date is set (R13(1): 12 months). */
export const DPIA_REVIEW_DAYS = 365

type SuggestInput = {
  principals: readonly string[]
  transfersAbroad: string
  highestLevel: Level | null
}

/**
 * Why an activity should have a DPIA: it handles the most sensitive data, children's data or
 * data of persons with disability, or sends data outside India. No reason, no suggestion.
 */
export const dpiaReasons = (activity: SuggestInput): string[] => {
  const reasons: string[] = []
  if (activity.highestLevel === 'L4') reasons.push('Handles the most sensitive personal data (L4)')
  if (activity.principals.some((name) => /child|minor|student|under 18/i.test(name))) {
    reasons.push('Processes children’s personal data (s.9)')
  }
  if (activity.principals.some((name) => /disab/i.test(name))) {
    reasons.push('Processes personal data of persons with disability (s.9)')
  }
  if (activity.transfersAbroad === 'yes') reasons.push('Sends personal data outside India (s.16)')
  return reasons
}

const scale = z.coerce
  .number({ error: 'Choose 1 to 5.' })
  .int('Choose 1 to 5.')
  .min(1, 'Choose 1 to 5.')
  .max(5, 'Choose 1 to 5.')

const riskSchema = z
  .object({
    risk: requiredText('Risk', 1000),
    likelihood: scale,
    impact: scale,
    measures: optionalText(2000),
    residualLikelihood: scale,
    residualImpact: scale,
  })
  .refine(
    (value) => value.residualLikelihood * value.residualImpact <= value.likelihood * value.impact,
    {
      path: ['residualLikelihood'],
      message: 'The risk after the measures cannot be higher than before them.',
    },
  )

const dpiaSchema = z.object({
  description: optionalText(4000),
  purpose: optionalText(4000),
  rightsAffected: optionalText(4000),
  necessity: optionalText(4000),
  consulted: optionalText(1000),
  outcome: z.preprocess(blankToUndefined, z.enum(DPIA_OUTCOMES).optional()),
  outcomeNote: optionalText(2000),
  preparedBy: optionalText(160),
  completedOn: optionalDate(),
  nextReviewOn: optionalDate(),
  risks: z.array(riskSchema).max(40).default([]),
})

type ActivityFacts = {
  id: string
  ref: number
  name: string
  purpose: string | null
  departmentName: string
  principals: string[]
  systems: string[]
  processors: string[]
  transfersAbroad: string
  highestLevel: Level | null
  elements: string[]
}

const activityFacts = async (tx: Transaction, clientId: string): Promise<ActivityFacts[]> => {
  const activities = await tx
    .select({
      id: processingActivity.id,
      ref: processingActivity.ref,
      name: processingActivity.name,
      purpose: processingActivity.purpose,
      departmentName: department.name,
      principals: processingActivity.principals,
      systems: processingActivity.systems,
      processors: processingActivity.processors,
      transfersAbroad: processingActivity.transfersAbroad,
    })
    .from(processingActivity)
    .innerJoin(department, eq(department.id, processingActivity.departmentId))
    .where(eq(processingActivity.tenantId, clientId))
    .orderBy(asc(processingActivity.ref))
  const ids = activities.map((row) => row.id)
  const elements = ids.length
    ? await tx
        .select({
          activityId: processingActivityElement.activityId,
          title: processingActivityElement.title,
          level: processingActivityElement.level,
        })
        .from(processingActivityElement)
        .where(inArray(processingActivityElement.activityId, ids))
        .orderBy(asc(processingActivityElement.seq))
    : []
  return activities.map((row) => {
    const own = elements.filter((element) => element.activityId === row.id)
    return {
      ...row,
      elements: own.map((element) => element.title),
      highestLevel: own.reduce<Level | null>(
        (highest, element) =>
          highest ? higherLevel(highest, element.level as Level) : (element.level as Level),
        null,
      ),
    }
  })
}

/** What a new DPIA starts with, taken from the activity's RoPA answers. */
export const dpiaStart = (activity: ActivityFacts) => ({
  description: [
    `${activity.name} (${refLabel(activity.ref)}), ${activity.departmentName}.`,
    activity.principals.length ? `Data Principals: ${activity.principals.join(', ')}.` : null,
    activity.elements.length ? `Personal data: ${activity.elements.join(', ')}.` : null,
    activity.systems.length ? `Systems: ${activity.systems.join(', ')}.` : null,
    activity.processors.length ? `Processors: ${activity.processors.join(', ')}.` : null,
    activity.transfersAbroad === 'yes' ? 'Personal data is sent outside India.' : null,
  ]
    .filter(Boolean)
    .join(' '),
  purpose: activity.purpose,
})

/** Every RoPA activity with its DPIA, if it has one, and why it should have one. */
export const listDpias = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const today = isoDate(new Date())
  return inClient(ctx, clientId, async (tx) => {
    const [activities, records] = await Promise.all([
      activityFacts(tx, clientId),
      tx.select().from(dpia).where(eq(dpia.tenantId, clientId)).orderBy(asc(dpia.code)),
    ])
    return {
      canEdit: can(ctx.principal, 'register.manage', { clientId }),
      activities: activities.map((activity) => {
        const record = records.find((row) => row.activityId === activity.id) ?? null
        return {
          ref: activity.ref,
          refLabel: refLabel(activity.ref),
          name: activity.name,
          departmentName: activity.departmentName,
          highestLevel: activity.highestLevel,
          reasons: dpiaReasons(activity),
          dpia: record
            ? {
                code: record.code,
                status: record.status,
                outcome: record.outcome,
                completedOn: record.completedOn,
                nextReviewOn: record.nextReviewOn,
                reviewDue:
                  record.status === 'completed' &&
                  record.nextReviewOn !== null &&
                  record.nextReviewOn <= today,
              }
            : null,
        }
      }),
    }
  })
}
export type DpiaList = Awaited<ReturnType<typeof listDpias>>
export type DpiaListRow = DpiaList['activities'][number]

/** Starts the DPIA of an activity from its RoPA answers. An activity has one DPIA. */
export const startDpia = async (
  ctx: ServiceContext,
  clientId: string,
  activityRef: number,
): Promise<{ id: string; code: string }> => {
  authorize(ctx.principal, 'register.manage', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const activity = (await activityFacts(tx, clientId)).find((row) => row.ref === activityRef)
    if (!activity) throw new NotFoundError(`Activity ${refLabel(activityRef)}`)
    const [existing] = await tx
      .select({ code: dpia.code })
      .from(dpia)
      .where(eq(dpia.activityId, activity.id))
    if (existing) {
      throw new RuleError(`${refLabel(activityRef)} already has a DPIA, ${existing.code}.`)
    }
    const code = await nextRegisterCode(tx, clientId, 'DPIA')
    const [created] = await tx
      .insert(dpia)
      .values({
        ...dpiaStart(activity),
        tenantId: clientId,
        code,
        activityId: activity.id,
        createdBy: ctx.principal.userId,
        updatedBy: ctx.principal.userId,
      })
      .returning({ id: dpia.id })
    if (!created) throw new Error('The DPIA could not be started.')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'dpia.start',
      entity: 'dpia',
      entityId: code,
      detail: { activity: refLabel(activityRef) },
    })
    return { id: created.id, code }
  })
}

/** One DPIA with its activity, its risks rated in the firm's bands and why it was suggested. */
export const getDpia = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const bands = await listBands(ctx.db)
  const today = isoDate(new Date())
  return inClient(ctx, clientId, async (tx) => {
    const [record] = await tx
      .select()
      .from(dpia)
      .where(and(eq(dpia.tenantId, clientId), eq(dpia.code, code.toUpperCase())))
    if (!record) throw new NotFoundError(`DPIA ${code}`)
    const activity = (await activityFacts(tx, clientId)).find((row) => row.id === record.activityId)
    if (!activity) throw new NotFoundError('Activity')
    const risks = await tx
      .select()
      .from(dpiaRisk)
      .where(eq(dpiaRisk.dpiaId, record.id))
      .orderBy(asc(dpiaRisk.seq))
    return {
      ...record,
      activity: { ...activity, refLabel: refLabel(activity.ref) },
      reasons: dpiaReasons(activity),
      bands,
      risks: risks.map((row) => {
        const score = row.likelihood * row.impact
        const residualScore = row.residualLikelihood * row.residualImpact
        return {
          ...row,
          score,
          band: ratingFor(score, bands),
          residualScore,
          residualBand: ratingFor(residualScore, bands),
        }
      }),
      reviewDue:
        record.status === 'completed' &&
        record.nextReviewOn !== null &&
        record.nextReviewOn <= today,
      canEdit: can(ctx.principal, 'register.manage', { clientId }),
    }
  })
}
export type DpiaDetail = Awaited<ReturnType<typeof getDpia>>

const loadDpia = async (tx: Transaction, clientId: string, dpiaId: string) => {
  const [row] = await tx
    .select()
    .from(dpia)
    .where(and(eq(dpia.id, dpiaId), eq(dpia.tenantId, clientId)))
  if (!row) throw new NotFoundError('DPIA')
  return row
}

/**
 * Saves a DPIA. With `complete` it must be whole: the rights affected, the purpose, at least one
 * rated risk and an outcome. Its review falls due 12 months later unless another date is given.
 */
export const saveDpia = async (
  ctx: ServiceContext,
  clientId: string,
  dpiaId: string,
  raw: unknown,
  options: { complete?: boolean } = {},
): Promise<void> => {
  authorize(ctx.principal, 'register.manage', { clientId })
  const input = parseInput(dpiaSchema, raw)
  const today = isoDate(new Date())
  if (options.complete) {
    const missing: Record<string, string> = {}
    if (!input.rightsAffected)
      missing.rightsAffected = 'Describe the rights of the Data Principals.'
    if (!input.purpose) missing.purpose = 'State the purpose of the processing.'
    if (!input.outcome) missing.outcome = 'Choose the outcome.'
    if (input.risks.length === 0) missing.risks = 'Add at least one risk to the Data Principals.'
    if (Object.keys(missing).length) throw new ValidationError(missing)
  }
  const completedOn = options.complete ? (input.completedOn ?? today) : null
  if (completedOn && completedOn > today) {
    throw new ValidationError({ completedOn: 'This date is in the future.' })
  }
  const nextReviewOn = options.complete
    ? (input.nextReviewOn ?? addCalendarDays(completedOn ?? today, DPIA_REVIEW_DAYS))
    : (input.nextReviewOn ?? null)
  if (completedOn && nextReviewOn && nextReviewOn <= completedOn) {
    throw new ValidationError({ nextReviewOn: 'The review is after the completion date.' })
  }
  await inClient(ctx, clientId, async (tx) => {
    const current = await loadDpia(tx, clientId, dpiaId)
    await tx
      .update(dpia)
      .set({
        description: input.description ?? null,
        purpose: input.purpose ?? null,
        rightsAffected: input.rightsAffected ?? null,
        necessity: input.necessity ?? null,
        consulted: input.consulted ?? null,
        outcome: input.outcome ?? null,
        outcomeNote: input.outcomeNote ?? null,
        preparedBy: input.preparedBy ?? null,
        status: options.complete ? 'completed' : 'draft',
        completedOn,
        nextReviewOn,
        updatedBy: ctx.principal.userId,
        updatedAt: new Date(),
      })
      .where(eq(dpia.id, dpiaId))
    await tx.delete(dpiaRisk).where(eq(dpiaRisk.dpiaId, dpiaId))
    if (input.risks.length) {
      await tx.insert(dpiaRisk).values(
        input.risks.map((row, seq) => ({
          tenantId: clientId,
          dpiaId,
          seq,
          risk: row.risk,
          likelihood: row.likelihood,
          impact: row.impact,
          measures: row.measures ?? null,
          residualLikelihood: row.residualLikelihood,
          residualImpact: row.residualImpact,
        })),
      )
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: options.complete ? 'dpia.complete' : 'dpia.save',
      entity: 'dpia',
      entityId: current.code,
      detail: { risks: input.risks.length, outcome: input.outcome ?? null, nextReviewOn },
    })
  })
}

export const removeDpia = async (
  ctx: ServiceContext,
  clientId: string,
  dpiaId: string,
): Promise<void> => {
  authorize(ctx.principal, 'register.manage', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const [removed] = await tx
      .delete(dpia)
      .where(and(eq(dpia.id, dpiaId), eq(dpia.tenantId, clientId)))
      .returning({ code: dpia.code })
    if (!removed) throw new NotFoundError('DPIA')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'dpia.remove',
      entity: 'dpia',
      entityId: removed.code,
    })
  })
}

/** Reads the risks of a DPIA form: fields risk_0, likelihood_0 and so on; rows with no risk text are skipped. */
export const risksFromForm = (values: Record<string, string>): Record<string, string>[] => {
  const rows: Record<string, string>[] = []
  for (let index = 0; index < 40; index += 1) {
    const risk = values[`risk_${index}`]?.trim()
    if (!risk) continue
    rows.push({
      risk,
      likelihood: values[`likelihood_${index}`] ?? '',
      impact: values[`impact_${index}`] ?? '',
      measures: values[`measures_${index}`] ?? '',
      residualLikelihood: values[`residualLikelihood_${index}`] ?? '',
      residualImpact: values[`residualImpact_${index}`] ?? '',
    })
  }
  return rows
}
