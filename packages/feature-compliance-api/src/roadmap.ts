import { authorize } from '@duatf/core-access'
import { and, eq, finding, inArray, remediationAction, risk } from '@duatf/platform-db'
import { FINAL_ACTION_STATUSES, listActions } from './actions'
import { inClient, type ServiceContext } from './context'
import { isRoadmapPhase, PHASE_INFO, ROADMAP_PHASES, suggestedPhase } from './phases'
import { listBands, ratingFor } from './risks'

// The remediation roadmap (ADR-0009): each unfinished action in a phase, now, next or later, with
// its effort in days. The phase is the one the consultant set, or else the one its finding's risk
// rating suggests.

/** Unfinished work: an action that is neither closed, accepted as a risk nor done and awaiting closure. */
const unfinished = (status: string) =>
  !FINAL_ACTION_STATUSES.some((final) => final === status) && status !== 'remediated'

/** The client's roadmap: unfinished actions by phase, with the totals of each phase. */
export const roadmap = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  const [actions, bands] = await Promise.all([listActions(ctx, clientId), listBands(ctx.db)])
  const open = actions.filter((row) => unfinished(row.status))
  const details = open.length
    ? await inClient(ctx, clientId, (tx) =>
        tx
          .select({
            id: remediationAction.id,
            phase: remediationAction.phase,
            effortDays: remediationAction.effortDays,
            gapType: finding.gapType,
            score: risk.score,
          })
          .from(remediationAction)
          .innerJoin(finding, eq(finding.id, remediationAction.findingId))
          .leftJoin(risk, eq(risk.findingId, finding.id))
          .where(
            and(
              eq(remediationAction.tenantId, clientId),
              inArray(
                remediationAction.id,
                open.map((row) => row.id),
              ),
            ),
          ),
      )
    : []
  const rows = open.map((row) => {
    // A finding with more than one risk is placed by the highest.
    const own = details.filter((item) => item.id === row.id)
    const score = own.reduce<number | null>(
      (top, item) => (item.score === null ? top : Math.max(top ?? 0, item.score)),
      null,
    )
    const saved = own[0]?.phase ?? null
    const suggested = suggestedPhase(score, bands, own[0]?.gapType ?? 'gap')
    return {
      ...row,
      score,
      band: score === null ? null : ratingFor(score, bands),
      effortDays: own[0]?.effortDays ?? null,
      phase: isRoadmapPhase(saved) ? saved : suggested,
      suggestedPhase: suggested,
      phaseSet: isRoadmapPhase(saved),
    }
  })
  const phases = ROADMAP_PHASES.map((phase) => {
    const inPhase = rows
      .filter((row) => row.phase === phase)
      .sort(
        (a, b) =>
          (b.score ?? 0) - (a.score ?? 0) ||
          (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
          a.code.localeCompare(b.code),
      )
    return {
      phase,
      ...PHASE_INFO[phase],
      rows: inPhase,
      actions: inPhase.length,
      effortDays: inPhase.reduce((sum, row) => sum + (row.effortDays ?? 0), 0),
      unestimated: inPhase.filter((row) => row.effortDays === null).length,
      overdue: inPhase.filter((row) => row.overdue).length,
    }
  })
  return { phases, total: rows.length, bands }
}
export type Roadmap = Awaited<ReturnType<typeof roadmap>>
export type RoadmapRow = Roadmap['phases'][number]['rows'][number]
