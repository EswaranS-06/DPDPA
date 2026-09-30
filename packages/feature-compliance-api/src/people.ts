import { authorize, can, CLIENT_ROLES, FIRM_ROLES, isFirmRole, type Role } from '@duatf/core-access'
import {
  and,
  appUser,
  asc,
  department,
  eq,
  inArray,
  isNull,
  ne,
  roleAssignment,
  tenant,
  type Executor,
} from '@duatf/platform-db'
import { generateTemporaryPassword, revokeUserSessions } from '@duatf/platform-identity'
import { z } from 'zod'
import { audit, firmWide, inClient, type ServiceContext } from './context'
import {
  NotFoundError,
  parseInput,
  requiredEmail,
  requiredText,
  RuleError,
  ValidationError,
} from './errors'

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const clientInviteSchema = z
  .object({
    email: requiredEmail('Email'),
    displayName: requiredText('Name', 120),
    role: z.enum(CLIENT_ROLES, { error: 'Choose a role.' }),
    departmentId: z.preprocess(blankToUndefined, z.uuid('Choose a department.').optional()),
  })
  .refine((value) => value.role !== 'department_owner' || value.departmentId, {
    path: ['departmentId'],
    message: 'Choose the department this person answers for.',
  })

const staffInviteSchema = z.object({
  email: requiredEmail('Email'),
  displayName: requiredText('Name', 120),
  role: z.enum(FIRM_ROLES, { error: 'Choose a role.' }),
  clientId: z.preprocess(blankToUndefined, z.uuid().optional()),
})

const staffAssignSchema = z.object({
  userId: z.uuid('Choose a person.'),
  role: z.enum(['lead_auditor', 'auditor'], { error: 'Choose a role.' }),
})

export type InviteResult = {
  userId: string
  /** True when a new account was created. */
  created: boolean
  /** One-time password for a new account; shown once, never stored by DUATF. */
  temporaryPassword: string | null
}

const findUserByEmail = async (db: Executor, email: string) => {
  const [row] = await db.select().from(appUser).where(eq(appUser.email, email))
  return row
}

/**
 * Finds or creates the person, then grants the role. A repeat invitation reuses the account
 * and the existing role, so nothing is duplicated.
 */
const grant = async (
  ctx: ServiceContext,
  input: {
    email: string
    displayName: string
    kind: 'firm' | 'client'
    role: Role
    clientId: string | null
    departmentId: string | null
  },
): Promise<InviteResult> => {
  const existing = await findUserByEmail(ctx.db, input.email)
  if (existing && existing.kind !== input.kind) {
    throw new ValidationError({
      email:
        existing.kind === 'firm'
          ? 'This person is Xyberu staff. Assign them to the client from Staff instead.'
          : 'This person is a client user and cannot be given a Xyberu staff role.',
    })
  }
  if (existing?.status === 'disabled') {
    throw new ValidationError({ email: 'This account is disabled. Enable it first.' })
  }
  let temporaryPassword: string | null = null
  let keycloakId = existing?.keycloakId ?? null
  if (!existing) {
    temporaryPassword = generateTemporaryPassword()
    keycloakId = await ctx.provisioner.provision({
      email: input.email,
      displayName: input.displayName,
      temporaryPassword,
    })
  }
  return ctx.db.transaction(async (tx) => {
    let userId = existing?.id
    if (!userId) {
      const [created] = await tx
        .insert(appUser)
        .values({
          email: input.email,
          displayName: input.displayName,
          kind: input.kind,
          keycloakId,
          createdBy: ctx.principal.userId,
        })
        .onConflictDoNothing({ target: appUser.email })
        .returning({ id: appUser.id })
      userId = created?.id ?? (await findUserByEmail(tx, input.email))?.id
    }
    if (!userId) throw new Error('The user could not be created.')
    const granted = await tx
      .insert(roleAssignment)
      .values({
        userId,
        role: input.role,
        tenantId: input.clientId,
        departmentId: input.departmentId,
        createdBy: ctx.principal.userId,
      })
      .onConflictDoNothing()
      .returning({ id: roleAssignment.id })
    await audit(tx, ctx, {
      tenantId: input.clientId,
      action: existing ? 'user.grant' : 'user.invite',
      entity: 'app_user',
      entityId: userId,
      detail: {
        email: input.email,
        role: input.role,
        departmentId: input.departmentId,
        alreadyHeld: granted.length === 0,
      },
    })
    return { userId, created: !existing, temporaryPassword }
  })
}

