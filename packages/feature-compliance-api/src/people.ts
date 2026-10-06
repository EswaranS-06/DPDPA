import { authorize, CLIENT_ROLES, FIRM_ROLES, isFirmRole, type Role } from '@duatf/core-access'
import {
  and,
  appUser,
  asc,
  department,
  eq,
  inArray,
  isNull,
  ne,
  or,
  roleAssignment,
  type Executor,
} from '@duatf/platform-db'
import { issueLogin, revokeLogin, UsernameTakenError } from '@duatf/platform-identity'
import { z } from 'zod'
import { audit, inClient, type ServiceContext } from './context'
import {
  isUniqueViolation,
  NotFoundError,
  optionalEmail,
  optionalText,
  parseInput,
  requiredText,
  RuleError,
  ValidationError,
} from './errors'

// People in the self-audit edition. Admins and senior auditors add people at a client (such as
// "IT Head") to give them questions, evidence requests, actions and controls. A person signs in
// only when their login is enabled; then they see their work and can upload evidence.

export type PersonRole = {
  id: string
  role: Role
  clientId: string | null
  departmentId: string | null
  departmentName: string | null
}

export type Person = {
  userId: string
  displayName: string
  jobTitle: string | null
  email: string | null
  username: string | null
  loginEnabled: boolean
  mustChangePassword: boolean
  status: 'invited' | 'active' | 'disabled'
  kind: 'firm' | 'client'
  lastLoginAt: Date | null
  roles: PersonRole[]
}

/** A one-time password shown once to the person who issued it, never stored in clear. */
export type LoginIssued = { username: string; oneTimePassword: string }

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const ticked = (value: unknown) => value === true || value === 'on' || value === 'true'

const usernameField = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z
    .string({ error: 'Choose a username.' })
    .regex(
      /^[a-z0-9][a-z0-9._@-]{1,63}$/,
      'Use 2 to 64 letters, digits, dots, dashes, underscores or @, e.g. it-head.',
    ),
)

const peopleOf = async (db: Executor, userIds: string[]): Promise<Person[]> => {
  if (userIds.length === 0) return []
  const users = await db
    .select()
    .from(appUser)
    .where(inArray(appUser.id, userIds))
    .orderBy(asc(appUser.displayName))
  const roles = await db
    .select({
      id: roleAssignment.id,
      userId: roleAssignment.userId,
      role: roleAssignment.role,
      clientId: roleAssignment.tenantId,
      departmentId: roleAssignment.departmentId,
      departmentName: department.name,
    })
    .from(roleAssignment)
    .leftJoin(department, eq(department.id, roleAssignment.departmentId))
    .where(inArray(roleAssignment.userId, userIds))
  return users.map((user) => ({
    userId: user.id,
    displayName: user.displayName,
    jobTitle: user.jobTitle,
    email: user.email,
    username: user.username,
    loginEnabled: user.loginEnabled,
    mustChangePassword: user.mustChangePassword,
    status: user.status,
    kind: user.kind,
    lastLoginAt: user.lastLoginAt,
    roles: roles
      .filter((row) => row.userId === user.id)
      .map(({ userId: _userId, ...row }) => ({ ...row, role: row.role as Role })),
  }))
}

/** People with a role at this client (client people first, then ComplyX staff on the client). */
export const listClientPeople = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const ids = await ctx.db
    .selectDistinct({ userId: roleAssignment.userId })
    .from(roleAssignment)
    .where(eq(roleAssignment.tenantId, clientId))
  // Department names are read under the client's row-level security.
  const people = await inClient(ctx, clientId, (tx) =>
    peopleOf(
      tx,
      ids.map((row) => row.userId),
    ),
  )
  return people.sort((a, b) => Number(a.kind === 'firm') - Number(b.kind === 'firm'))
}

/**
 * Who work can be given to at a client: its active people and the active ComplyX team. Used
 * for question assignees, evidence requests, action owners and control owners.
 */
export const assignablePeople = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const ids = await ctx.db
    .selectDistinct({ userId: roleAssignment.userId })
    .from(roleAssignment)
    .innerJoin(appUser, eq(appUser.id, roleAssignment.userId))
    .where(
      and(
        or(eq(roleAssignment.tenantId, clientId), isNull(roleAssignment.tenantId)),
        ne(appUser.status, 'disabled'),
      ),
    )
  const people = await inClient(ctx, clientId, (tx) =>
    peopleOf(
      tx,
      ids.map((row) => row.userId),
    ),
  )
  return people.map((person) => ({
    value: person.userId,
    label: `${person.displayName}${person.jobTitle ? `, ${person.jobTitle}` : ''}${person.kind === 'firm' ? ' (ComplyX)' : ''}`,
  }))
}

