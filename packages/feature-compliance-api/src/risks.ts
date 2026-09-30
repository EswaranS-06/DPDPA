import { authorize } from '@duatf/core-access'
import {
  and,
  appUser,
  asc,
  desc,
  eq,
  finding,
  risk,
  riskBand,
  RISK_TREATMENTS,
  type Executor,
  type RiskStatus,
} from '@duatf/platform-db'
import { z } from 'zod'
import { acceptActionsForFinding } from './actions'
import { audit, inClient, type ServiceContext } from './context'
import { NotFoundError, optionalText, parseInput, RuleError, ValidationError } from './errors'

export type Band = { name: string; minScore: number; maxScore: number; tone: string }

export const BAND_TONES = ['live', 'accent', 'pending', 'severe', 'neutral'] as const

/** The band a score falls in. Bands must cover 1 to 25 without gaps (see validateBands). */
export const ratingFor = (score: number, bands: readonly Band[]): Band => {
  const band = bands.find((item) => score >= item.minScore && score <= item.maxScore)
  if (!band) throw new Error(`No risk band covers score ${score}.`)
  return band
}

/** Bands must run from 1 to 25 in order, each starting one above the previous end. */
export const validateBands = (bands: readonly Band[]): string | null => {
  if (bands.length < 2 || bands.length > 6) return 'Use between two and six bands.'
  const names = new Set(bands.map((band) => band.name.trim().toLowerCase()))
  if (names.size !== bands.length || names.has('')) return 'Each band needs its own name.'
  let expected = 1
  for (const band of bands) {
    if (!Number.isInteger(band.minScore) || !Number.isInteger(band.maxScore)) {
      return 'Scores must be whole numbers.'
    }
    if (band.minScore !== expected) return `The band "${band.name}" should start at ${expected}.`
    if (band.maxScore < band.minScore) return `The band "${band.name}" ends before it starts.`
    if (!(BAND_TONES as readonly string[]).includes(band.tone))
      return 'Choose a colour for each band.'
    expected = band.maxScore + 1
  }
  return expected === 26 ? null : 'The last band must end at 25.'
}

export const listBands = (db: Executor): Promise<Band[]> =>
  db
    .select({
      name: riskBand.name,
      minScore: riskBand.minScore,
      maxScore: riskBand.maxScore,
      tone: riskBand.tone,
    })
    .from(riskBand)
    .orderBy(asc(riskBand.seq))

/** Replaces the firm-wide bands. Firm administrators only. */
export const updateBands = async (ctx: ServiceContext, bands: Band[]): Promise<void> => {
  authorize(ctx.principal, 'platform.admin')
  const problem = validateBands(bands)
  if (problem) throw new ValidationError({ bands: problem })
  await ctx.db.transaction(async (tx) => {
    await tx.delete(riskBand)
    await tx
      .insert(riskBand)
      .values(bands.map((band, seq) => ({ ...band, name: band.name.trim(), seq })))
    await audit(tx, ctx, {
      tenantId: null,
      action: 'risk.bands',
      entity: 'risk_band',
      entityId: 'all',
      detail: { bands: bands.map((band) => `${band.name} ${band.minScore}-${band.maxScore}`) },
    })
  })
}

export type RiskFilters = { status?: RiskStatus; band?: string }

/** The client's risk register with the band of each score, highest score first. */
export const listRisks = async (
  ctx: ServiceContext,
  clientId: string,
  filters: RiskFilters = {},
) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  const bands = await listBands(ctx.db)
  const rows = await inClient(ctx, clientId, (tx) =>
    tx
      .select({
        risk,
        findingCode: finding.code,
        findingStatus: finding.status,
        questionCode: finding.questionCode,
      })
      .from(risk)
      .leftJoin(finding, eq(finding.id, risk.findingId))
      .where(
        and(
          eq(risk.tenantId, clientId),
          filters.status ? eq(risk.status, filters.status) : undefined,
        ),
      )
      .orderBy(desc(risk.score), asc(risk.code)),
  )
  return rows
    .map((row) => ({
      ...row.risk,
      findingCode: row.findingCode,
      findingStatus: row.findingStatus,
      questionCode: row.questionCode,
      band: ratingFor(row.risk.score, bands),
    }))
    .filter((row) => !filters.band || row.band.name === filters.band)
}
export type RiskRow = Awaited<ReturnType<typeof listRisks>>[number]

