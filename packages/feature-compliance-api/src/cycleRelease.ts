import { authorize } from '@duatf/core-access'
import {
  and,
  assessment,
  assessmentItem,
  department,
  eq,
  evidenceRequest,
  finding,
  inArray,
  question,
  type Transaction,
} from '@duatf/platform-db'
import { findAssessment, lockReasons, publishedRelease } from './assessments'
import { audit, inClient, type ServiceContext } from './context'
import { RuleError } from './errors'
import { reconcileQuestions } from './reconcile'
import { evaluateResponse, type ResponseInput } from './responses'

const questionsOf = (tx: Transaction, releaseId: string) =>
  tx
    .select({
      code: question.code,
      sourceId: question.sourceId,
      answerType: question.answerType,
      options: question.options,
      controlCode: question.controlCode,
      domainCode: question.domainCode,
      seq: question.seq,
    })
    .from(question)
    .where(eq(question.releaseId, releaseId))

type Question = Awaited<ReturnType<typeof questionsOf>>[number]

/** The stored response as the answer form would send it again. */
const inputOf = (target: Question, response: unknown): ResponseInput => {
  const stored = (response ?? {}) as { values?: string[]; text?: string }
  if (target.answerType === 'text') return { text: stored.text ?? '' }
  if (target.answerType === 'multi_choice') return { choices: stored.values ?? [] }
  return { choice: stored.values?.[0] }
}

export type ReleaseMove = {
  from: string
  to: string
  kept: number
  renumbered: number
  removed: number
  /** Questions whose answer no longer fits the new question and was cleared. */
  cleared: string[]
}

/**
 * Moves an open cycle onto the newest published knowledge-base release, so its departments get
 * the new question bank. Each item follows its question by ComplyX's question ID, so renumbered
 * questions keep their answers, evidence and findings. Answers that still fit are kept, others are
 * cleared; unanswered questions the new release dropped are removed. Refuses when an answered
 * question, or one with evidence or a finding, would be lost or would lose its answer.
 */
export const moveCycleToLatestRelease = async (
  ctx: ServiceContext,
  clientId: string,
  code: string,
): Promise<ReleaseMove> => {
  authorize(ctx.principal, 'assessment.create', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const found = await findAssessment(tx, clientId, code)
    if (found.status === 'completed') {
      throw new RuleError(`${found.code} is completed. Start the next cycle to use new questions.`)
    }
    const latest = await publishedRelease(tx)
    if (latest.id === found.releaseId) {
      throw new RuleError(`${found.code} already uses release ${latest.version}.`)
    }
    const [before, after] = await Promise.all([
      questionsOf(tx, found.releaseId),
      questionsOf(tx, latest.id),
    ])
    const oldByCode = new Map(before.map((row) => [row.code, row]))
    const newBySource = new Map(after.flatMap((row) => (row.sourceId ? [[row.sourceId, row]] : [])))
    const newByCode = new Map(after.map((row) => [row.code, row]))
    const targetOf = (questionCode: string): Question | undefined => {
      const old = oldByCode.get(questionCode)
      return old?.sourceId ? newBySource.get(old.sourceId) : newByCode.get(questionCode)
    }

    const items = await tx
      .select({
        id: assessmentItem.id,
        questionCode: assessmentItem.questionCode,
        answer: assessmentItem.answer,
        response: assessmentItem.response,
        autoNaFrom: assessmentItem.autoNaFrom,
        departmentCode: department.code,
      })
      .from(assessmentItem)
      .leftJoin(department, eq(department.id, assessmentItem.departmentId))
      .where(eq(assessmentItem.assessmentId, found.id))
    const locks = await lockReasons(
      tx,
      items.map((item) => item.id),
    )
    const label = (item: (typeof items)[number]) =>
      `${item.departmentCode ?? 'no department'} ${item.questionCode}`

    const lost = items.filter((item) => !targetOf(item.questionCode))
    const requested = lost.length
      ? new Set(
          (
            await tx
              .select({ itemId: evidenceRequest.itemId })
              .from(evidenceRequest)
              .where(
                inArray(
                  evidenceRequest.itemId,
                  lost.map((item) => item.id),
                ),
              )
          ).map((row) => row.itemId),
        )
      : new Set<string>()
    const moving = items.flatMap((item) => {
      const target = targetOf(item.questionCode)
      if (!target) return []
      let fits = true
      if (item.answer !== 'not_assessed' && item.answer !== 'not_applicable') {
        try {
          fits = evaluateResponse(target, inputOf(target, item.response)).answer === item.answer
        } catch {
          fits = false
        }
      }
      return [{ item, target, fits }]
    })
    const blocked = [
      ...lost.filter((item) => locks.has(item.id) || requested.has(item.id)),
      ...moving
        .filter(
          ({ item, fits }) => !fits && locks.has(item.id) && locks.get(item.id) !== 'Answered',
        )
        .map(({ item }) => item),
    ]
    if (blocked.length) {
      throw new RuleError(
        `These questions have answers, evidence or findings that release ${latest.version} cannot take over: ${blocked.map(label).join(', ')}. Clear them first, or keep the cycle on release ${found.releaseVersion}.`,
      )
    }

    if (lost.length) {
      await tx.delete(assessmentItem).where(
        inArray(
          assessmentItem.id,
          lost.map((item) => item.id),
        ),
      )
    }
    // Codes may be swapped between questions (B0.6 to B0.5 and back), so park them first.
    const renamed = moving.filter(({ item, target }) => item.questionCode !== target.code)
    for (const { item } of renamed) {
      await tx
        .update(assessmentItem)
        .set({ questionCode: `~${item.id}` })
        .where(eq(assessmentItem.id, item.id))
    }
    const codeMap = new Map(before.map((row) => [row.code, targetOf(row.code)?.code ?? row.code]))
    const cleared: string[] = []
    for (const { item, target, fits } of moving) {
      const reset = !fits
      if (reset) cleared.push(label({ ...item, questionCode: target.code }))
      await tx
        .update(assessmentItem)
        .set({
          questionCode: target.code,
          controlCode: target.controlCode,
          domainCode: target.domainCode,
          seq: target.seq,
          autoNaFrom: item.autoNaFrom ? (codeMap.get(item.autoNaFrom) ?? item.autoNaFrom) : null,
          ...(reset
            ? {
                answer: 'not_assessed' as const,
                response: null,
                naReason: null,
                answeredBy: null,
                answeredAt: null,
                reviewState: 'not_reviewed' as const,
                reviewedBy: null,
                reviewedAt: null,
              }
            : {}),
        })
        .where(eq(assessmentItem.id, item.id))
      if (item.questionCode !== target.code) {
        await tx
          .update(finding)
          .set({ questionCode: target.code })
          .where(and(eq(finding.itemId, item.id), eq(finding.tenantId, clientId)))
      }
    }
    await tx.update(assessment).set({ releaseId: latest.id }).where(eq(assessment.id, found.id))
    // The new release's gates decide again which questions are ruled out.
    await reconcileQuestions(tx, ctx, {
      clientId,
      assessmentId: found.id,
      releaseId: latest.id,
      codes: [...new Set(moving.map(({ target }) => target.code))],
    })
    const result: ReleaseMove = {
      from: found.releaseVersion,
      to: latest.version,
      kept: moving.length,
      renumbered: renamed.length,
      removed: lost.length,
      cleared,
    }
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'assessment.move_release',
      entity: 'assessment',
      entityId: found.code,
      detail: result,
    })
    return result
  })
}
