import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  and,
  control,
  createDatabase,
  desc,
  domain,
  eq,
  FRAMEWORK_CHILD_TABLES,
  frameworkRelease,
  obligation,
  pbcItem,
  question,
  questionnaire,
  sql,
  type RiskLevel,
  type Transaction,
} from '@duatf/platform-db'
import {
  answerOptions,
  formatReference,
  guidanceFor,
  mappingGaps,
  mergeApplicability,
  parseKbMapping,
  recommendationFor,
  RISK_WEIGHT,
  suggestEvidence,
  type KbMapping,
} from './questionBank'
import { parseTemplateBank, type TemplateFile } from './templates'

/** Where the question bank lives: the imported templates and ComplyX's KB mapping. */
export type QuestionBankSource = { templatesPath: string; mappingPath: string }

export const questionBankPaths = (root: string): QuestionBankSource => ({
  templatesPath: join(root, 'seed', 'question-bank', 'templates.yaml'),
  mappingPath: join(root, 'seed', 'question-bank', 'kb-mapping.yaml'),
})

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

/** Tables a built release fills from the question bank instead of copying. */
export const QUESTION_BANK_TABLES: readonly string[] = ['questionnaire', 'question']

/**
 * Copies every row of the source release into the new one, column for column. Questions and
 * questionnaires are not copied: each built release rebuilds them from the question bank.
 */
