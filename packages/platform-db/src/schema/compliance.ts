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
  real,
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
  /** Days within which the client answers Data Principals' requests, as it publishes. */
  rightsResponseDays: integer('rights_response_days'),
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

export const SIGNOFF_STATUSES = ['requested', 'approved', 'changes_requested', 'withdrawn'] as const
export type SignoffStatus = (typeof SIGNOFF_STATUSES)[number]

/** What the cycle looked like when it was signed off: the quality check and the posture. */
export type SignoffSnapshot = {
  errors: number
  warnings: number
  notes: number
  answered: number
  total: number
  compliancePct: number | null
}

/**
 * A request to sign a cycle off, and its decision. The cycle is "in review" while a request is
 * open; the named approver approves it (the cycle completes) or asks for changes (it reopens).
 * A senior auditor completing their own cycle is recorded as a request they approved at once.
 */
export const assessmentSignoff = pgTable(
  'assessment_signoff',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessment.id, { onDelete: 'cascade' }),
    requestedBy: uuid('requested_by').notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    approverUserId: uuid('approver_user_id').notNull(),
    dueDate: date('due_date', { mode: 'string' }),
    note: text('note'),
    status: text('status').$type<SignoffStatus>().notNull().default('requested'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionNote: text('decision_note'),
    /** The approver confirmed they had read the open errors of the quality check. */
    acknowledged: boolean('acknowledged').notNull().default(false),
    snapshot: jsonb('snapshot').$type<SignoffSnapshot>(),
  },
  (table) => [
    index('assessment_signoff_assessment').on(table.assessmentId),
    index('assessment_signoff_approver').on(table.approverUserId),
  ],
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
    /** The acceptance holds until this date; after it the client renews it or the risk reopens. */
    acceptedUntil: date('accepted_until', { mode: 'string' }),
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
    /** The roadmap phase: 1 now, 2 next, 3 later; empty while the risk rating's suggestion stands. */
    phase: integer('phase'),
    /** The effort the action needs, in days (half days allowed). */
    effortDays: real('effort_days'),
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
    check('remediation_action_phase', sql`${table.phase} between 1 and 3`),
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

// --- Registers (ADR-0009): processors, breaches, rights requests and DPIAs -----------------------

export const PROCESSOR_KINDS = ['processor', 'sub_processor'] as const
export type ProcessorKind = (typeof PROCESSOR_KINDS)[number]
export const CONTRACT_ANSWERS = ['yes', 'no', 'unknown'] as const
export type ContractAnswer = (typeof CONTRACT_ANSWERS)[number]
export const PROCESSOR_LOCATIONS = ['india', 'outside', 'unknown'] as const
export type ProcessorLocation = (typeof PROCESSOR_LOCATIONS)[number]
export const PROCESSOR_RATINGS = ['low', 'medium', 'high'] as const
export type ProcessorRating = (typeof PROCESSOR_RATINGS)[number]

/**
 * A Data Processor the client uses (s.8(2)): the vendor, its contract and when it was last
 * assessed. It is matched to the RoPA by name: an activity that names it, or one of its other
 * spellings, as a processor is one of its activities.
 */
