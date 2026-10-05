import {
  and,
  assessmentItem,
  department,
  eq,
  inArray,
  question,
  sql,
  type ItemResponse,
  type QuestionGate,
  type Transaction,
} from '@duatf/platform-db'
import { audit, type ServiceContext } from './context'
import { syncFinding } from './findings'
import { responseValues } from './responses'

// Self-reconciliation of Not applicable. Some questions apply only when another answer says so:
// the SDF questions follow A1.4, the children's and guardian questions follow A2.5, the
// transfer questions follow A10.1 (the gates are part of the knowledge-base mapping). A gate is
// read across the whole cycle, whichever department answers it.

export type GateReading = {
  gate: QuestionGate
  /** What the gate's answers say: the question does not apply, applies, or nothing yet. */
  state: 'not_applicable' | 'applies' | 'unknown'
  /** The chosen options of the gate question in this cycle. */
  values: string[]
}

type Answered = { answer: string; response: ItemResponse | null }

/** Reads one gate from the answers its question has in the cycle. */
export const readGate = (gate: QuestionGate, answers: readonly Answered[]): GateReading => {
  const values = answers
    .filter((row) => row.answer !== 'not_assessed' && row.answer !== 'not_applicable')
    .flatMap((row) => responseValues(row.response))
  if (values.length === 0) return { gate, state: 'unknown', values }
  return {
    gate,
    state: values.every((value) => gate.values.includes(value)) ? 'not_applicable' : 'applies',
    values: [...new Set(values)],
  }
}

/** All gates of a question, read in one cycle. */
export const readGates = async (
  tx: Transaction,
  assessmentId: string,
  gates: readonly QuestionGate[],
): Promise<GateReading[]> => {
  if (gates.length === 0) return []
  const rows = await tx
    .select({
      questionCode: assessmentItem.questionCode,
      answer: assessmentItem.answer,
      response: assessmentItem.response,
    })
    .from(assessmentItem)
    .where(
      and(
        eq(assessmentItem.assessmentId, assessmentId),
        inArray(
          assessmentItem.questionCode,
          gates.map((gate) => gate.question),
        ),
      ),
    )
  return gates.map((gate) =>
    readGate(
      gate,
      rows.filter((row) => row.questionCode === gate.question),
    ),
  )
}

/** The gate that rules the question out, if any; otherwise the gate that says it applies. */
export const verdict = (readings: readonly GateReading[]) => ({
  blocking: readings.find((reading) => reading.state === 'not_applicable') ?? null,
  applying: readings.find((reading) => reading.state === 'applies') ?? null,
})

const quoted = (values: string[]) => values.map((value) => `"${value}"`).join(', ')

/** Why an answer contradicts the gates, or null when it fits them. */
export const gateConflict = (
  readings: readonly GateReading[],
  answer: string,
): { answer: string } | null => {
  const { blocking, applying } = verdict(readings)
  if (blocking && answer !== 'not_applicable') {
    return {
      answer: `This question does not apply: ${blocking.gate.reason} It stays Not applicable until ${blocking.gate.question} changes.`,
    }
  }
  if (!blocking && applying && answer === 'not_applicable') {
    return {
      answer: `${applying.gate.question} is answered ${quoted(applying.values)}, so this question applies and cannot be Not applicable.`,
    }
  }
  return null
}

/** Questions of the release whose gates name the given question. */
export const dependentsOf = async (tx: Transaction, releaseId: string, gateCode: string) =>
  tx
    .select({ code: question.code, gates: question.gates })
    .from(question)
    .where(
      and(
        eq(question.releaseId, releaseId),
        sql`${question.gates} @> ${JSON.stringify([{ question: gateCode }])}::jsonb`,
      ),
    )

/**
 * Brings the given questions' items in a cycle in line with their gates: ruled-out items become
 * Not applicable with the gate's reason; items marked that way, or Not applicable although a
 * gate now says they apply, go back to not assessed. Findings follow the new answer.
 */
export const reconcileQuestions = async (
  tx: Transaction,
  ctx: ServiceContext,
  input: { clientId: string; assessmentId: string; releaseId: string; codes: string[] },
): Promise<number> => {
  if (input.codes.length === 0) return 0
  const questions = await tx
    .select({ code: question.code, gates: question.gates })
    .from(question)
    .where(and(eq(question.releaseId, input.releaseId), inArray(question.code, input.codes)))
  let changed = 0
  for (const row of questions.filter((entry) => entry.gates.length > 0)) {
    const { blocking, applying } = verdict(await readGates(tx, input.assessmentId, row.gates))
    const items = await tx
      .select({
        id: assessmentItem.id,
        answer: assessmentItem.answer,
        autoNaFrom: assessmentItem.autoNaFrom,
        departmentName: department.name,
      })
      .from(assessmentItem)
      .leftJoin(department, eq(department.id, assessmentItem.departmentId))
      .where(
        and(
          eq(assessmentItem.assessmentId, input.assessmentId),
          eq(assessmentItem.questionCode, row.code),
        ),
      )
    for (const item of items) {
      const now = new Date()
      if (blocking) {
        if (item.answer === 'not_applicable' && item.autoNaFrom === blocking.gate.question) continue
        await tx
          .update(assessmentItem)
          .set({
            answer: 'not_applicable',
            response: null,
            naReason: `${blocking.gate.reason} Marked automatically.`,
            autoNaFrom: blocking.gate.question,
            answeredBy: ctx.principal.userId,
            answeredAt: now,
            reviewState: 'not_reviewed',
            reviewedBy: null,
            reviewedAt: null,
          })
          .where(eq(assessmentItem.id, item.id))
        await syncFinding(tx, ctx, {
          clientId: input.clientId,
          itemId: item.id,
          answer: 'not_applicable',
          comment: null,
        })
      } else if (
        item.autoNaFrom !== null ||
        (applying !== null && item.answer === 'not_applicable')
      ) {
        await tx
          .update(assessmentItem)
          .set({
            answer: 'not_assessed',
            response: null,
            naReason: null,
            autoNaFrom: null,
            answeredBy: null,
            answeredAt: null,
            reviewState: 'not_reviewed',
            reviewedBy: null,
            reviewedAt: null,
          })
          .where(eq(assessmentItem.id, item.id))
      } else {
        continue
      }
      changed += 1
      await audit(tx, ctx, {
        tenantId: input.clientId,
        action: 'item.reconcile',
        entity: 'assessment_item',
        entityId: item.id,
        detail: {
          question: row.code,
          department: item.departmentName,
          to: blocking ? 'not_applicable' : 'not_assessed',
          gate: (blocking ?? applying)?.gate.question ?? null,
        },
      })
    }
  }
  return changed
}
