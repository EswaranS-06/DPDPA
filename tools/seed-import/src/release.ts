import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  and,
  control,
  createDatabase,
  eq,
  FRAMEWORK_CHILD_TABLES,
  frameworkRelease,
  obligation,
  obligationControl,
  pbcItem,
  question,
  sql,
  type Transaction,
} from '@duatf/platform-db'
import {
  formatReference,
  mergeApplicability,
  parseQuestionBank,
  questionCode,
  riskWeight,
  suggestEvidence,
} from './questionBank'

/** A documented change applied to the cloned rows of a new release. */
export type Amendment = {
  table: 'obligation'
  code: string
  set: { inForceUntil?: string | null; statusText?: string }
  reason: string
}

export const RELEASE_1_1_0 = {
  from: '1.0.0',
  to: '1.1.0',
  amendments: [
    {
      table: 'obligation',
      code: 'LNK-SPDI-01',
      set: { inForceUntil: '2027-05-13' },
      reason:
        'DPDP Act s.44(2) omits IT Act s.43A from 13 May 2027 (Phase 3), so the SPDI Rules 2011 stop applying on that date.',
    },
  ] satisfies Amendment[],
} as const

export class ReleaseExistsError extends Error {
  constructor(version: string) {
    super(`Framework release ${version} already exists. Releases are immutable once built.`)
    this.name = 'ReleaseExistsError'
  }
}

const releaseId = async (tx: Transaction, version: string) => {
  const [row] = await tx
    .select({ id: frameworkRelease.id, status: frameworkRelease.status })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.version, version))
  return row
}

/**
 * Copies every row of the source release into the new one, column for column. Questions are
 * not copied: each release rebuilds them from the question bank.
 */
const cloneRows = async (tx: Transaction, fromId: string, toId: string) => {
  for (const table of FRAMEWORK_CHILD_TABLES.filter((name) => name !== 'question')) {
    const columns = await tx.execute<{ column_name: string }>(sql`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = ${table}
        and column_name <> 'release_id'
        and not (column_name = 'id' and column_default like 'gen_random_uuid%')
      order by ordinal_position`)
    const list = sql.join(
      columns.map((column) => sql.identifier(column.column_name)),
      sql`, `,
    )
    await tx.execute(sql`
      insert into ${sql.identifier(table)} (release_id, ${list})
      select ${toId}, ${list} from ${sql.identifier(table)} where release_id = ${fromId}`)
  }
}

const applyAmendments = async (tx: Transaction, toId: string, amendments: readonly Amendment[]) => {
  for (const amendment of amendments) {
    const updated = await tx
      .update(obligation)
      .set(amendment.set)
      .where(and(eq(obligation.releaseId, toId), eq(obligation.code, amendment.code)))
      .returning({ code: obligation.code })
    if (updated.length !== 1) throw new Error(`Amendment target ${amendment.code} not found.`)
  }
}

const buildQuestions = async (tx: Transaction, toId: string, source: string) => {
  const authored = parseQuestionBank(source)
  const controls = await tx.select().from(control).where(eq(control.releaseId, toId))
  const links = await tx
    .select()
    .from(obligationControl)
    .where(eq(obligationControl.releaseId, toId))
  const obligations = await tx.select().from(obligation).where(eq(obligation.releaseId, toId))
  const pbc = await tx.select().from(pbcItem).where(eq(pbcItem.releaseId, toId))

  const byControl = new Map(authored.map((item) => [item.control, item]))
  const missing = controls.filter((row) => !byControl.has(row.code)).map((row) => row.code)
  const unknown = authored.filter((item) => !controls.some((row) => row.code === item.control))
  if (missing.length || unknown.length) {
    throw new Error(
      `Question bank does not match the controls. Missing: ${missing.join(', ') || 'none'}. ` +
        `Unknown: ${unknown.map((item) => item.control).join(', ') || 'none'}.`,
    )
  }

  const ordered = [...controls].sort((a, b) =>
    a.domainCode === b.domainCode
      ? a.code.localeCompare(b.code)
      : a.domainCode.localeCompare(b.domainCode),
  )
  const rows = ordered.map((row, index) => {
    const authoredQuestion = byControl.get(row.code)
    const obligationCodes = links
      .filter((link) => link.controlCode === row.code)
      .map((link) => link.obligationCode)
      .sort()
    const linked = obligations.filter((item) => obligationCodes.includes(item.code))
    const evidence = suggestEvidence({
      controlEvidence: row.evidence,
      obligationEvidence: linked.flatMap((item) => item.evidenceExpected),
      domainPbcItems: pbc
        .filter((item) => item.domainCodes.includes(row.domainCode))
        .sort((a, b) => a.seq - b.seq)
        .map((item) => item.evidence),
    })
    return {
      releaseId: toId,
      code: questionCode(row.code),
      seq: index + 1,
      controlCode: row.code,
      domainCode: row.domainCode,
      text: authoredQuestion?.question ?? '',
      guidance: row.testProcedure,
      recommendation: authoredQuestion?.recommendation ?? '',
      obligationCodes,
      references: [...new Set(linked.map(formatReference).filter(Boolean))].sort(),
      applicability: mergeApplicability(linked.map((item) => item.trigger)),
      riskWeight: riskWeight(linked.map((item) => item.penaltyTier)),
      evidenceRequired: evidence.required,
      evidenceRecommended: evidence.recommended,
      evidenceSupporting: evidence.supporting,
      reviewStatus: 'draft' as const,
    }
  })
  await tx.insert(question).values(rows)
  return rows.length
}

export type ReleaseReport = { version: string; questions: number; amendments: number }

/**
 * Builds a new published framework release from the current one: every row is copied, the
 * documented amendments are applied, the question bank is added, and the old release is
 * marked superseded. All in one transaction.
 */
export const buildRelease = async (options: {
  databaseUrl: string
  questionBankPath: string
  from: string
  to: string
  amendments: readonly Amendment[]
}): Promise<ReleaseReport> => {
  const source = readFileSync(options.questionBankPath, 'utf8')
  const handle = createDatabase(options.databaseUrl, { max: 1 })
  try {
    return await handle.db.transaction(async (tx) => {
      if (await releaseId(tx, options.to)) throw new ReleaseExistsError(options.to)
      const from = await releaseId(tx, options.from)
      if (!from || from.status !== 'published') {
        throw new Error(`Release ${options.from} is not the published release.`)
      }
      const [created] = await tx
        .insert(frameworkRelease)
        .values({
          version: options.to,
          status: 'draft',
          source: `release:${options.from} + seed/question-bank/questions.yaml`,
          sourceDigest: createHash('sha256').update(source).digest('hex'),
          notes: options.amendments.map((item) => `${item.code}: ${item.reason}`).join('\n'),
          createdBy: 'kb-release',
        })
        .returning({ id: frameworkRelease.id })
      const toId = created?.id ?? ''
      await cloneRows(tx, from.id, toId)
      await applyAmendments(tx, toId, options.amendments)
      const questions = await buildQuestions(tx, toId, source)
      await tx
        .update(frameworkRelease)
        .set({ status: 'superseded' })
        .where(eq(frameworkRelease.id, from.id))
      await tx
        .update(frameworkRelease)
        .set({ status: 'published', publishedBy: 'kb-release', publishedAt: new Date() })
        .where(eq(frameworkRelease.id, toId))
      return { version: options.to, questions, amendments: options.amendments.length }
    })
  } finally {
    await handle.close()
  }
}