/** The ComplyX team: people with a firm-wide role. */
export const listStaff = async (ctx: ServiceContext) => {
  authorize(ctx.principal, 'platform.admin')
  const ids = await ctx.db
    .selectDistinct({ userId: roleAssignment.userId })
    .from(roleAssignment)
    .where(isNull(roleAssignment.tenantId))
  return peopleOf(
    ctx.db,
    ids.map((row) => row.userId),
  )
}

const personSchema = z.object({
  displayName: requiredText('Name', 120),
  jobTitle: optionalText(120),
  email: optionalEmail(),
})

const clientPersonSchema = personSchema
  .extend({
    role: z.enum(CLIENT_ROLES, { error: 'Choose a role.' }),
    departmentId: z.preprocess(blankToUndefined, z.uuid().optional()),
    allowLogin: z.preprocess(ticked, z.boolean()),
    username: z.preprocess(blankToUndefined, usernameField.optional()),
  })
  .refine((value) => value.role !== 'department_owner' || value.departmentId, {
    path: ['departmentId'],
    message: 'Choose the department this person owns.',
  })
  .refine((value) => !value.allowLogin || value.username, {
    path: ['username'],
    message: 'Choose a username to let this person sign in.',
  })

const checkDepartment = async (ctx: ServiceContext, clientId: string, departmentId?: string) => {
  if (!departmentId) return
  const [found] = await inClient(ctx, clientId, (tx) =>
    tx
      .select({ id: department.id })
      .from(department)
      .where(and(eq(department.id, departmentId), eq(department.tenantId, clientId))),
  )
  if (!found) throw new ValidationError({ departmentId: 'Choose a department of this client.' })
}

const loginFor = async (
  tx: Executor,
  ctx: ServiceContext,
  userId: string,
  username: string,
): Promise<LoginIssued> => {
  try {
    return {
      username,
      oneTimePassword: await issueLogin(tx, {
        userId,
        username,
        actorUserId: ctx.principal.userId,
      }),
    }
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      throw new ValidationError({ username: `The username ${username} is taken.` })
    }
    throw error
  }
}

/**
 * Adds a person at a client with one role (for example a department owner such as IT Head).
 * Without a login they can still be given work; with one, a one-time password is returned.
 */
export const createClientPerson = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<{ userId: string; login: LoginIssued | null }> => {
  authorize(ctx.principal, 'user.invite', { clientId })
  const input = parseInput(clientPersonSchema, raw)
  const departmentId = input.role === 'department_owner' ? input.departmentId : undefined
  await checkDepartment(ctx, clientId, departmentId)
  try {
    return await ctx.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(appUser)
        .values({
          displayName: input.displayName,
          jobTitle: input.jobTitle ?? null,
          email: input.email ?? null,
          kind: 'client',
          status: 'active',
          createdBy: ctx.principal.userId,
        })
        .returning({ id: appUser.id })
      const userId = created?.id ?? ''
      await tx.insert(roleAssignment).values({
        userId,
        role: input.role,
        tenantId: clientId,
        departmentId: departmentId ?? null,
        createdBy: ctx.principal.userId,
      })
      const login =
        input.allowLogin && input.username ? await loginFor(tx, ctx, userId, input.username) : null
      await audit(tx, ctx, {
        tenantId: clientId,
        action: 'person.create',
        entity: 'app_user',
        entityId: userId,
        detail: { role: input.role, departmentId: departmentId ?? null, login: Boolean(login) },
      })
      return { userId, login }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError({ email: 'Someone already has this email address.' })
    }
    throw error
  }
}

const roleSchema = z
  .object({
    role: z.enum(CLIENT_ROLES, { error: 'Choose a role.' }),
    departmentId: z.preprocess(blankToUndefined, z.uuid().optional()),
  })
  .refine((value) => value.role !== 'department_owner' || value.departmentId, {
    path: ['departmentId'],
    message: 'Choose the department.',
  })

/** The person must be someone at this client (not ComplyX staff) for client-level changes. */
const clientPerson = async (ctx: ServiceContext, clientId: string, userId: string) => {
  const [row] = await ctx.db
    .select({ user: appUser })
    .from(appUser)
    .innerJoin(roleAssignment, eq(roleAssignment.userId, appUser.id))
    .where(and(eq(appUser.id, userId), eq(roleAssignment.tenantId, clientId)))
    .limit(1)
  if (!row) throw new NotFoundError('Person')
  if (row.user.kind === 'firm') {
    throw new RuleError('ComplyX staff are managed under Administration, Team.')
  }
  return row.user
}

