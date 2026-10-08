import { sql } from 'drizzle-orm'
import {
  boolean,
  bigserial,
  check,
  date,
  index,
  jsonb,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
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

/**
 * The scored meaning of an answer. A question's options say which one each choice stands for:
 * Yes, maturity level 3 or 4 and most choices mean "yes"; "recorded" is an informational answer.
 */
export const ANSWERS = [
  'not_assessed',
  'yes',
  'partial',
  'no',
  'not_applicable',
  'recorded',
] as const
export type Answer = (typeof ANSWERS)[number]

export const COMPLIANCE_STATES = [
  'pending',
  'compliant',
  'potential_gap',
  'gap',
  'excluded',
  'informational',
] as const
export type ComplianceState = (typeof COMPLIANCE_STATES)[number]

export const REVIEW_STATES = ['not_reviewed', 'accepted', 'returned'] as const
export type ReviewState = (typeof REVIEW_STATES)[number]

/** What was actually chosen or written: option values (one for single-choice types) or free text. */
export type ItemResponse = { values: string[] } | { text: string }

/**
 * One question of an assessment for one department: the response, its scored meaning and the
 * self-check. The same question can be given to several departments, each with its own item.
 */
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
    /** The person at the client the question is assigned to (sees it, uploads evidence for it). */
    assigneeUserId: uuid('assignee_user_id'),
    answer: text('answer').$type<Answer>().notNull().default('not_assessed'),
    // The gap rule, enforced by the database: Yes compliant, Partial potential gap, No gap,
    // Not applicable excluded, an informational answer recorded, not yet assessed pending.
    complianceState: text('compliance_state')
      .$type<ComplianceState>()
      .notNull()
      .generatedAlwaysAs(
        sql`case answer when 'yes' then 'compliant' when 'partial' then 'potential_gap' when 'no' then 'gap' when 'not_applicable' then 'excluded' when 'recorded' then 'informational' else 'pending' end`,
      ),
    response: jsonb('response').$type<ItemResponse>(),
    naReason: text('na_reason'),
    /** Set when Not applicable was decided by another question's answer (self-reconciliation). */
    autoNaFrom: text('auto_na_from'),
    comment: text('comment'),
    answeredBy: uuid('answered_by'),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    reviewState: text('review_state').$type<ReviewState>().notNull().default('not_reviewed'),
    reviewNote: text('review_note'),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    unique('assessment_item_question_department')
      .on(table.assessmentId, table.questionCode, table.departmentId)
      .nullsNotDistinct(),
    index('assessment_item_department').on(table.departmentId),
    check(
      'assessment_item_na_reason',
      sql`${table.answer} <> 'not_applicable' or length(trim(coalesce(${table.naReason}, ''))) > 0`,
    ),
  ],
)

export const EVIDENCE_STATUSES = ['pending_review', 'accepted', 'rejected'] as const
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number]

/** A file the client or auditor supplied, stored in object storage with its SHA-256. */
export const evidence = pgTable(
  'evidence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    fileName: text('file_name').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sha256: text('sha256').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    departmentId: uuid('department_id').references(() => department.id, { onDelete: 'set null' }),
    validUntil: date('valid_until', { mode: 'string' }),
    status: text('status').$type<EvidenceStatus>().notNull().default('pending_review'),
    uploadedBy: uuid('uploaded_by').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNote: text('review_note'),
  },
  (table) => [unique('evidence_tenant_code').on(table.tenantId, table.code)],
)

/** Where a piece of evidence is used: assessment items now, findings and actions later. */
export const evidenceLink = pgTable(
  'evidence_link',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    evidenceId: uuid('evidence_id')
      .notNull()
      .references(() => evidence.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => assessmentItem.id, { onDelete: 'cascade' }),
    actionId: uuid('action_id').references((): AnyPgColumn => remediationAction.id, {
      onDelete: 'cascade',
    }),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('evidence_link_item').on(table.evidenceId, table.itemId),
    unique('evidence_link_action').on(table.evidenceId, table.actionId),
    index('evidence_link_item_idx').on(table.itemId),
    index('evidence_link_action_idx').on(table.actionId),
    check('evidence_link_target', sql`num_nonnulls(${table.itemId}, ${table.actionId}) = 1`),
  ],
)

export const EVIDENCE_REQUEST_STATUSES = ['requested', 'received', 'accepted', 'cancelled'] as const
export type EvidenceRequestStatus = (typeof EVIDENCE_REQUEST_STATUSES)[number]

/**
 * A piece of evidence the auditor asks someone for, against one question of a department:
 * requested, received when a file is attached to it, accepted with that file.
 */