/** Counts of open (not closed, not accepted) risks for each likelihood and impact. */
export const heatmap = (rows: readonly Pick<RiskRow, 'likelihood' | 'impact' | 'status'>[]) => {
  const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0))
  for (const row of rows) {
    if (row.status !== 'open' && row.status !== 'treated') continue
    const cells = grid[5 - row.likelihood]
    if (cells) cells[row.impact - 1] = (cells[row.impact - 1] ?? 0) + 1
  }
  return grid
}

export const getRisk = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  const bands = await listBands(ctx.db)
  return inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({ risk, findingCode: finding.code, acceptedByName: appUser.displayName })
      .from(risk)
      .leftJoin(finding, eq(finding.id, risk.findingId))
      .leftJoin(appUser, eq(appUser.id, risk.acceptedBy))
      .where(and(eq(risk.tenantId, clientId), eq(risk.code, code.toUpperCase())))
    if (!row) throw new NotFoundError(`Risk ${code}`)
    return {
      ...row.risk,
      findingCode: row.findingCode,
      acceptedByName: row.acceptedByName,
      band: ratingFor(row.risk.score, bands),
    }
  })
}
export type RiskDetail = Awaited<ReturnType<typeof getRisk>>

const scale = z.coerce
  .number({ error: 'Choose 1 to 5.' })
  .int('Choose 1 to 5.')
  .min(1, 'Choose 1 to 5.')
  .max(5, 'Choose 1 to 5.')

const riskUpdateSchema = z.object({
  likelihood: scale,
  impact: scale,
  treatment: z.enum(RISK_TREATMENTS, { error: 'Choose a treatment.' }),
  status: z.enum(['open', 'treated', 'closed'], { error: 'Choose a status.' }),
  ownerName: optionalText(120),
  description: optionalText(2000),
})

/** Rates and treats a risk. Accepting a risk is the client DPO's decision (acceptRisk). */
export const updateRisk = async (
  ctx: ServiceContext,
  clientId: string,
  riskId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'risk.manage', { clientId })
  const input = parseInput(riskUpdateSchema, raw)
  if (input.treatment === 'accept') {
    throw new ValidationError({ treatment: 'Risk acceptance is recorded by the client DPO.' })
  }
  await inClient(ctx, clientId, async (tx) => {
    const [current] = await tx
      .select()
      .from(risk)
      .where(and(eq(risk.id, riskId), eq(risk.tenantId, clientId)))
    if (!current) throw new NotFoundError('Risk')
    if (current.status === 'accepted') {
      throw new RuleError('The client accepted this risk; it cannot be re-rated.')
    }
    await tx
      .update(risk)
      .set({
        likelihood: input.likelihood,
        impact: input.impact,
        treatment: input.treatment,
        status: input.status,
        ownerName: input.ownerName ?? null,
        description: input.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(risk.id, riskId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'risk.update',
      entity: 'risk',
      entityId: current.code,
      detail: {
        from: `${current.likelihood}x${current.impact}`,
        to: `${input.likelihood}x${input.impact}`,
        treatment: input.treatment,
        status: input.status,
      },
    })
  })
}

/** The client DPO accepts a risk, with the reason recorded. */
export const acceptRisk = async (
  ctx: ServiceContext,
  clientId: string,
  riskId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'risk.accept', { clientId })
  const input = parseInput(
    z.object({
      note: z
        .string({ error: 'Say why the risk is accepted.' })
        .trim()
        .min(10, 'Say why the risk is accepted (at least 10 characters).')
        .max(2000),
    }),
    raw,
  )
  await inClient(ctx, clientId, async (tx) => {
    const [current] = await tx
      .select({ code: risk.code, status: risk.status, findingId: risk.findingId })
      .from(risk)
      .where(and(eq(risk.id, riskId), eq(risk.tenantId, clientId)))
    if (!current) throw new NotFoundError('Risk')
    if (current.status === 'closed') throw new RuleError('This risk is already closed.')
    if (current.findingId) {
      await acceptActionsForFinding(tx, ctx, clientId, current.findingId, input.note)
    }
    await tx
      .update(risk)
      .set({
        status: 'accepted',
        treatment: 'accept',
        acceptedBy: ctx.principal.userId,
        acceptedAt: new Date(),
        acceptanceNote: input.note,
        updatedAt: new Date(),
      })
      .where(eq(risk.id, riskId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'risk.accept',
      entity: 'risk',
      entityId: current.code,
      detail: { note: input.note },
    })
  })
}