/** Changes a person's name, job title or email. */
export const updateClientPerson = async (
  ctx: ServiceContext,
  clientId: string,
  userId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'user.invite', { clientId })
  const input = parseInput(personSchema, raw)
  await clientPerson(ctx, clientId, userId)
  try {
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(appUser)
        .set({
          displayName: input.displayName,
          jobTitle: input.jobTitle ?? null,
          email: input.email ?? null,
        })
        .where(eq(appUser.id, userId))
      await audit(tx, ctx, {
        tenantId: clientId,
        action: 'person.update',
        entity: 'app_user',
        entityId: userId,
      })
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError({ email: 'Someone already has this email address.' })
    }
    throw error
  }
}

/** Gives a person at the client another role (for example owner of a second department). */
export const addClientRole = async (
  ctx: ServiceContext,
  clientId: string,
  userId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'user.invite', { clientId })
  const input = parseInput(roleSchema, raw)
  await clientPerson(ctx, clientId, userId)
  const departmentId = input.role === 'department_owner' ? (input.departmentId ?? null) : null
  await checkDepartment(ctx, clientId, departmentId ?? undefined)
  await ctx.db.transaction(async (tx) => {
    await tx
      .insert(roleAssignment)
      .values({
        userId,
        role: input.role,
        tenantId: clientId,
        departmentId,
        createdBy: ctx.principal.userId,
      })
      .onConflictDoNothing()
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'person.role_add',
      entity: 'app_user',
      entityId: userId,
      detail: { role: input.role, departmentId },
    })
  })
}

/** Removes one role of a person at the client; their last role cannot be removed. */
export const removeClientRole = async (
  ctx: ServiceContext,
  clientId: string,
  assignmentId: string,
): Promise<void> => {
  authorize(ctx.principal, 'user.invite', { clientId })
  await ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(roleAssignment)
      .where(and(eq(roleAssignment.id, assignmentId), eq(roleAssignment.tenantId, clientId)))
    if (!row) throw new NotFoundError('Role')
    if (isFirmRole(row.role as Role)) {
      throw new RuleError('ComplyX staff roles are managed under Administration, Team.')
    }
    const others = await tx
      .select({ id: roleAssignment.id })
      .from(roleAssignment)
      .where(and(eq(roleAssignment.userId, row.userId), ne(roleAssignment.id, assignmentId)))
    if (others.length === 0) {
      throw new RuleError('This is the person’s only role. Switch their login off instead.')
    }
    await tx.delete(roleAssignment).where(eq(roleAssignment.id, assignmentId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'person.role_remove',
      entity: 'app_user',
      entityId: row.userId,
      detail: { role: row.role, departmentId: row.departmentId },
    })
  })
}

/** Lets a person at the client sign in, or gives them a new one-time password. */
export const issueClientLogin = async (
  ctx: ServiceContext,
  clientId: string,
  userId: string,
  raw: unknown,
): Promise<LoginIssued> => {
  authorize(ctx.principal, 'user.invite', { clientId })
  const person = await clientPerson(ctx, clientId, userId)
  const input = parseInput(
    z.object({ username: z.preprocess(blankToUndefined, usernameField.optional()) }),
    raw,
  )
  const username = input.username ?? person.username
  if (!username) throw new ValidationError({ username: 'Choose a username.' })
  return ctx.db.transaction((tx) => loginFor(tx, ctx, userId, username))
}

/** Stops a person at the client from signing in; their assignments stay. */
export const revokeClientLogin = async (
  ctx: ServiceContext,
  clientId: string,
  userId: string,
): Promise<void> => {
  authorize(ctx.principal, 'user.invite', { clientId })
  await clientPerson(ctx, clientId, userId)
  await ctx.db.transaction((tx) => revokeLogin(tx, { userId, actorUserId: ctx.principal.userId }))
}

const staffSchema = personSchema.extend({
  role: z.enum(FIRM_ROLES, { error: 'Choose a role.' }),
  username: usernameField,
})