export const evidenceRequest = pgTable(
  'evidence_request',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => assessmentItem.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    note: text('note'),
    assigneeUserId: uuid('assignee_user_id'),
    dueDate: date('due_date', { mode: 'string' }),
    status: text('status').$type<EvidenceRequestStatus>().notNull().default('requested'),
    evidenceId: uuid('evidence_id').references(() => evidence.id, { onDelete: 'set null' }),
    requestedBy: uuid('requested_by'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  },
  (table) => [
    index('evidence_request_item').on(table.itemId),
    index('evidence_request_assignee').on(table.assigneeUserId),
  ],
)

/** Who owns each knowledge-base control at a client. */
export const controlOwner = pgTable(
  'control_owner',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    controlCode: text('control_code').notNull(),
    userId: uuid('user_id').notNull(),
    assignedBy: uuid('assigned_by'),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ name: 'control_owner_pk', columns: [table.tenantId, table.controlCode] }),
  ],
)

export const FINDING_STATUSES = ['open', 'closed'] as const
export type FindingStatus = (typeof FINDING_STATUSES)[number]
export const GAP_TYPES = ['gap', 'potential_gap'] as const
export type GapType = (typeof GAP_TYPES)[number]

/**
 * A gap raised by a No or Partial answer. Each assessment item has at most one finding; a later
 * Yes closes it and a later No reopens the same finding, so its history stays in one place.
 */
export const finding = pgTable(
  'finding',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessment.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => assessmentItem.id, { onDelete: 'cascade' }),
    questionCode: text('question_code').notNull(),
    controlCode: text('control_code').notNull(),
    domainCode: text('domain_code').notNull(),
    title: text('title').notNull(),
    gapType: text('gap_type').$type<GapType>().notNull(),
    status: text('status').$type<FindingStatus>().notNull().default('open'),
    recommendation: text('recommendation').notNull(),
    references: text('references')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedReason: text('closed_reason'),
  },
  (table) => [
    unique('finding_tenant_code').on(table.tenantId, table.code),
    uniqueIndex('finding_item').on(table.itemId),
  ],
)

/** Every change to a finding, oldest first. */
export const findingEvent = pgTable(
  'finding_event',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    findingId: uuid('finding_id')
      .notNull()
      .references(() => finding.id, { onDelete: 'cascade' }),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id'),
    kind: text('kind').notNull(),
    detail: jsonb('detail')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [index('finding_event_finding').on(table.findingId)],
)

/** Score bands for the risk register (firm-wide settings, editable by a firm administrator). */
export const riskBand = pgTable('risk_band', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  minScore: integer('min_score').notNull(),
  maxScore: integer('max_score').notNull(),
  tone: text('tone').notNull(),
  seq: integer('seq').notNull(),
})

export const RISK_TREATMENTS = ['mitigate', 'accept', 'transfer', 'avoid'] as const
export type RiskTreatment = (typeof RISK_TREATMENTS)[number]
export const RISK_STATUSES = ['open', 'treated', 'accepted', 'closed'] as const
export type RiskStatus = (typeof RISK_STATUSES)[number]