export const processor = pgTable(
  'processor',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    /** Other spellings the RoPA uses for the same vendor. */
    aliases: textList('aliases'),
    kind: text('kind').$type<ProcessorKind>().notNull().default('processor'),
    service: text('service'),
    location: text('location').$type<ProcessorLocation>().notNull().default('unknown'),
    countries: text('countries'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    contract: text('contract').$type<ContractAnswer>().notNull().default('unknown'),
    contractStart: date('contract_start', { mode: 'string' }),
    contractEnd: date('contract_end', { mode: 'string' }),
    contractEvidenceId: uuid('contract_evidence_id').references(() => evidence.id, {
      onDelete: 'set null',
    }),
    /** Codes of the DPDP terms the contract covers (CONTRACT_TERMS in the service). */
    terms: textList('terms'),
    rating: text('rating').$type<ProcessorRating>(),
    lastAssessedOn: date('last_assessed_on', { mode: 'string' }),
    nextReviewOn: date('next_review_on', { mode: 'string' }),
    notes: text('notes'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('processor_tenant_code').on(table.tenantId, table.code),
    uniqueIndex('processor_tenant_name').on(table.tenantId, sql`lower(${table.name})`),
    check(
      'processor_contract_dates',
      sql`${table.contractStart} is null or ${table.contractEnd} is null or ${table.contractEnd} >= ${table.contractStart}`,
    ),
  ],
)

export const BREACH_STATUSES = ['open', 'contained', 'closed'] as const
export type BreachStatus = (typeof BREACH_STATUSES)[number]
export const BREACH_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
export type BreachSeverity = (typeof BREACH_SEVERITIES)[number]

/**
 * A personal data breach (s.2(u)) and its intimations. The clocks run from aware_at, the time
 * the organisation became aware (Rule 7). Severity is triage only: every breach is intimated.
 */
export const breach = pgTable(
  'breach',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    /** What happened: the nature and extent of the breach. */
    description: text('description').notNull(),
    awareAt: timestamp('aware_at', { withTimezone: true }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }),
    /** Where it happened: the system, site or processor. */
    place: text('place'),
    /** Words of s.2(u) that apply (BREACH_NATURES in the service). */
    natures: textList('natures'),
    severity: text('severity').$type<BreachSeverity>().notNull().default('medium'),
    cyberIncident: boolean('cyber_incident').notNull().default(false),
    affectedPrincipals: integer('affected_principals'),
    dataAffected: text('data_affected'),
    likelyImpact: text('likely_impact'),
    measures: text('measures'),
    safetySteps: text('safety_steps'),
    contact: text('contact'),
    cause: text('cause'),
    personResponsible: text('person_responsible'),
    remedial: text('remedial'),
    /** Who reported it inside the organisation, and how (the library's B04 register). */
    reportedBy: text('reported_by'),
    reportChannel: text('report_channel'),
    detectedAt: timestamp('detected_at', { withTimezone: true }),
    recordsAffected: integer('records_affected'),
    childrenAffected: integer('children_affected'),
    /** The post-incident review: when it was held and what was learnt. */
    reviewOn: date('review_on', { mode: 'string' }),
    lessons: text('lessons'),
    boardFirstAt: timestamp('board_first_at', { withTimezone: true }),
    boardDetailedAt: timestamp('board_detailed_at', { withTimezone: true }),
    boardReference: text('board_reference'),
    /** A longer period for the detailed report, allowed by the Board on a written request. */
    boardExtendedTo: timestamp('board_extended_to', { withTimezone: true }),
    principalsAt: timestamp('principals_at', { withTimezone: true }),
    principalsHow: text('principals_how'),
    certInAt: timestamp('cert_in_at', { withTimezone: true }),
    processorId: uuid('processor_id').references(() => processor.id, { onDelete: 'set null' }),
    departmentId: uuid('department_id').references(() => department.id, { onDelete: 'set null' }),
    /** PA numbers of the RoPA activities affected. */
    activityRefs: integer('activity_refs')
      .array()
      .notNull()
      .default(sql`'{}'::integer[]`),
    status: text('status').$type<BreachStatus>().notNull().default('open'),
    containedAt: timestamp('contained_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closeReason: text('close_reason'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('breach_tenant_code').on(table.tenantId, table.code)],
)

/** What was recorded about a breach, and when, oldest first. */
export const breachEvent = pgTable(
  'breach_event',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    breachId: uuid('breach_id')
      .notNull()
      .references(() => breach.id, { onDelete: 'cascade' }),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id'),
    kind: text('kind').notNull(),
    /** When the thing recorded took place (an intimation's time), if not now. */
    happenedAt: timestamp('happened_at', { withTimezone: true }),
    note: text('note'),
  },
  (table) => [index('breach_event_breach').on(table.breachId)],
)

/** Who made a rights request: the Data Principal, a parent or guardian, a nominee or an agent. */
export const REQUESTER_ROLES = ['self', 'parent', 'guardian', 'nominee', 'agent'] as const
export type RequesterRole = (typeof REQUESTER_ROLES)[number]

export const RIGHTS_KINDS = [
  'access',
  'correction',
  'erasure',
  'grievance',
  'nomination',
  'withdrawal',
] as const
export type RightsKind = (typeof RIGHTS_KINDS)[number]
export const RIGHTS_STATUSES = [
  'received',
  'in_progress',
  'fulfilled',
  'refused',
  'withdrawn',
] as const
export type RightsStatus = (typeof RIGHTS_STATUSES)[number]

/**
 * A request from a Data Principal (ss.11-14, or withdrawal of consent under s.6(4)). The
 * requester is recorded by the client's own reference, not by identity; a contact is held only
 * when the person sent the request through the client's public page.
 */
export const rightsRequest = pgTable(
  'rights_request',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    kind: text('kind').$type<RightsKind>().notNull(),
    receivedOn: date('received_on', { mode: 'string' }).notNull(),
    dueOn: date('due_on', { mode: 'string' }).notNull(),
    channel: text('channel'),
    requesterRef: text('requester_ref').notNull(),
    principalType: text('principal_type'),
    details: text('details'),
    identityVerified: boolean('identity_verified').notNull().default(false),
    requesterRole: text('requester_role').$type<RequesterRole>(),
    verificationMethod: text('verification_method'),
    verifiedOn: date('verified_on', { mode: 'string' }),
    acknowledgedOn: date('acknowledged_on', { mode: 'string' }),
    /** The response letter sent, by its number in the library's R04 (L-01 and so on). */
    letterRef: text('letter_ref'),
    status: text('status').$type<RightsStatus>().notNull().default('received'),
    outcome: text('outcome'),
    closedOn: date('closed_on', { mode: 'string' }),
    departmentId: uuid('department_id').references(() => department.id, { onDelete: 'set null' }),
    handler: text('handler'),
    /** "recorded" by the audit team, or "public" when it came through the client's public page. */
    source: text('source').notNull().default('recorded'),
    contact: text('contact'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('rights_request_tenant_code').on(table.tenantId, table.code),
    index('rights_request_due').on(table.tenantId, table.dueOn),
  ],
)

