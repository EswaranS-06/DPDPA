import { randomUUID } from 'node:crypto'
import { authorize, can } from '@duatf/core-access'
import { isoDate, sequenceScope } from '@duatf/core-utils'
import {
  and,
  appUser,
  asc,
  assessment,
  assessmentItem,
  count,
  department,
  desc,
  eq,
  evidence,
  evidenceLink,
  EVIDENCE_STATUSES,
  ilike,
  inArray,
  nextCode,
  or,
  sql,
  tenant,
  type EvidenceStatus,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { audit, inClient, type EvidenceStorage, type ServiceContext } from './context'
import {
  NotFoundError,
  optionalDate,
  optionalText,
  parseInput,
  requiredText,
  RuleError,
  ValidationError,
} from './errors'

export const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024
export const DOWNLOAD_LINK_SECONDS = 300

const ZIP = [0x50, 0x4b, 0x03, 0x04]
const FILE_KINDS: { extensions: string[]; contentType: string; magic?: number[]; text?: true }[] = [
  { extensions: ['pdf'], contentType: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  { extensions: ['png'], contentType: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
  { extensions: ['jpg', 'jpeg'], contentType: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  {
    extensions: ['docx'],
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    magic: ZIP,
  },
  {
    extensions: ['xlsx'],
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    magic: ZIP,
  },
  {
    extensions: ['pptx'],
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    magic: ZIP,
  },
  { extensions: ['csv'], contentType: 'text/csv', text: true },
  { extensions: ['txt'], contentType: 'text/plain', text: true },
]

export const ALLOWED_EVIDENCE_EXTENSIONS = FILE_KINDS.flatMap((kind) => kind.extensions)

/**
 * Checks an uploaded file: allowed extension, size, and content that really is that kind of
 * file. The content type is decided here, never taken from the browser.
 */
export const checkEvidenceFile = (
  name: string,
  bytes: Buffer,
): { fileName: string; contentType: string } => {
  const fileName = name
    .replace(/[\\/]/g, '_')
    .replace(/[^\p{L}\p{N}._ ()-]/gu, '_')
    .slice(-150)
    .trim()
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  const kind = FILE_KINDS.find((item) => item.extensions.includes(extension))
  if (!fileName || bytes.length === 0) throw new ValidationError({ file: 'Choose a file.' })
  if (!kind) {
    throw new ValidationError({
      file: `Upload PDF, image, Word, Excel, PowerPoint, CSV or text files (${ALLOWED_EVIDENCE_EXTENSIONS.join(', ')}).`,
    })
  }
  if (bytes.length > MAX_EVIDENCE_BYTES) {
    throw new ValidationError({ file: 'The file is larger than 20 MB.' })
  }
  const matches = kind.magic
    ? kind.magic.every((byte, index) => bytes[index] === byte)
    : !bytes.subarray(0, 8192).includes(0)
  if (!matches) {
    throw new ValidationError({ file: `The file content is not a valid .${extension} file.` })
  }
  return { fileName, contentType: kind.contentType }
}

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const idList = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      : (value ?? undefined),
  z.array(z.uuid('Choose questions from this client.')).max(200).optional(),
)

const uploadSchema = z.object({
  title: requiredText('Title', 200),
  description: optionalText(2000),
  validUntil: optionalDate(),
  departmentId: z.preprocess(blankToUndefined, z.uuid().optional()),
  itemIds: idList,
})

const requireStorage = (ctx: ServiceContext): EvidenceStorage => {
  if (!ctx.storage) throw new Error('Evidence storage is not configured.')
  return ctx.storage
}

const itemDepartments = async (tx: Transaction, clientId: string, itemIds: string[]) => {
  if (itemIds.length === 0) return []
  const rows = await tx
    .select({ id: assessmentItem.id, departmentId: assessmentItem.departmentId })
    .from(assessmentItem)
    .where(and(eq(assessmentItem.tenantId, clientId), inArray(assessmentItem.id, itemIds)))
  if (rows.length !== new Set(itemIds).size) {
    throw new ValidationError({ itemIds: 'Choose questions from this client.' })
  }
  return rows
}

/** Department owners may only attach evidence to their own department's questions. */
const authorizeUpload = (
  ctx: ServiceContext,
  clientId: string,
  departmentIds: (string | null)[],
) => {
  for (const departmentId of departmentIds.length ? departmentIds : [null]) {
    authorize(ctx.principal, 'evidence.upload', { clientId, departmentId })
  }
}

/** Stores a file with its SHA-256 and links it to the chosen questions. */
export const uploadEvidence = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
  file: { name: string; bytes: Buffer },
): Promise<{ id: string; code: string; sha256: string }> => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  const input = parseInput(uploadSchema, raw)
  const checked = checkEvidenceFile(file.name, file.bytes)
  const storage = requireStorage(ctx)
  const itemIds = [...new Set(input.itemIds ?? [])]
  const items = await inClient(ctx, clientId, (tx) => itemDepartments(tx, clientId, itemIds))
  authorizeUpload(
    ctx,
    clientId,
    items.length ? items.map((item) => item.departmentId) : [input.departmentId ?? null],
  )
  const sameDepartment = new Set(items.map((item) => item.departmentId))
  const departmentId =
    input.departmentId ?? (sameDepartment.size === 1 ? ([...sameDepartment][0] ?? null) : null)

  const key = `${clientId}/${randomUUID()}`
  const stored = await storage.put(key, file.bytes, checked.contentType)
  try {
    return await inClient(ctx, clientId, async (tx) => {
      const [client] = await tx
        .select({ code: tenant.code })
        .from(tenant)
        .where(eq(tenant.id, clientId))
      if (!client) throw new NotFoundError('Client')
      const code = await nextCode(tx, clientId, sequenceScope('EVD', client.code))
      const [created] = await tx
        .insert(evidence)
        .values({
          tenantId: clientId,
          code,
          title: input.title,
          description: input.description ?? null,
          fileName: checked.fileName,
          contentType: checked.contentType,
          sizeBytes: stored.size,
          sha256: stored.sha256,
          storageKey: key,
          departmentId,
          validUntil: input.validUntil ?? null,
          uploadedBy: ctx.principal.userId,
        })
        .returning({ id: evidence.id })
      const id = created?.id ?? ''
      if (itemIds.length) {
        await tx.insert(evidenceLink).values(
          itemIds.map((itemId) => ({
            tenantId: clientId,
            evidenceId: id,
            itemId,
            createdBy: ctx.principal.userId,
          })),
        )
      }
      await audit(tx, ctx, {
        tenantId: clientId,
        action: 'evidence.upload',
        entity: 'evidence',
        entityId: code,
        detail: { sha256: stored.sha256, size: stored.size, items: itemIds.length },
      })
      return { id, code, sha256: stored.sha256 }
    })
  } catch (error) {
    await storage.remove(key).catch(() => undefined)
    throw error
  }
}

/** Uses an existing piece of evidence for more questions. */
export const linkEvidence = async (
  ctx: ServiceContext,
  clientId: string,
  evidenceId: string,
  raw: unknown,
): Promise<number> => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  const input = parseInput(z.object({ itemIds: idList }), raw)
  const itemIds = [...new Set(input.itemIds ?? [])]
  if (itemIds.length === 0) throw new ValidationError({ itemIds: 'Choose at least one question.' })
  return inClient(ctx, clientId, async (tx) => {
    const [found] = await tx
      .select({ code: evidence.code })
      .from(evidence)
      .where(and(eq(evidence.id, evidenceId), eq(evidence.tenantId, clientId)))
    if (!found) throw new NotFoundError('Evidence')
    const items = await itemDepartments(tx, clientId, itemIds)
    authorizeUpload(
      ctx,
      clientId,
      items.map((item) => item.departmentId),
    )
    const linked = await tx
      .insert(evidenceLink)
      .values(
        itemIds.map((itemId) => ({
          tenantId: clientId,
          evidenceId,
          itemId,
          createdBy: ctx.principal.userId,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: evidenceLink.id })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'evidence.link',
      entity: 'evidence',
      entityId: found.code,
      detail: { items: linked.length },
    })
    return linked.length
  })
}