/** Invites a person from the client organisation with one client role. */
export const inviteClientUser = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<InviteResult> => {
  authorize(ctx.principal, 'user.invite', { clientId })
  const input = parseInput(clientInviteSchema, raw)
  const departmentId = input.role === 'department_owner' ? (input.departmentId ?? null) : null
  if (departmentId) {
    const found = await inClient(ctx, clientId, (tx) =>
      tx
        .select({ id: department.id })
        .from(department)
        .where(and(eq(department.id, departmentId), eq(department.active, true))),
    )
    if (found.length === 0) throw new ValidationError({ departmentId: 'Choose a department.' })
  }
  return grant(ctx, { ...input, kind: 'client', clientId, departmentId })
}

/** Invites Xyberu staff, firm-wide or for one client. Firm administrators only. */
export const inviteFirmStaff = async (ctx: ServiceContext, raw: unknown): Promise<InviteResult> => {
  authorize(ctx.principal, 'platform.admin')
  const input = parseInput(staffInviteSchema, raw)
  if (input.role === 'firm_admin' && input.clientId) {
    throw new ValidationError({ clientId: 'Firm administrators work across all clients.' })
  }
  return grant(ctx, {
    ...input,
    kind: 'firm',
    clientId: input.clientId ?? null,
    departmentId: null,
  })
}

/** Puts a member of Xyberu staff on a client's team. */
export const assignStaff = async (
  ctx: ServiceContext,
  clientId: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'client.assign_staff', { clientId })
  const input = parseInput(staffAssignSchema, raw)
  const [user] = await ctx.db.select().from(appUser).where(eq(appUser.id, input.userId))
  if (!user || user.kind !== 'firm' || user.status === 'disabled') {
    throw new ValidationError({ userId: 'Choose an active member of Xyberu staff.' })
  }
  await ctx.db.transaction(async (tx) => {
    await tx
      .insert(roleAssignment)
      .values({
        userId: user.id,
        role: input.role,
        tenantId: clientId,
        createdBy: ctx.principal.userId,
      })
      .onConflictDoNothing()
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'staff.assign',
      entity: 'app_user',
      entityId: user.id,
      detail: { role: input.role },
    })
  })
}

/** Removes one role. The last firm administrator cannot be removed. */
export const removeAssignment = async (
  ctx: ServiceContext,
  assignmentId: string,
): Promise<void> => {
  const [row] = await ctx.db
    .select({ assignment: roleAssignment, kind: appUser.kind })
    .from(roleAssignment)
    .innerJoin(appUser, eq(appUser.id, roleAssignment.userId))
    .where(eq(roleAssignment.id, assignmentId))
  if (!row) throw new NotFoundError('Role')
  const { assignment } = row
  const clientId = assignment.tenantId
  if (clientId === null) authorize(ctx.principal, 'platform.admin')
  else if (isFirmRole(assignment.role as Role)) {
    authorize(ctx.principal, 'client.assign_staff', { clientId })
  } else authorize(ctx.principal, 'user.invite', { clientId })

  await ctx.db.transaction(async (tx) => {
    if (assignment.role === 'firm_admin' && clientId === null) {
      const others = await tx
        .select({ id: roleAssignment.id })
        .from(roleAssignment)
        .innerJoin(appUser, eq(appUser.id, roleAssignment.userId))
        .where(
          and(
            eq(roleAssignment.role, 'firm_admin'),
            isNull(roleAssignment.tenantId),
            ne(roleAssignment.id, assignmentId),
            ne(appUser.status, 'disabled'),
          ),
        )
      if (others.length === 0) throw new RuleError('DUATF needs at least one firm administrator.')
    }
    await tx.delete(roleAssignment).where(eq(roleAssignment.id, assignmentId))
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'user.revoke',
      entity: 'app_user',
      entityId: assignment.userId,
      detail: { role: assignment.role, departmentId: assignment.departmentId },
    })
  })
}

const peopleColumns = {
  assignmentId: roleAssignment.id,
  role: roleAssignment.role,
  tenantId: roleAssignment.tenantId,
  departmentId: roleAssignment.departmentId,
  userId: appUser.id,
  email: appUser.email,
  displayName: appUser.displayName,
  kind: appUser.kind,
  status: appUser.status,
  lastLoginAt: appUser.lastLoginAt,
}

export type PersonAssignment = {
  assignmentId: string
  role: Role
  clientCode: string | null
  departmentName: string | null
}

export type Person = {
  userId: string
  email: string
  displayName: string
  kind: 'firm' | 'client'
  status: 'invited' | 'active' | 'disabled'
  lastLoginAt: Date | null
  assignments: PersonAssignment[]
}

type PeopleRow = {
  assignmentId: string
  role: string
  tenantId: string | null
  departmentId: string | null
  userId: string
  email: string
  displayName: string
  kind: 'firm' | 'client'
  status: 'invited' | 'active' | 'disabled'
  lastLoginAt: Date | null
}