/** Adds a member of the ComplyX team (firm-wide role) with a login. */
export const createStaff = async (
  ctx: ServiceContext,
  raw: unknown,
): Promise<{ userId: string; login: LoginIssued }> => {
  authorize(ctx.principal, 'platform.admin')
  const input = parseInput(staffSchema, raw)
  try {
    return await ctx.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(appUser)
        .values({
          displayName: input.displayName,
          jobTitle: input.jobTitle ?? null,
          email: input.email ?? null,
          kind: 'firm',
          status: 'active',
          createdBy: ctx.principal.userId,
        })
        .returning({ id: appUser.id })
      const userId = created?.id ?? ''
      await tx
        .insert(roleAssignment)
        .values({ userId, role: input.role, createdBy: ctx.principal.userId })
      const login = await loginFor(tx, ctx, userId, input.username)
      await audit(tx, ctx, {
        tenantId: null,
        action: 'staff.create',
        entity: 'app_user',
        entityId: userId,
        detail: { role: input.role },
      })
      return { userId, login }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError({ email: 'Someone already has this email address.' })
    }
    throw error
  }
}

const staffMember = async (ctx: ServiceContext, userId: string) => {
  const [user] = await ctx.db.select().from(appUser).where(eq(appUser.id, userId))
  if (!user || user.kind !== 'firm') throw new NotFoundError('Team member')
  return user
}

/** Admins at the firm level: at least one must keep a working login. */
const lastAdmin = async (ctx: ServiceContext, userId: string) => {
  const others = await ctx.db
    .select({ id: roleAssignment.id })
    .from(roleAssignment)
    .innerJoin(appUser, eq(appUser.id, roleAssignment.userId))
    .where(
      and(
        eq(roleAssignment.role, 'firm_admin'),
        isNull(roleAssignment.tenantId),
        ne(roleAssignment.userId, userId),
        eq(appUser.loginEnabled, true),
        ne(appUser.status, 'disabled'),
      ),
    )
  return others.length === 0
}

/**
 * Changes a team member's firm-wide role, for example an Auditor to a Senior auditor, who can then
 * add people at clients. DUATF keeps at least one administrator who can sign in.
 */
export const setStaffRole = async (ctx: ServiceContext, userId: string, raw: unknown) => {
  authorize(ctx.principal, 'platform.admin')
  const { role } = parseInput(
    z.object({ role: z.enum(FIRM_ROLES, { error: 'Choose a role.' }) }),
    raw,
  )
  await staffMember(ctx, userId)
  const current = await ctx.db
    .select({ role: roleAssignment.role })
    .from(roleAssignment)
    .where(and(eq(roleAssignment.userId, userId), isNull(roleAssignment.tenantId)))
  if (current.length === 1 && current[0]?.role === role) return
  if (
    role !== 'firm_admin' &&
    current.some((row) => row.role === 'firm_admin') &&
    (await lastAdmin(ctx, userId))
  ) {
    throw new RuleError('DUATF needs at least one administrator who can sign in.')
  }
  await ctx.db.transaction(async (tx) => {
    await tx
      .delete(roleAssignment)
      .where(and(eq(roleAssignment.userId, userId), isNull(roleAssignment.tenantId)))
    await tx.insert(roleAssignment).values({ userId, role, createdBy: ctx.principal.userId })
    await audit(tx, ctx, {
      tenantId: null,
      action: 'staff.role',
      entity: 'app_user',
      entityId: userId,
      detail: { from: current.map((row) => row.role), to: role },
    })
  })
}

/** Gives a team member a new one-time password. */
export const issueStaffLogin = async (ctx: ServiceContext, userId: string) => {
  authorize(ctx.principal, 'platform.admin')
  const user = await staffMember(ctx, userId)
  if (!user.username) throw new ValidationError({ username: 'This team member has no username.' })
  const username = user.username
  return ctx.db.transaction((tx) => loginFor(tx, ctx, userId, username))
}

/** Stops a team member from signing in. The last administrator keeps their login. */
export const revokeStaffLogin = async (ctx: ServiceContext, userId: string) => {
  authorize(ctx.principal, 'platform.admin')
  await staffMember(ctx, userId)
  if (userId === ctx.principal.userId) throw new RuleError('You cannot switch off your own login.')
  const roles = await ctx.db
    .select({ role: roleAssignment.role })
    .from(roleAssignment)
    .where(and(eq(roleAssignment.userId, userId), isNull(roleAssignment.tenantId)))
  if (roles.some((row) => row.role === 'firm_admin') && (await lastAdmin(ctx, userId))) {
    throw new RuleError('DUATF needs at least one administrator who can sign in.')
  }
  await ctx.db.transaction((tx) => revokeLogin(tx, { userId, actorUserId: ctx.principal.userId }))
}