export const unlinkEvidence = async (
  ctx: ServiceContext,
  clientId: string,
  evidenceId: string,
  itemId: string,
): Promise<void> => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const items = await itemDepartments(tx, clientId, [itemId])
    authorizeUpload(
      ctx,
      clientId,
      items.map((item) => item.departmentId),
    )
    const removed = await tx
      .delete(evidenceLink)
      .where(
        and(
          eq(evidenceLink.evidenceId, evidenceId),
          eq(evidenceLink.itemId, itemId),
          eq(evidenceLink.tenantId, clientId),
        ),
      )
      .returning({ id: evidenceLink.id })
    if (removed.length === 0) throw new NotFoundError('Evidence link')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'evidence.unlink',
      entity: 'evidence',
      entityId: evidenceId,
      detail: { itemId },
    })
  })
}

const evidenceColumns = {
  id: evidence.id,
  code: evidence.code,
  title: evidence.title,
  description: evidence.description,
  fileName: evidence.fileName,
  contentType: evidence.contentType,
  sizeBytes: evidence.sizeBytes,
  sha256: evidence.sha256,
  status: evidence.status,
  validUntil: evidence.validUntil,
  uploadedBy: evidence.uploadedBy,
  uploadedAt: evidence.uploadedAt,
  uploadedByName: appUser.displayName,
  reviewNote: evidence.reviewNote,
  reviewedAt: evidence.reviewedAt,
  departmentName: department.name,
  linkCount: sql<number>`(select count(*)::int from evidence_link l where l.evidence_id = "evidence"."id")`,
}

