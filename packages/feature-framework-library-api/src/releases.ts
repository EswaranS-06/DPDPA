import { authorize, type Principal } from '@duatf/core-access'
import {
  NotFoundError,
  optionalText,
  parseInput,
  RuleError,
  ValidationError,
} from '@duatf/core-utils'
import {
  and,
  appendAudit,
  asc,
  count,
  desc,
  eq,
  FRAMEWORK_CHILD_TABLES,
  frameworkRelease,
  inArray,
  kbChange,
  kbEntryReview,
  sql,
  type Database,
  type Executor,
  type KbEntryOrigin,
  type ReleaseStatus,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'

/**
 * Who is changing the knowledge base. origin "assistant" marks an AI-drafted content pass: the
 * change log names it as such and no user account is recorded as the author.
 */
export type AuthoringContext = {
  db: Database
  principal: Principal
  origin?: KbEntryOrigin
}

export const actorOf = (ctx: AuthoringContext) =>
  ctx.origin === 'assistant'
    ? { userId: null, name: 'Claude (AI-drafted content)' }
    : { userId: ctx.principal.userId, name: ctx.principal.displayName }

export type ReleaseSummary = {
  id: string
  version: string
  status: ReleaseStatus
  source: string
  notes: string | null
  createdBy: string
  createdAt: Date
  publishedBy: string | null
  publishedAt: Date | null
}

export type DraftSummary = ReleaseSummary & { changes: number; awaitingReview: number }

export type ReleaseOverview = {
  published: ReleaseSummary | null
  /** The open draft, if any. At most one draft is open at a time. */
  draft: DraftSummary | null
  /** Every published and superseded release, newest first. */
  history: ReleaseSummary[]
}

const OPEN: ReleaseStatus[] = ['draft', 'in_review']

const summaryColumns = {
  id: frameworkRelease.id,
  version: frameworkRelease.version,
  status: frameworkRelease.status,
  source: frameworkRelease.source,
  notes: frameworkRelease.notes,
  createdBy: frameworkRelease.createdBy,
  createdAt: frameworkRelease.createdAt,
  publishedBy: frameworkRelease.publishedBy,
  publishedAt: frameworkRelease.publishedAt,
}

/** The open draft release, if one exists. */
export const openDraft = async (db: Executor): Promise<ReleaseSummary | undefined> => {
  const [row] = await db
    .select(summaryColumns)
    .from(frameworkRelease)
    .where(inArray(frameworkRelease.status, OPEN))
    .orderBy(desc(frameworkRelease.createdAt))
    .limit(1)
  return row
}

export const releaseOverview = async (db: Executor): Promise<ReleaseOverview> => {
  const rows = await db
    .select(summaryColumns)
    .from(frameworkRelease)
    .orderBy(desc(frameworkRelease.createdAt))
  const published = rows.find((row) => row.status === 'published') ?? null
  const open = rows.find((row) => OPEN.includes(row.status))
  let draft: DraftSummary | null = null
  if (open) {
    const [changes] = await db
      .select({ n: count() })
      .from(kbChange)
      .where(and(eq(kbChange.releaseId, open.id), sql`${kbChange.change} <> 'reviewed'`))
    const [awaiting] = await db
      .select({ n: count() })
      .from(kbEntryReview)
      .where(and(eq(kbEntryReview.releaseId, open.id), eq(kbEntryReview.status, 'awaiting_review')))
    draft = { ...open, changes: changes?.n ?? 0, awaitingReview: awaiting?.n ?? 0 }
  }
  return {
    published,
    draft,
    history: rows
      .filter((row) => row.status === 'published' || row.status === 'superseded')
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)),
  }
}

const SEMVER = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

const versionParts = (version: string): number[] =>
  (SEMVER.exec(version) ?? []).slice(1).map((part) => Number(part))

