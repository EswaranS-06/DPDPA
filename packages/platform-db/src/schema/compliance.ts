import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { frameworkRelease } from './framework'
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

export const ASSESSMENT_STATUSES = ['draft', 'in_progress', 'in_review', 'completed'] as const
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number]

/** One assessment cycle of a client, pinned to the framework release it was started on. */
export const assessment = pgTable(
  'assessment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    releaseId: uuid('release_id')
      .notNull()
      .references(() => frameworkRelease.id),
    status: text('status').$type<AssessmentStatus>().notNull().default('draft'),
    periodStart: date('period_start', { mode: 'string' }),
    periodEnd: date('period_end', { mode: 'string' }),
    dueDate: date('due_date', { mode: 'string' }),
    previousAssessmentId: uuid('previous_assessment_id'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [unique('assessment_tenant_code').on(table.tenantId, table.code)],
)

export const ANSWERS = ['not_assessed', 'yes', 'partial', 'no', 'not_applicable'] as const
export type Answer = (typeof ANSWERS)[number]

export const COMPLIANCE_STATES = [
  'pending',
  'compliant',
  'potential_gap',
  'gap',
  'excluded',
] as const
export type ComplianceState = (typeof COMPLIANCE_STATES)[number]

export const REVIEW_STATES = ['not_reviewed', 'accepted', 'returned'] as const
export type ReviewState = (typeof REVIEW_STATES)[number]

/** One question of an assessment: who answers it, the answer and the review. */
export const assessmentItem = pgTable(
  'assessment_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessment.id, { onDelete: 'cascade' }),
    questionCode: text('question_code').notNull(),
    controlCode: text('control_code').notNull(),
    domainCode: text('domain_code').notNull(),
    seq: integer('seq').notNull(),
    departmentId: uuid('department_id').references(() => department.id, { onDelete: 'set null' }),
    answer: text('answer').$type<Answer>().notNull().default('not_assessed'),
    // The gap rule, enforced by the database: Yes compliant, Partial potential gap, No gap,
    // Not applicable excluded, not yet assessed pending.
    complianceState: text('compliance_state')
      .$type<ComplianceState>()
      .notNull()
      .generatedAlwaysAs(
        sql`case answer when 'yes' then 'compliant' when 'partial' then 'potential_gap' when 'no' then 'gap' when 'not_applicable' then 'excluded' else 'pending' end`,
      ),
    naReason: text('na_reason'),
    comment: text('comment'),
    answeredBy: uuid('answered_by'),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    reviewState: text('review_state').$type<ReviewState>().notNull().default('not_reviewed'),
    reviewNote: text('review_note'),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    unique('assessment_item_question').on(table.assessmentId, table.questionCode),
    index('assessment_item_department').on(table.departmentId),
    check(
      'assessment_item_na_reason',
      sql`${table.answer} <> 'not_applicable' or length(trim(coalesce(${table.naReason}, ''))) > 0`,
    ),
  ],
)