const cloneRows = async (tx: Transaction, fromId: string, toId: string) => {
  for (const table of FRAMEWORK_CHILD_TABLES.filter(
    (name) => !QUESTION_BANK_TABLES.includes(name),
  )) {
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

type QuestionBank = { files: TemplateFile[]; mapping: KbMapping }

/** Reads and checks the question bank: every template question must be mapped. */
export const readQuestionBank = (source: QuestionBankSource) => {
  const templates = readFileSync(source.templatesPath, 'utf8')
  const mapping = readFileSync(source.mappingPath, 'utf8')
  const bank: QuestionBank = {
    files: parseTemplateBank(templates),
    mapping: parseKbMapping(mapping),
  }
  const gaps = mappingGaps(bank.files, bank.mapping)
  if (
    gaps.unmapped.length ||
    gaps.orphaned.length ||
    gaps.noQuestionnaire.length ||
    gaps.badGates.length
  ) {
    throw new Error(
      `The KB mapping does not match the templates. Unmapped: ${gaps.unmapped.join(', ') || 'none'}. ` +
        `Mapped but not in a template: ${gaps.orphaned.join(', ') || 'none'}. ` +
        `Questionnaires without a title: ${gaps.noQuestionnaire.join(', ') || 'none'}. ` +
        `Gates: ${gaps.badGates.join('; ') || 'fine'}.`,
    )
  }
  return { bank, digest: createHash('sha256').update(templates).update(mapping).digest('hex') }
}

const buildQuestions = async (tx: Transaction, toId: string, bank: QuestionBank) => {
  const controls = await tx.select().from(control).where(eq(control.releaseId, toId))
  const obligations = await tx.select().from(obligation).where(eq(obligation.releaseId, toId))
  const domains = await tx
    .select({ code: domain.code })
    .from(domain)
    .where(eq(domain.releaseId, toId))
  const pbc = await tx.select().from(pbcItem).where(eq(pbcItem.releaseId, toId))

  const problems: string[] = []
  for (const [code, entry] of Object.entries(bank.mapping.questions)) {
    if (!domains.some((row) => row.code === entry.domain)) {
      problems.push(`${code}: domain ${entry.domain}`)
    }
    for (const item of entry.obligations) {
      if (!obligations.some((row) => row.code === item)) problems.push(`${code}: ${item}`)
    }
    for (const item of entry.controls) {
      if (!controls.some((row) => row.code === item)) problems.push(`${code}: ${item}`)
    }
  }
  if (problems.length) {
    throw new Error(`The KB mapping names codes this release lacks: ${problems.join('; ')}.`)
  }

  await tx.insert(questionnaire).values(
    bank.files.map((file, index) => {
      const info = bank.mapping.questionnaires[file.questionnaire]
      return {
        releaseId: toId,
        code: file.questionnaire,
        seq: index + 1,
        title: info?.title ?? file.questionnaire,
        respondent: info?.respondent ?? 'organisation',
        description: info?.description ?? '',
        sourceFile: file.file,
      }
    }),
  )

  const templates = bank.files.flatMap((file) =>
    file.questions.map((template) => ({ questionnaireCode: file.questionnaire, template })),
  )
  const rows = templates.map(({ questionnaireCode, template }, index) => {
    const entry = bank.mapping.questions[template.code]
    if (!entry) throw new Error(`Question ${template.code} has no KB mapping.`)
    const mapped = entry.controls.flatMap((code) => {
      const row = controls.find((item) => item.code === code)
      return row ? [row] : []
    })
    const linked = obligations
      .filter((row) => entry.obligations.includes(row.code))
      .sort((a, b) => a.code.localeCompare(b.code))
    const answers = answerOptions(template, entry)
    const evidence = suggestEvidence({
      controlEvidence: mapped.flatMap((row) => row.evidence),
      obligationEvidence: linked.flatMap((row) => row.evidenceExpected),
      domainPbcItems: pbc
        .filter((row) => row.domainCodes.includes(entry.domain))
        .sort((a, b) => a.seq - b.seq)
        .map((row) => row.evidence),
    })
    const riskLevel = template.risk.toLowerCase() as RiskLevel
    return {
      releaseId: toId,
      code: template.code,
      seq: index + 1,
      questionnaireCode,
      section: template.section,
      title: entry.title,
      controlCode: entry.controls[0] ?? '',
      controlCodes: entry.controls,
      domainCode: entry.domain,
      text: template.text,
      answerType: answers.answerType,
      options: answers.options,
      scored: answers.scored,
      riskLevel,
      sourceRef: template.ref,
      sourceId: template.id || null,
      attachmentRequired: template.attachment,
      mappingNote: entry.note ?? null,
      gates: entry.gates ?? [],
      guidance: guidanceFor(mapped),
      recommendation: recommendationFor(mapped),
      obligationCodes: linked.map((row) => row.code),
      references: [...new Set(linked.map(formatReference).filter(Boolean))].sort(),
      // A question that only records facts applies wherever it is asked.
      applicability: answers.scored
        ? mergeApplicability(linked.map((row) => row.trigger))
        : { always: true, roles: [], flags: [], bases: [] },
      riskWeight: RISK_WEIGHT[riskLevel],
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
 * documented amendments are applied, the ComplyX question bank is added, and the old release is
 * marked superseded. All in one transaction.
 */
export const buildRelease = async (options: {
  databaseUrl: string
  questionBank: QuestionBankSource
  from: string
  to: string
  amendments: readonly Amendment[]
}): Promise<ReleaseReport> => {
  const { bank, digest } = readQuestionBank(options.questionBank)
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
          source: `release:${options.from} + seed/question-bank (ComplyX templates, KB mapping)`,
          sourceDigest: digest,
          notes: options.amendments.map((item) => `${item.code}: ${item.reason}`).join('\n'),
          createdBy: 'kb-release',
        })
        .returning({ id: frameworkRelease.id })
      const toId = created?.id ?? ''
      await cloneRows(tx, from.id, toId)
      await applyAmendments(tx, toId, options.amendments)
      const questions = await buildQuestions(tx, toId, bank)
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

/** 1.2.0 becomes 1.3.0. */
const nextMinor = (version: string) => {
  const [major = '1', minor = '0'] = version.split('.')
  return `${major}.${Number(minor) + 1}.0`
}

/**
 * Builds a new release from the published one when the question bank changed since it was last
 * built into a release (new or edited templates, or a new KB mapping). Assessment cycles keep the
 * release they started on; new cycles get the new questions. Returns null when nothing changed.
 */
export const updateQuestionBank = async (options: {
  databaseUrl: string
  questionBank: QuestionBankSource
}): Promise<ReleaseReport | null> => {
  const { digest } = readQuestionBank(options.questionBank)
  const handle = createDatabase(options.databaseUrl, { max: 1 })
  let from: string
  try {
    const rows = await handle.db
      .select({
        version: frameworkRelease.version,
        status: frameworkRelease.status,
        source: frameworkRelease.source,
        sourceDigest: frameworkRelease.sourceDigest,
      })
      .from(frameworkRelease)
      .orderBy(desc(frameworkRelease.createdAt))
    const lastBuilt = rows.find((row) => row.source?.includes('seed/question-bank'))
    if (!lastBuilt || lastBuilt.sourceDigest === digest) return null
    if (rows.some((row) => row.status === 'draft' || row.status === 'in_review')) {
      throw new Error(
        'A knowledge-base draft is open. Publish or discard it, then update the question bank.',
      )
    }
    const published = rows.find((row) => row.status === 'published')
    if (!published) throw new Error('No knowledge-base release is published.')
    from = published.version
  } finally {
    await handle.close()
  }
  return buildRelease({ ...options, from, to: nextMinor(from), amendments: [] })
}