export const DPIA_STATUSES = ['draft', 'completed'] as const
export type DpiaStatus = (typeof DPIA_STATUSES)[number]
export const DPIA_OUTCOMES = ['proceed', 'proceed_with_measures', 'do_not_proceed'] as const
export type DpiaOutcome = (typeof DPIA_OUTCOMES)[number]

/**
 * A Data Protection Impact Assessment of one RoPA activity, in the shape s.10(2)(c)(i) gives:
 * the rights of the Data Principals, the purpose, and the assessment and management of the risk
 * to those rights. Its risks are in dpia_risk.
 */
export const dpia = pgTable(
  'dpia',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => processingActivity.id, { onDelete: 'cascade' }),
    status: text('status').$type<DpiaStatus>().notNull().default('draft'),
    description: text('description'),
    purpose: text('purpose'),
    rightsAffected: text('rights_affected'),
    necessity: text('necessity'),
    consulted: text('consulted'),
    outcome: text('outcome').$type<DpiaOutcome>(),
    outcomeNote: text('outcome_note'),
    preparedBy: text('prepared_by'),
    completedOn: date('completed_on', { mode: 'string' }),
    nextReviewOn: date('next_review_on', { mode: 'string' }),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('dpia_tenant_code').on(table.tenantId, table.code),
    uniqueIndex('dpia_activity').on(table.activityId),
  ],
)

/** One risk to Data Principals in a DPIA, rated before and after the measures that manage it. */
export const dpiaRisk = pgTable(
  'dpia_risk',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    dpiaId: uuid('dpia_id')
      .notNull()
      .references(() => dpia.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull().default(0),
    risk: text('risk').notNull(),
    likelihood: integer('likelihood').notNull(),
    impact: integer('impact').notNull(),
    measures: text('measures'),
    residualLikelihood: integer('residual_likelihood').notNull(),
    residualImpact: integer('residual_impact').notNull(),
  },
  (table) => [
    index('dpia_risk_dpia').on(table.dpiaId),
    check(
      'dpia_risk_range',
      sql`${table.likelihood} between 1 and 5 and ${table.impact} between 1 and 5 and ${table.residualLikelihood} between 1 and 5 and ${table.residualImpact} between 1 and 5`,
    ),
  ],
)

/**
 * The maturity level (0 to 4) a client aims for in a domain. A domain with no row uses the
 * default target, level 3.
 */
export const clientMaturityTarget = pgTable(
  'client_maturity_target',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    domainCode: text('domain_code').notNull(),
    target: integer('target').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.domainCode] }),
    check('client_maturity_target_range', sql`${table.target} between 0 and 4`),
  ],
)

/**
 * A client's answers for the document pack (ADR-0010), in the template library's own names:
 * its flags, its single values, its tables and per-document values. DUATF's records fill the
 * rest; an answer saved here wins over them.
 */
export const clientDocumentProfile = pgTable('client_document_profile', {
  tenantId: uuid('tenant_id')
    .primaryKey()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  flags: jsonb('flags').$type<Record<string, boolean | string>>().notNull().default({}),
  values: jsonb('values').$type<Record<string, string>>().notNull().default({}),
  collections: jsonb('collections')
    .$type<Record<string, Record<string, string>[]>>()
    .notNull()
    .default({}),
  docFlags: jsonb('doc_flags')
    .$type<Record<string, Record<string, boolean | string>>>()
    .notNull()
    .default({}),
  docValues: jsonb('doc_values')
    .$type<Record<string, Record<string, string>>>()
    .notNull()
    .default({}),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * An Administrator's mark that one version of a template file (by its SHA-256) has had legal
 * review. Firm-wide: the templates are the firm's, not a client's.
 */
export const documentTemplateReview = pgTable(
  'document_template_review',
  {
    templateId: text('template_id').notNull(),
    sha256: text('sha256').notNull(),
    reviewedBy: uuid('reviewed_by').notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
    note: text('note'),
  },
  (table) => [primaryKey({ columns: [table.templateId, table.sha256] })],
)

/** The consultant's statutory checklist (Part B of the library's checklist) for one document. */
export const documentChecklist = pgTable(
  'document_checklist',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    templateId: text('template_id').notNull(),
    items: jsonb('items').$type<string[]>().notNull().default([]),
    signedBy: uuid('signed_by'),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.templateId] })],
)

/** Each download of a library document or of the pack: who, which, in what format, which version. */
export const documentExport = pgTable(
  'document_export',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    templateId: text('template_id').notNull(),
    recordRef: text('record_ref'),
    format: text('format').notNull(),
    templateSha: text('template_sha'),
    userId: uuid('user_id'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('document_export_tenant').on(table.tenantId, table.at)],
)