/** Negative when a comes before b. */
export const compareVersions = (a: string, b: string): number => {
  const [x, y] = [versionParts(a), versionParts(b)]
  for (let index = 0; index < 3; index += 1) {
    const difference = (x[index] ?? 0) - (y[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

/** The next minor version: 1.1.0 becomes 1.2.0. */
export const nextVersion = (version: string): string => {
  const [major = 1, minor = 0] = versionParts(version)
  return `${major}.${minor + 1}.0`
}

/**
 * Copies every row of one release into another, column for column, so a draft starts as an
 * exact copy of the published release (questions and review status included).
 */
export const cloneRelease = async (tx: Transaction, fromId: string, toId: string) => {
  for (const table of FRAMEWORK_CHILD_TABLES) {
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

const lockDrafts = (tx: Transaction) =>
  tx.execute(sql`select pg_advisory_xact_lock(hashtext('duatf_kb_draft'))`)

const startSchema = z.object({
  version: z
    .string({ error: 'Give the version of the new release.' })
    .trim()
    .regex(SEMVER, 'Use a version such as 1.2.0.'),
  notes: optionalText(2000),
})

/**
 * Opens a draft release as a copy of the published one. Edits collect in the draft until a
 * firm administrator publishes it; assessments already running keep the release they started on.
 */
export const startDraft = async (
  ctx: AuthoringContext,
  raw: unknown,
): Promise<{ version: string }> => {
  authorize(ctx.principal, 'kb.edit')
  const input = parseInput(startSchema, raw)
  const actor = actorOf(ctx)
  return ctx.db.transaction(async (tx) => {
    await lockDrafts(tx)
    const overview = await releaseOverview(tx)
    if (overview.draft) {
      throw new RuleError(
        `Draft ${overview.draft.version} is already open. Publish or discard it first.`,
      )
    }
    const from = overview.published
    if (!from) throw new RuleError('There is no published release to start a draft from.')
    if (compareVersions(input.version, from.version) <= 0) {
      throw new ValidationError({ version: `Choose a version after ${from.version}.` })
    }
    const [taken] = await tx
      .select({ id: frameworkRelease.id })
      .from(frameworkRelease)
      .where(eq(frameworkRelease.version, input.version))
    if (taken) throw new ValidationError({ version: `Release ${input.version} already exists.` })
    const [created] = await tx
      .insert(frameworkRelease)
      .values({
        version: input.version,
        status: 'draft',
        source: `release:${from.version} + knowledge-base editor`,
        notes: input.notes ?? null,
        createdBy: actor.name,
      })
      .returning({ id: frameworkRelease.id })
    if (!created) throw new Error('The draft release could not be created.')
    await cloneRelease(tx, from.id, created.id)
    await appendAudit(tx, {
      actorUserId: actor.userId,
      tenantId: null,
      action: 'kb.draft.start',
      entity: 'framework_release',
      entityId: created.id,
      detail: { version: input.version, from: from.version },
    })
    return { version: input.version }
  })
}

/** The open draft, or a rule error saying how to open one. */
export const requireDraft = async (db: Executor): Promise<ReleaseSummary> => {
  const draft = await openDraft(db)
  if (!draft) throw new RuleError('No draft release is open. Start one on the release page first.')
  return draft
}

/** Throws away the open draft and everything changed in it. */
export const discardDraft = async (ctx: AuthoringContext): Promise<{ version: string }> => {
  authorize(ctx.principal, 'kb.publish')
  const actor = actorOf(ctx)
  return ctx.db.transaction(async (tx) => {
    await lockDrafts(tx)
    const draft = await openDraft(tx)
    if (!draft) throw new NotFoundError('An open draft release')
    await tx.delete(frameworkRelease).where(eq(frameworkRelease.id, draft.id))
    await appendAudit(tx, {
      actorUserId: actor.userId,
      tenantId: null,
      action: 'kb.draft.discard',
      entity: 'framework_release',
      entityId: draft.id,
      detail: { version: draft.version },
    })
    return { version: draft.version }
  })
}

/**
 * References that do not resolve inside one release: a process pointing at a missing sector,
 * lawful basis or obligation, or a client profile using a sector overlay that is gone.
 */
export const integrityProblems = async (tx: Transaction, releaseId: string): Promise<string[]> => {
  await tx.execute(sql`select set_config('app.all_tenants', 'on', true)`)
  const rows = await tx.execute<{ problem: string }>(sql`
    select format('Process %s uses sector %s, which has no overlay.', p.code, p.sector_code) as problem
    from process_template p
    where p.release_id = ${releaseId} and p.sector_code <> 'CMN'
      and not exists (select 1 from sector_overlay s where s.release_id = p.release_id and s.code = p.sector_code)
    union all
    select format('Process %s names lawful basis %s, which does not exist.', p.code, b.code)
    from process_template p, unnest(p.typical_lawful_basis) as b(code)
    where p.release_id = ${releaseId}
      and not exists (select 1 from lawful_basis l where l.release_id = p.release_id and l.code = b.code)
    union all
    select format('Process %s lists obligation %s, which does not exist.', p.code, o.code)
    from process_template p, unnest(p.obligation_codes) as o(code)
    where p.release_id = ${releaseId}
      and not exists (select 1 from obligation x where x.release_id = p.release_id and x.code = o.code)
    union all
    select format('Sector overlay %s lists process %s, which does not exist.', s.code, t.code)
    from sector_overlay s, unnest(s.process_template_codes) as t(code)
    where s.release_id = ${releaseId}
      and not exists (select 1 from process_template p where p.release_id = s.release_id and p.code = t.code)
    union all
    select format('Client %s uses sector overlay %s, which does not exist.', t.code, c.sector_code)
    from client_profile c join tenant t on t.id = c.tenant_id
    where c.sector_code is not null
      and not exists (select 1 from sector_overlay s where s.release_id = ${releaseId} and s.code = c.sector_code)
    order by 1`)
  return rows.map((row) => row.problem)
}

/** Problems the draft has that the published release does not: these block publishing. */
export const newProblems = async (tx: Transaction): Promise<string[]> => {
  const overview = await releaseOverview(tx)
  if (!overview.draft) return []
  const before = new Set(
    overview.published ? await integrityProblems(tx, overview.published.id) : [],
  )
  return (await integrityProblems(tx, overview.draft.id)).filter((problem) => !before.has(problem))
}

/** The problems that would stop the open draft from being published (empty when none). */
export const draftProblems = (db: Database): Promise<string[]> =>
  db.transaction((tx) => newProblems(tx))

const publishSchema = z.object({
  notes: optionalText(2000),
  acknowledge: z.preprocess((value) => value === 'on' || value === true, z.boolean()),
})

/**
 * Publishes the open draft: it becomes the release every new assessment and the knowledge-base
 * page use, and the previous release is kept as superseded.
 */
export const publishDraft = async (
  ctx: AuthoringContext,
  raw: unknown,
): Promise<{ version: string }> => {
  authorize(ctx.principal, 'kb.publish')
  const input = parseInput(publishSchema, raw)
  const actor = actorOf(ctx)
  return ctx.db.transaction(async (tx) => {
    await lockDrafts(tx)
    const overview = await releaseOverview(tx)
    const draft = overview.draft
    if (!draft) throw new NotFoundError('An open draft release')
    if (draft.changes === 0) throw new RuleError('The draft has no changes to publish yet.')
    const problems = await newProblems(tx)
    if (problems.length) {
      throw new RuleError(
        `Fix these before publishing: ${problems.slice(0, 5).join(' ')}${problems.length > 5 ? ` And ${problems.length - 5} more.` : ''}`,
      )
    }
    if (draft.awaitingReview > 0 && !input.acknowledge) {
      throw new ValidationError({
        acknowledge: `${draft.awaitingReview} ${draft.awaitingReview === 1 ? 'entry is' : 'entries are'} still awaiting legal review. Review them first, or tick this box to publish them with that label.`,
      })
    }
    if (overview.published) {
      await tx
        .update(frameworkRelease)
        .set({ status: 'superseded' })
        .where(eq(frameworkRelease.id, overview.published.id))
    }
    const notes = [draft.notes, input.notes].filter(Boolean).join('\n\n') || null
    await tx
      .update(frameworkRelease)
      .set({ status: 'published', publishedBy: actor.name, publishedAt: new Date(), notes })
      .where(eq(frameworkRelease.id, draft.id))
    await appendAudit(tx, {
      actorUserId: actor.userId,
      tenantId: null,
      action: 'kb.release.publish',
      entity: 'framework_release',
      entityId: draft.id,
      detail: {
        version: draft.version,
        replaces: overview.published?.version ?? null,
        changes: draft.changes,
        awaitingReview: draft.awaitingReview,
      },
    })
    return { version: draft.version }
  })
}

export type DraftChange = {
  id: string
  section: string
  code: string
  title: string
  change: 'added' | 'edited' | 'removed' | 'reviewed'
  detail: string | null
  actorName: string
  at: Date
}

/** Everything changed in a release, oldest first. */
export const releaseChanges = (db: Executor, releaseId: string): Promise<DraftChange[]> =>
  db
    .select({
      id: kbChange.id,
      section: kbChange.section,
      code: kbChange.code,
      title: kbChange.title,
      change: kbChange.change,
      detail: kbChange.detail,
      actorName: kbChange.actorName,
      at: kbChange.at,
    })
    .from(kbChange)
    .where(eq(kbChange.releaseId, releaseId))
    .orderBy(asc(kbChange.at))

export type EntryReview = {
  section: string
  code: string
  status: 'awaiting_review' | 'reviewed'
  origin: KbEntryOrigin
  changedBy: string
  changedAt: Date
  reviewedBy: string | null
  reviewedAt: Date | null
  reviewNote: string | null
}

/** Review status of the entries of a release that were added or changed in the editor. */
export const releaseReviews = (
  db: Executor,
  releaseId: string,
  section?: string,
): Promise<EntryReview[]> =>
  db
    .select({
      section: kbEntryReview.section,
      code: kbEntryReview.code,
      status: kbEntryReview.status,
      origin: kbEntryReview.origin,
      changedBy: kbEntryReview.changedBy,
      changedAt: kbEntryReview.changedAt,
      reviewedBy: kbEntryReview.reviewedBy,
      reviewedAt: kbEntryReview.reviewedAt,
      reviewNote: kbEntryReview.reviewNote,
    })
    .from(kbEntryReview)
    .where(
      and(
        eq(kbEntryReview.releaseId, releaseId),
        section ? eq(kbEntryReview.section, section) : undefined,
      ),
    )
    .orderBy(asc(kbEntryReview.section), asc(kbEntryReview.code))
