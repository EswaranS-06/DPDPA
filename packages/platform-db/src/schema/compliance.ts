import { boolean, date, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { tenant } from './platform'

// Client-side records of the compliance engine. Every table carries tenant_id (the client) and
// is protected by row-level security through tenant_visible() (custom migration).

export const ORGANISATION_TYPES = [
  'private_limited',
  'public_limited',
  'llp',
  'partnership',
  'sole_proprietorship',
  'government',
  'psu',
  'trust_society_ngo',
  'foreign_company',
  'other',
] as const
export type OrganisationType = (typeof ORGANISATION_TYPES)[number]

export const CLIENT_STATUSES = ['prospect', 'onboarding', 'active', 'on_hold', 'closed'] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const APPLICABILITY_STATES = ['applicable', 'not_applicable', 'under_review'] as const
export type ApplicabilityState = (typeof APPLICABILITY_STATES)[number]

/** One client organisation. The tenant row holds its code (client ID) and name. */
export const clientProfile = pgTable('client_profile', {
  tenantId: uuid('tenant_id')
    .primaryKey()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  legalName: text('legal_name').notNull(),
  industry: text('industry').notNull(),
  sectorCode: text('sector_code'),
  organisationType: text('organisation_type').$type<OrganisationType>().notNull(),
  website: text('website'),
  country: text('country').notNull().default('India'),
  state: text('state'),
  address: text('address'),
  employeeCount: integer('employee_count'),
  dataPrincipalCount: integer('data_principal_count'),
  dpoName: text('dpo_name'),
  dpoEmail: text('dpo_email'),
  dpoPhone: text('dpo_phone'),
  primaryContactName: text('primary_contact_name').notNull(),
  primaryContactEmail: text('primary_contact_email').notNull(),
  primaryContactPhone: text('primary_contact_phone'),
  assessmentPeriodStart: date('assessment_period_start', { mode: 'string' }),
  assessmentPeriodEnd: date('assessment_period_end', { mode: 'string' }),
  applicability: text('applicability')
    .$type<ApplicabilityState>()
    .notNull()
    .default('under_review'),
  applicabilityNote: text('applicability_note'),
  status: text('status').$type<ClientStatus>().notNull().default('onboarding'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** A department of a client; its full code is DEP-<client>-<code>. */
export const department = pgTable(
  'department',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    headName: text('head_name'),
    headEmail: text('head_email'),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('department_tenant_code').on(table.tenantId, table.code)],
)
