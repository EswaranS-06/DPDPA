// Shared set-up for the service tests (imported by *.test.ts only, never by the app).
import { randomBytes, randomUUID } from 'node:crypto'
import type { Principal, Role } from '@duatf/core-access'
import { parseEnv, storageEnvSchema, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  and,
  appUser,
  asc,
  createDatabase,
  desc,
  eq,
  evidence,
  frameworkRelease,
  inArray,
  question,
  roleAssignment,
  tenant,
  withTenants,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { createObjectStore } from '@duatf/platform-storage'
import { listItems, openCycle } from './assessments'
import { createClient } from './clients'
import type { ServiceContext } from './context'
import { createDepartment } from './departments'
import { objectEvidenceStorage } from './storage'

export const testEnv = parseEnv(testDatabaseEnvSchema)

/** A principal holding the given roles (firm-wide unless a client or department is given). */
export const principalWith = (
  ...assignments: { role: Role; clientId?: string | null; departmentId?: string | null }[]
): Principal => ({
  userId: randomUUID(),
  email: `user-${randomBytes(3).toString('hex')}`,
  displayName: assignments.map((item) => item.role).join(', '),
  assignments: assignments.map((item) => ({
    role: item.role,
    clientId: item.clientId ?? null,
    departmentId: item.departmentId ?? null,
  })),
})

/** The senior auditor who runs the self-audit. */
export const soloPrincipal = (): Principal => principalWith({ role: 'lead_auditor' })

export type World = {
  app: DatabaseHandle
  owner: DatabaseHandle
  ctx: ServiceContext
  /** Client codes created by the test file, deleted afterwards. */
  codes: string[]
  /** Object keys stored outside the test's clients, removed afterwards. */
  keys: string[]
  /** People created by the test file, deleted afterwards. */
  userIds: string[]
}

export const openWorld = (): World => {
  const app = createDatabase(testEnv.TEST_APP_DATABASE_URL, { max: 4 })
  const owner = createDatabase(testEnv.TEST_DATABASE_URL, { max: 2 })
  const storageEnv = parseEnv(storageEnvSchema)
  const store = createObjectStore(storageEnv, storageEnv.S3_BUCKET_EVIDENCE)
  return {
    app,
    owner,
    ctx: { db: app.db, principal: soloPrincipal(), storage: objectEvidenceStorage(store) },
    codes: [],
    keys: [],
    userIds: [],
  }
}

export const closeWorld = async (world: World): Promise<void> => {
  // Every evidence object of the test's clients, not only the keys a test noted.
  const stored = world.codes.length
    ? await withTenants(world.owner.db, 'all', (tx) =>
        tx
          .select({ key: evidence.storageKey })
          .from(evidence)
          .innerJoin(tenant, eq(tenant.id, evidence.tenantId))
          .where(inArray(tenant.code, world.codes)),
      )
    : []
  const keys = new Set([...world.keys, ...stored.map((row) => row.key)])
  for (const key of keys) await world.ctx.storage?.remove(key).catch(() => undefined)
  if (world.codes.length) {
    await withTenants(world.owner.db, 'all', (tx) =>
      tx.delete(tenant).where(inArray(tenant.code, world.codes)),
    )
  }
  if (world.userIds.length) {
    await world.owner.db.delete(appUser).where(inArray(appUser.id, world.userIds))
  }
  await Promise.all([world.app.close(), world.owner.close()])
}

export const newClient = async (
  world: World,
  label = 'Client',
  profile: Record<string, string> = {},
) => {
  const tag = randomBytes(3).toString('hex').toUpperCase()
  const created = await createClient(world.ctx, {
    name: `T${tag} ${label}`,
    legalName: `T${tag} ${label} Private Limited`,
    industry: 'Healthcare',
    organisationType: 'private_limited',
    primaryContactName: 'Anita Rao',
    primaryContactEmail: 'anita@example.test',
    ...profile,
  })
  world.codes.push(created.code)
  return created
}

/** Question codes of the published release, in order, optionally of one questionnaire or section. */
export const bankCodes = async (
  world: World,
  filter: { questionnaire?: string; section?: string } = {},
) => {
  const [release] = await world.owner.db
    .select({ id: frameworkRelease.id })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  const rows = await world.owner.db
    .select({ code: question.code })
    .from(question)
    .where(
      and(
        eq(question.releaseId, release?.id ?? ''),
        filter.questionnaire ? eq(question.questionnaireCode, filter.questionnaire) : undefined,
        filter.section ? eq(question.section, filter.section) : undefined,
      ),
    )
    .orderBy(asc(question.seq))
  return rows.map((row) => row.code)
}

/** A department with its questions, and its items in the open cycle by question code. */
export const newDepartment = async (
  world: World,
  clientId: string,
  code: string,
  questions: string[],
) => {
  const created = await createDepartment(world.ctx, clientId, {
    code,
    name: `${code} department`,
    questions,
  })
  const cycle = await withTenants(world.owner.db, 'all', (tx) => openCycle(tx, clientId))
  const items = cycle
    ? await listItems(world.ctx, clientId, cycle.id, { department: created.id })
    : []
  return {
    id: created.id,
    change: created.questions,
    cycle,
    items,
    item: (questionCode: string) => {
      const found = items.find((row) => row.questionCode === questionCode)
      if (!found) throw new Error(`No item ${questionCode} in department ${code}`)
      return found
    },
  }
}

/**
 * A real person (a user row with one role), so they can be given work. Firm roles are
 * firm-wide; client roles need the client (and the department for a department owner).
 */
export const newPerson = async (
  world: World,
  role: Role,
  scope: { clientId?: string; departmentId?: string } = {},
): Promise<Principal> => {
  const firm = role === 'firm_admin' || role === 'lead_auditor' || role === 'auditor'
  const [user] = await world.owner.db
    .insert(appUser)
    .values({ displayName: `Test ${role}`, kind: firm ? 'firm' : 'client', status: 'active' })
    .returning({ id: appUser.id })
  const userId = user?.id ?? ''
  world.userIds.push(userId)
  await world.owner.db.insert(roleAssignment).values({
    userId,
    role,
    tenantId: firm ? null : (scope.clientId ?? null),
    departmentId: scope.departmentId ?? null,
  })
  return {
    userId,
    email: `user-${userId.slice(0, 6)}`,
    displayName: `Test ${role}`,
    assignments: [
      {
        role,
        clientId: firm ? null : (scope.clientId ?? null),
        departmentId: scope.departmentId ?? null,
      },
    ],
  }
}

/** The world's context acting as someone else. */
export const as = (world: World, principal: Principal): ServiceContext => ({
  ...world.ctx,
  principal,
})

/** A small PDF that passes the file-type check. */
export const pdf = (text: string) =>
  Buffer.from(`%PDF-1.4
% ${text}
%%EOF
`)