const withExpiry = <Row extends { validUntil: string | null }>(rows: Row[], today: string) =>
  rows.map((row) => ({ ...row, expired: row.validUntil !== null && row.validUntil < today }))

export type EvidenceFilters = { status?: EvidenceStatus; text?: string; departmentId?: string }

/** The client's evidence repository, newest first. */
export const listEvidence = async (
  ctx: ServiceContext,
  clientId: string,
  filters: EvidenceFilters = {},
) => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  const rows = await inClient(ctx, clientId, (tx) =>
    tx
      .select(evidenceColumns)
      .from(evidence)
      .leftJoin(appUser, eq(appUser.id, evidence.uploadedBy))
      .leftJoin(department, eq(department.id, evidence.departmentId))
      .where(
        and(
          eq(evidence.tenantId, clientId),
          filters.status ? eq(evidence.status, filters.status) : undefined,
          filters.departmentId ? eq(evidence.departmentId, filters.departmentId) : undefined,
          filters.text
            ? or(
                ilike(evidence.title, `%${filters.text.replace(/[\\%_]/g, '\\$&')}%`),
                ilike(evidence.code, `%${filters.text.replace(/[\\%_]/g, '\\$&')}%`),
                ilike(evidence.fileName, `%${filters.text.replace(/[\\%_]/g, '\\$&')}%`),
              )
            : undefined,
        ),
      )
      .orderBy(desc(evidence.uploadedAt)),
  )
  return withExpiry(rows, isoDate(new Date()))
}
export type EvidenceRow = Awaited<ReturnType<typeof listEvidence>>[number]

/** Evidence attached to one assessment item. */
export const listItemEvidence = async (ctx: ServiceContext, clientId: string, itemId: string) => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  const rows = await inClient(ctx, clientId, (tx) =>
    tx
      .select(evidenceColumns)
      .from(evidenceLink)
      .innerJoin(evidence, eq(evidence.id, evidenceLink.evidenceId))
      .leftJoin(appUser, eq(appUser.id, evidence.uploadedBy))
      .leftJoin(department, eq(department.id, evidence.departmentId))
      .where(and(eq(evidenceLink.itemId, itemId), eq(evidenceLink.tenantId, clientId)))
      .orderBy(asc(evidence.code)),
  )
  return withExpiry(rows, isoDate(new Date()))
}