const groupPeople = (
  rows: PeopleRow[],
  clientCodes: Map<string, string>,
  departmentNames: Map<string, string>,
): Person[] => {
  const people = new Map<string, Person>()
  for (const row of rows) {
    const person = people.get(row.userId) ?? {
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      kind: row.kind,
      status: row.status,
      lastLoginAt: row.lastLoginAt,
      assignments: [],
    }
    person.assignments.push({
      assignmentId: row.assignmentId,
      role: row.role as Role,
      clientCode: row.tenantId ? (clientCodes.get(row.tenantId) ?? null) : null,
      departmentName: row.departmentId ? (departmentNames.get(row.departmentId) ?? null) : null,
    })
    people.set(row.userId, person)
  }
  return [...people.values()].sort((a, b) => a.displayName.localeCompare(b.displayName))
}

/** Everyone with a role on this client: the client's own people and the Xyberu team. */
export const listClientPeople = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const rows = await ctx.db
    .select(peopleColumns)
    .from(roleAssignment)
    .innerJoin(appUser, eq(appUser.id, roleAssignment.userId))
    .where(eq(roleAssignment.tenantId, clientId))
    .orderBy(asc(appUser.displayName))
  const departments = await inClient(ctx, clientId, (tx) =>
    tx.select({ id: department.id, name: department.name }).from(department),
  )
  const people = groupPeople(rows, new Map(), new Map(departments.map((row) => [row.id, row.name])))
  return {
    clientUsers: people.filter((person) => person.kind === 'client'),
    firmTeam: people.filter((person) => person.kind === 'firm'),
  }
}

/** All Xyberu staff with their firm-wide and per-client roles. Firm administrators only. */
export const listFirmStaff = async (ctx: ServiceContext) => {
  authorize(ctx.principal, 'platform.admin')
  const rows = await ctx.db
    .select(peopleColumns)
    .from(appUser)
    .innerJoin(roleAssignment, eq(roleAssignment.userId, appUser.id))
    .where(eq(appUser.kind, 'firm'))
    .orderBy(asc(appUser.displayName))
  const tenantIds = [...new Set(rows.map((row) => row.tenantId).filter((id) => id !== null))]
  const clients = tenantIds.length
    ? await firmWide(ctx, (tx) =>
        tx
          .select({ id: tenant.id, code: tenant.code })
          .from(tenant)
          .where(inArray(tenant.id, tenantIds)),
      )
    : []
  return groupPeople(rows, new Map(clients.map((row) => [row.id, row.code])), new Map())
}

/** Whether the acting user may manage this person's account (reset, disable). */
const mayManage = async (ctx: ServiceContext, userId: string) => {
  const [user] = await ctx.db.select().from(appUser).where(eq(appUser.id, userId))
  if (!user) throw new NotFoundError('Person')
  if (user.kind === 'firm') {
    authorize(ctx.principal, 'platform.admin')
    return user
  }
  const clients = await ctx.db
    .select({ tenantId: roleAssignment.tenantId })
    .from(roleAssignment)
    .where(eq(roleAssignment.userId, userId))
  const allowed = clients.some(
    (row) => row.tenantId !== null && can(ctx.principal, 'user.invite', { clientId: row.tenantId }),
  )
  if (!allowed) throw new NotFoundError('Person')
  return user
}

/** Issues a new one-time password; Keycloak asks for a new password and authenticator again. */
export const resetTemporaryPassword = async (
  ctx: ServiceContext,
  userId: string,
): Promise<string> => {
  const user = await mayManage(ctx, userId)
  if (user.status === 'disabled') throw new RuleError('Enable the account first.')
  const temporaryPassword = generateTemporaryPassword()
  const keycloakId = await ctx.provisioner.provision({
    email: user.email,
    displayName: user.displayName,
    temporaryPassword,
  })
  await ctx.db.transaction(async (tx) => {
    await tx.update(appUser).set({ keycloakId }).where(eq(appUser.id, user.id))
    await revokeUserSessions(tx, user.id)
    await audit(tx, ctx, {
      tenantId: null,
      action: 'user.reset_password',
      entity: 'app_user',
      entityId: user.id,
    })
  })
  return temporaryPassword
}

/** Disables or re-enables sign-in. Disabling ends the person's sessions at once. */
export const setUserEnabled = async (
  ctx: ServiceContext,
  userId: string,
  enabled: boolean,
): Promise<void> => {
  if (userId === ctx.principal.userId) throw new RuleError('You cannot disable your own account.')
  const user = await mayManage(ctx, userId)
  if (user.keycloakId) await ctx.provisioner.setEnabled(user.keycloakId, enabled)
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(appUser)
      .set({ status: enabled ? (user.lastLoginAt ? 'active' : 'invited') : 'disabled' })
      .where(eq(appUser.id, user.id))
    if (!enabled) await revokeUserSessions(tx, user.id)
    await audit(tx, ctx, {
      tenantId: null,
      action: enabled ? 'user.enable' : 'user.disable',
      entity: 'app_user',
      entityId: user.id,
    })
  })
}