/** The risk register: likelihood x impact on 1-5 scales, usually one risk per finding. */
export const risk = pgTable(
  'risk',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    findingId: uuid('finding_id').references(() => finding.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    likelihood: integer('likelihood').notNull(),
    impact: integer('impact').notNull(),
    score: integer('score')
      .notNull()
      .generatedAlwaysAs(sql`likelihood * impact`),
    treatment: text('treatment').$type<RiskTreatment>().notNull().default('mitigate'),
    status: text('status').$type<RiskStatus>().notNull().default('open'),
    ownerName: text('owner_name'),
    acceptedBy: uuid('accepted_by'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptanceNote: text('acceptance_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('risk_tenant_code').on(table.tenantId, table.code),
    uniqueIndex('risk_finding').on(table.findingId),
    check('risk_likelihood_range', sql`${table.likelihood} between 1 and 5`),
    check('risk_impact_range', sql`${table.impact} between 1 and 5`),
  ],
)

export const ACTION_STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'pending_evidence',
  'under_review',
  'rejected',
  'remediated',
  'closed',
  'accepted_risk',
] as const
export type ActionStatus = (typeof ACTION_STATUSES)[number]

/** A remediation action for a finding, tracked through the workflow in ACTION_FLOW. */
export const remediationAction = pgTable(
  'remediation_action',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    findingId: uuid('finding_id')
      .notNull()
      .references(() => finding.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    ownerUserId: uuid('owner_user_id'),
    /** The person at the client who carries the action out (free text in the self edition). */
    ownerName: text('owner_name'),
    departmentId: uuid('department_id').references(() => department.id, { onDelete: 'set null' }),
    dueDate: date('due_date', { mode: 'string' }),
    status: text('status').$type<ActionStatus>().notNull().default('open'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    verifiedBy: uuid('verified_by'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => [
    unique('remediation_action_tenant_code').on(table.tenantId, table.code),
    index('remediation_action_finding').on(table.findingId),
  ],
)

/** Every status change of an action, with who made it and why. */
export const actionEvent = pgTable(
  'action_event',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    actionId: uuid('action_id')
      .notNull()
      .references(() => remediationAction.id, { onDelete: 'cascade' }),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id'),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    note: text('note'),
  },
  (table) => [index('action_event_action').on(table.actionId)],
)

const textList = (name: string) =>
  text(name)
    .array()
    .notNull()
    .default(sql`'{}'::text[]`)

/**
 * A data element a department handles: the department's answer to "what personal data do you
 * collect". Knowledge-base elements keep their code; ones the department names itself have none.
 */
export const departmentDataElement = pgTable(
  'department_data_element',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => department.id, { onDelete: 'cascade' }),
    elementCode: text('element_code'),
    title: text('title').notNull(),
    category: text('category').notNull(),
    level: text('level').notNull(),
    /** A DATA_SOURCES code, or dept:<code> for another department. */
    source: text('source'),
    storage: text('storage'),
    security: text('security'),
    access: text('access'),
    seq: integer('seq').notNull().default(0),
  },
  (table) => [
    unique('department_data_element_title').on(table.departmentId, table.title),
    index('department_data_element_department').on(table.departmentId),
    check('department_data_element_level', sql`${table.level} in ('L1', 'L2', 'L3', 'L4')`),
  ],
)

/**
 * What a department did with its personal data, from when the RoPA had one row per department.
 * Retired by process-focused RoPAs (ADR-0008): migration 0021 moved every profile into a
 * processing activity. Nothing writes to it any more.
 */
export const departmentDataProfile = pgTable('department_data_profile', {
  departmentId: uuid('department_id')
    .primaryKey()
    .references(() => department.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  purposes: text('purposes'),
  lawfulBases: textList('lawful_bases'),
  systems: textList('systems'),
  /** Codes of the departments it passes data to. */
  sharedWith: textList('shared_with'),
  /** Vendors, processors, regulators and others outside the organisation. */
  recipients: textList('recipients'),
  transfersAbroad: text('transfers_abroad').notNull().default('unknown'),
  countries: text('countries'),
  retention: text('retention'),
  security: text('security'),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * One row of the client's record of processing (RoPA): a processing activity owned by a
 * department, usually started from a catalogue process (ADR-0008). Answers from the knowledge
 * base's RoPA lists are stored as their exact answer text; anything else is kept as typed.
 */
export const processingActivity = pgTable(
  'processing_activity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => department.id, { onDelete: 'cascade' }),
    /** PA-001 within the client. */
    ref: integer('ref').notNull(),
    /** The catalogue process it was started from. */
    templateCode: text('template_code'),
    name: text('name').notNull(),
    purpose: text('purpose'),
    lawfulBases: textList('lawful_bases'),
    /** Another law that requires or permits the processing, e.g. "PML Act". */
    lawReference: text('law_reference'),
    principals: textList('principals'),
    sources: textList('sources'),
    systems: textList('systems'),
    /** Codes of the departments that receive the data. */
    internalRecipients: textList('internal_recipients'),
    processors: textList('processors'),
    recipients: textList('recipients'),
    retention: text('retention'),
    deletion: text('deletion'),
    security: textList('security'),
    transfersAbroad: text('transfers_abroad').notNull().default('unknown'),
    countries: text('countries'),
    consentStatus: text('consent_status'),
    owner: text('owner'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('processing_activity_ref').on(table.tenantId, table.ref),
    unique('processing_activity_name').on(table.departmentId, table.name),
    index('processing_activity_department').on(table.departmentId),
    check(
      'processing_activity_transfers',
      sql`${table.transfersAbroad} in ('no', 'yes', 'unknown')`,
    ),
  ],
)

/** The personal data of a processing activity. */
export const processingActivityElement = pgTable(
  'processing_activity_element',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => processingActivity.id, { onDelete: 'cascade' }),
    elementCode: text('element_code'),
    title: text('title').notNull(),
    category: text('category').notNull(),
    level: text('level').notNull(),
    seq: integer('seq').notNull().default(0),
  },
  (table) => [
    unique('processing_activity_element_title').on(table.activityId, table.title),
    index('processing_activity_element_activity').on(table.activityId),
    check('processing_activity_element_level', sql`${table.level} in ('L1', 'L2', 'L3', 'L4')`),
  ],
)
