import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { department } from './compliance'
import { tenant } from './platform'

export type UserKind = 'firm' | 'client'
export const USER_STATUSES = ['invited', 'active', 'disabled'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

/**
 * A person: ComplyX staff, or someone at a client (such as "IT Head") whom questions, evidence
 * requests, actions and controls are assigned to. People sign in only when their login is
 * enabled: a username and a password hashed by scrypt, locked after repeated failures.
 */
export const appUser = pgTable('app_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** The sign-in name; null for people without a login. */
  username: text('username').unique(),
  /** A contact address, optional. */
  email: text('email').unique(),
  jobTitle: text('job_title'),
  loginEnabled: boolean('login_enabled').notNull().default(false),
  passwordHash: text('password_hash'),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  displayName: text('display_name').notNull(),
  kind: text('kind').$type<UserKind>().notNull(),
  status: text('status').$type<UserStatus>().notNull().default('invited'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
})

/** A role granted firm-wide (tenant null), for one client, or for one department of a client. */
export const roleAssignment = pgTable(
  'role_assignment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    tenantId: uuid('tenant_id').references(() => tenant.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').references(() => department.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('role_assignment_unique')
      .on(table.userId, table.role, table.tenantId, table.departmentId)
      .nullsNotDistinct(),
  ],
)

/** Server-side sessions. Only the SHA-256 of the cookie token is stored. */
export const userSession = pgTable('user_session', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUser.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
})

/** Append-only, hash-chained record of every change. */
export const auditEvent = pgTable('audit_event', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  actorUserId: uuid('actor_user_id'),
  tenantId: uuid('tenant_id'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  detail: jsonb('detail').$type<Record<string, unknown>>().notNull(),
  prevHash: text('prev_hash').notNull(),
  hash: text('hash').notNull(),
})