/** One piece of evidence and every question it is used for. */
export const getEvidence = async (ctx: ServiceContext, clientId: string, code: string) => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select(evidenceColumns)
      .from(evidence)
      .leftJoin(appUser, eq(appUser.id, evidence.uploadedBy))
      .leftJoin(department, eq(department.id, evidence.departmentId))
      .where(and(eq(evidence.tenantId, clientId), eq(evidence.code, code.toUpperCase())))
    if (!row) throw new NotFoundError(`Evidence ${code}`)
    const links = await tx
      .select({
        itemId: assessmentItem.id,
        questionCode: assessmentItem.questionCode,
        assessmentCode: assessment.code,
        assessmentTitle: assessment.title,
      })
      .from(evidenceLink)
      .innerJoin(assessmentItem, eq(assessmentItem.id, evidenceLink.itemId))
      .innerJoin(assessment, eq(assessment.id, assessmentItem.assessmentId))
      .where(eq(evidenceLink.evidenceId, row.id))
      .orderBy(asc(assessment.code), asc(assessmentItem.seq))
    const [expiredRow] = withExpiry([row], isoDate(new Date()))
    return { ...(expiredRow ?? { ...row, expired: false }), links }
  })
}
export type EvidenceDetail = Awaited<ReturnType<typeof getEvidence>>

const reviewSchema = z
  .object({
    decision: z.enum(['accepted', 'rejected'], { error: 'Accept or reject.' }),
    note: optionalText(2000),
  })
  .refine((value) => value.decision === 'accepted' || (value.note?.length ?? 0) > 0, {
    path: ['note'],
    message: 'Say why the evidence is rejected.',
  })

/** Accepts or rejects evidence. The person who uploaded it cannot review it. */
export const reviewEvidence = async (
  ctx: ServiceContext,
  clientId: string,
  evidenceId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'evidence.review', { clientId })
  const input = parseInput(reviewSchema, raw)
  await inClient(ctx, clientId, async (tx) => {
    const [found] = await tx
      .select({ code: evidence.code, uploadedBy: evidence.uploadedBy })
      .from(evidence)
      .where(and(eq(evidence.id, evidenceId), eq(evidence.tenantId, clientId)))
    if (!found) throw new NotFoundError('Evidence')
    if (found.uploadedBy === ctx.principal.userId) {
      throw new RuleError('Someone other than the person who uploaded it must review it.')
    }
    await tx
      .update(evidence)
      .set({
        status: input.decision,
        reviewNote: input.note ?? null,
        reviewedBy: ctx.principal.userId,
        reviewedAt: new Date(),
      })
      .where(eq(evidence.id, evidenceId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: `evidence.${input.decision}`,
      entity: 'evidence',
      entityId: found.code,
    })
  })
}

/** A download link valid for five minutes, issued only to people who may see the evidence. */
export const evidenceDownloadUrl = async (
  ctx: ServiceContext,
  clientId: string,
  evidenceId: string,
): Promise<string> => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  const storage = requireStorage(ctx)
  return inClient(ctx, clientId, async (tx) => {
    const [found] = await tx
      .select({ code: evidence.code, key: evidence.storageKey, fileName: evidence.fileName })
      .from(evidence)
      .where(and(eq(evidence.id, evidenceId), eq(evidence.tenantId, clientId)))
    if (!found) throw new NotFoundError('Evidence')
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'evidence.download',
      entity: 'evidence',
      entityId: found.code,
    })
    return storage.signedUrl(found.key, DOWNLOAD_LINK_SECONDS, found.fileName)
  })
}

/** Counts by status for the repository header. */
export const evidenceStatusCounts = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'evidence.view', { clientId })
  const rows = await inClient(ctx, clientId, (tx) =>
    tx
      .select({ status: evidence.status, n: count() })
      .from(evidence)
      .where(eq(evidence.tenantId, clientId))
      .groupBy(evidence.status),
  )
  return Object.fromEntries(
    EVIDENCE_STATUSES.map((status) => [status, rows.find((row) => row.status === status)?.n ?? 0]),
  ) as Record<EvidenceStatus, number>
}

export const canUploadFor = (ctx: ServiceContext, clientId: string, departmentId: string | null) =>
  can(ctx.principal, 'evidence.upload', { clientId, departmentId })
