import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

// Framework releases hold the legal knowledge base. A published release is immutable
// (guard triggers in migration 0001); assessment cycles pin one release.

export type ReleaseStatus = 'draft' | 'in_review' | 'published' | 'superseded'
export type InstrumentKind = 'section' | 'rule' | 'schedule'
export type ObligationTrigger = {
  always?: boolean
  role?: string[]
  basis?: string[]
  flags?: string[]
}

const textList = (name: string) =>
  text(name)
    .array()
    .notNull()
    .default(sql`'{}'::text[]`)

const releaseRef = () =>
  uuid('release_id')
    .notNull()
    .references(() => frameworkRelease.id, { onDelete: 'cascade' })

export const frameworkRelease = pgTable('framework_release', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: text('version').notNull().unique(),
  status: text('status').$type<ReleaseStatus>().notNull().default('draft'),
  source: text('source').notNull(),
  sourceDigest: text('source_digest'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedBy: text('published_by'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
})

export const instrument = pgTable(
  'instrument',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    kind: text('kind').$type<InstrumentKind>().notNull(),
    number: text('number').notNull(),
    title: text('title').notNull(),
    chapter: text('chapter'),
    chapterTitle: text('chapter_title'),
    phase: integer('phase'),
    inForceDate: date('in_force_date', { mode: 'string' }),
    statusText: text('status_text'),
    phaseNote: text('phase_note'),
    summaryMd: text('summary_md'),
    bodyMd: text('body_md').notNull(),
    obligationCodes: textList('obligation_codes'),
    relatedCodes: textList('related_codes'),
  },
  (table) => [primaryKey({ name: 'instrument_pk', columns: [table.releaseId, table.code] })],
)

export const lawfulBasis = pgTable(
  'lawful_basis',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    reference: text('reference').notNull(),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'lawful_basis_pk', columns: [table.releaseId, table.code] })],
)

export const domain = pgTable(
  'domain',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'domain_pk', columns: [table.releaseId, table.code] })],
)

export const obligation = pgTable(
  'obligation',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    requirement: text('requirement').notNull(),
    domainCode: text('domain_code').notNull(),
    regime: text('regime').notNull(),
    actRef: text('act_ref'),
    ruleRef: text('rule_ref'),
    scheduleRef: text('schedule_ref'),
    actor: text('actor').notNull(),
    phase: integer('phase').notNull(),
    inForce: date('in_force', { mode: 'string' }),
    inForceUntil: date('in_force_until', { mode: 'string' }),
    statusText: text('status_text'),
    penaltyTier: text('penalty_tier'),
    penaltyText: text('penalty_text'),
    section: doublePrecision('section'),
    trigger: jsonb('trigger').$type<ObligationTrigger>().notNull(),
    evidenceExpected: textList('evidence_expected'),
    anchorLevel: text('anchor_level'),
    tier: text('tier'),
    track: text('track'),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'obligation_pk', columns: [table.releaseId, table.code] })],
)

export const control = pgTable(
  'control',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    domainCode: text('domain_code').notNull(),
    controlType: text('control_type').notNull(),
    nature: text('nature').notNull(),
    frequency: text('frequency').notNull(),
    ownerRole: text('owner_role').notNull(),
    testProcedure: text('test_procedure').notNull(),
    evidence: textList('evidence'),
    iso27001: textList('iso27001'),
    iso27701: textList('iso27701'),
    nistCsf: textList('nist_csf'),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'control_pk', columns: [table.releaseId, table.code] })],
)

export const obligationControl = pgTable(
  'obligation_control',
  {
    releaseId: releaseRef(),
    obligationCode: text('obligation_code').notNull(),
    controlCode: text('control_code').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'obligation_control_pk',
      columns: [table.releaseId, table.obligationCode, table.controlCode],
    }),
  ],
)

export const acceptanceCriterion = pgTable(
  'acceptance_criterion',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    releaseId: releaseRef(),
    obligationCode: text('obligation_code').notNull(),
    seq: integer('seq').notNull(),
    text: text('text').notNull(),
    critical: boolean('critical').notNull().default(false),
    controlCodes: textList('control_codes'),
  },
  (table) => [
    unique('criterion_obligation_seq').on(table.releaseId, table.obligationCode, table.seq),
  ],
)

export const interpretationDecision = pgTable(
  'interpretation_decision',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    question: text('question').notNull(),
    options: jsonb('options').$type<string[]>().notNull(),
    position: text('position'),
    rationale: text('rationale'),
    riskIfBoardDisagrees: text('risk_if_board_disagrees'),
    reviewDate: date('review_date', { mode: 'string' }),
    status: text('status').notNull().default('open'),
    obligationCodes: textList('obligation_codes'),
  },
  (table) => [primaryKey({ name: 'interpretation_pk', columns: [table.releaseId, table.code] })],
)

export const processTemplate = pgTable(
  'process_template',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    sectorCode: text('sector_code').notNull(),
    sectorName: text('sector_name').notNull(),
    department: text('department').notNull(),
    activities: textList('activities'),
    dataPrincipals: textList('data_principals'),
    dataCategories: textList('data_categories'),
    typicalSystems: textList('typical_systems'),
    typicalThirdParties: textList('typical_third_parties'),
    typicalLawfulBasis: textList('typical_lawful_basis'),
    flags: textList('flags'),
    contextTags: textList('context_tags'),
    obligationCodes: textList('obligation_codes'),
    assessorNote: text('assessor_note'),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'process_template_pk', columns: [table.releaseId, table.code] })],
)

export const sectorOverlay = pgTable(
  'sector_overlay',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    covers: text('covers').notNull(),
    regulators: textList('regulators'),
    keyPrincipals: textList('key_principals'),
    processTemplateCodes: textList('process_template_codes'),
    localisation: text('localisation'),
    hotspots: textList('hotspots'),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'sector_overlay_pk', columns: [table.releaseId, table.code] })],
)

export const sectorLaw = pgTable(
  'sector_law',
  {
    releaseId: releaseRef(),
    overlayCode: text('overlay_code').notNull(),
    seq: integer('seq').notNull(),
    law: text('law').notNull(),
    relevance: text('relevance').notNull(),
  },
  (table) => [
    primaryKey({ name: 'sector_law_pk', columns: [table.releaseId, table.overlayCode, table.seq] }),
  ],
)

export const retentionAnchor = pgTable(
  'retention_anchor',
  {
    releaseId: releaseRef(),
    overlayCode: text('overlay_code').notNull(),
    seq: integer('seq').notNull(),
    record: text('record').notNull(),
    period: text('period').notNull(),
    source: text('source').notNull(),
    confidence: text('confidence').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'retention_anchor_pk',
      columns: [table.releaseId, table.overlayCode, table.seq],
    }),
  ],
)

export const dataElement = pgTable(
  'data_element',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    personalData: boolean('personal_data').notNull(),
    contextTags: textList('context_tags'),
    note: text('note'),
  },
  (table) => [primaryKey({ name: 'data_element_pk', columns: [table.releaseId, table.code] })],
)

export const vocabulary = pgTable(
  'vocabulary',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    intro: text('intro'),
    columns: textList('columns'),
  },
  (table) => [primaryKey({ name: 'vocabulary_pk', columns: [table.releaseId, table.code] })],
)

export const vocabularyTerm = pgTable(
  'vocabulary_term',
  {
    releaseId: releaseRef(),
    vocabularyCode: text('vocabulary_code').notNull(),
    seq: integer('seq').notNull(),
    term: text('term').notNull(),
    meaning: text('meaning'),
    extra: jsonb('extra')
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    primaryKey({
      name: 'vocabulary_term_pk',
      columns: [table.releaseId, table.vocabularyCode, table.seq],
    }),
  ],
)

export const pbcItem = pgTable(
  'pbc_item',
  {
    releaseId: releaseRef(),
    seq: integer('seq').notNull(),
    evidence: text('evidence').notNull(),
    domainCodes: textList('domain_codes'),
    owner: text('owner').notNull(),
  },
  (table) => [primaryKey({ name: 'pbc_item_pk', columns: [table.releaseId, table.seq] })],
)

export const stuckPoint = pgTable(
  'stuck_point',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'stuck_point_pk', columns: [table.releaseId, table.code] })],
)

export const scopingQuestion = pgTable(
  'scoping_question',
  {
    releaseId: releaseRef(),
    seq: integer('seq').notNull(),
    section: text('section').notNull(),
    text: text('text').notNull(),
  },
  (table) => [primaryKey({ name: 'scoping_question_pk', columns: [table.releaseId, table.seq] })],
)

export const discoveryQuestion = pgTable(
  'discovery_question',
  {
    releaseId: releaseRef(),
    seq: integer('seq').notNull(),
    section: text('section').notNull(),
    topic: text('topic'),
    text: text('text').notNull(),
    creates: text('creates'),
  },
  (table) => [primaryKey({ name: 'discovery_question_pk', columns: [table.releaseId, table.seq] })],
)

export const playbookDoc = pgTable(
  'playbook_doc',
  {
    releaseId: releaseRef(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    docType: text('doc_type').notNull(),
    bodyMd: text('body_md').notNull(),
  },
  (table) => [primaryKey({ name: 'playbook_doc_pk', columns: [table.releaseId, table.slug] })],
)

export const notificationEntry = pgTable(
  'notification_entry',
  {
    releaseId: releaseRef(),
    seq: integer('seq').notNull(),
    date: text('date').notNull(),
    instrument: text('instrument').notNull(),
    summary: text('summary').notNull(),
    impact: text('impact').notNull(),
    status: text('status').notNull(),
  },
  (table) => [primaryKey({ name: 'notification_entry_pk', columns: [table.releaseId, table.seq] })],
)

/** Conditions under which a question applies: the union of its obligations' triggers. */
export type QuestionApplicability = {
  always: boolean
  roles: string[]
  flags: string[]
  bases: string[]
}

export type QuestionReviewStatus = 'draft' | 'sme_approved'

/** Who answers a questionnaire: the organisation as a whole, a department, or a vendor. */
export type QuestionnaireRespondent = 'organisation' | 'department' | 'vendor'

/** One ComplyX question template (TPL-001 Data Fiduciary, TPL-002, TPL-003). */
export const questionnaire = pgTable(
  'questionnaire',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    seq: integer('seq').notNull(),
    title: text('title').notNull(),
    respondent: text('respondent').$type<QuestionnaireRespondent>().notNull(),
    description: text('description').notNull(),
    sourceFile: text('source_file'),
  },
  (table) => [primaryKey({ name: 'questionnaire_pk', columns: [table.releaseId, table.code] })],
)

/** How a question is answered. */
export const ANSWER_TYPES = ['yes_no', 'maturity', 'choice', 'multi_choice', 'text'] as const
export type AnswerType = (typeof ANSWER_TYPES)[number]

/** What choosing an option means for compliance; informational answers are recorded, not scored. */
export const ANSWER_OUTCOMES = ['compliant', 'potential_gap', 'gap', 'informational'] as const
export type AnswerOutcome = (typeof ANSWER_OUTCOMES)[number]

/** One option of a question. Free-text questions have none; Not applicable is always offered. */
export type AnswerOption = { value: string; label: string; outcome: AnswerOutcome; hint?: string }

/**
 * Self-reconciliation: when the answer to another question (the gate) is one of `values`, this
 * question does not apply and is marked Not applicable; with any other answer it applies and
 * cannot be marked Not applicable.
 */
export type QuestionGate = { question: string; values: string[]; reason: string }

export const RISK_LEVELS = ['critical', 'high', 'medium', 'low'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

/**
 * The assessment question bank, built from the ComplyX templates. Each question maps to KB
 * obligations and controls; references, penalty, applicability and evidence suggestions are
 * derived from them when the release is built. control_code is the first mapped control.
 */
export const question = pgTable(
  'question',
  {
    releaseId: releaseRef(),
    code: text('code').notNull(),
    seq: integer('seq').notNull(),
    questionnaireCode: text('questionnaire_code').notNull(),
    section: text('section').notNull(),
    title: text('title').notNull(),
    controlCode: text('control_code').notNull(),
    controlCodes: textList('control_codes'),
    domainCode: text('domain_code').notNull(),
    text: text('text').notNull(),
    answerType: text('answer_type').$type<AnswerType>().notNull(),
    options: jsonb('options').$type<AnswerOption[]>().notNull(),
    scored: boolean('scored').notNull(),
    riskLevel: text('risk_level').$type<RiskLevel>().notNull(),
    sourceRef: text('source_ref'),
    sourceId: text('source_id'),
    attachmentRequired: boolean('attachment_required').notNull().default(false),
    mappingNote: text('mapping_note'),
    gates: jsonb('gates')
      .$type<QuestionGate[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    guidance: text('guidance').notNull(),
    recommendation: text('recommendation').notNull(),
    obligationCodes: textList('obligation_codes'),
    references: textList('references'),
    applicability: jsonb('applicability').$type<QuestionApplicability>().notNull(),
    riskWeight: integer('risk_weight').notNull(),
    evidenceRequired: textList('evidence_required'),
    evidenceRecommended: textList('evidence_recommended'),
    evidenceSupporting: textList('evidence_supporting'),
    reviewStatus: text('review_status').$type<QuestionReviewStatus>().notNull().default('draft'),
  },
  (table) => [primaryKey({ name: 'question_pk', columns: [table.releaseId, table.code] })],
)

export type KbReviewStatus = 'awaiting_review' | 'reviewed'
/** Who wrote an entry's current wording: ComplyX staff in the editor, or an AI-drafted content pass. */
export type KbEntryOrigin = 'staff' | 'assistant'

/**
 * Legal review of entries added or changed through the knowledge-base editor. Entries imported
 * from the vault have no row. Copied into each new release, so the status travels with the entry.
 */
export const kbEntryReview = pgTable(
  'kb_entry_review',
  {
    releaseId: releaseRef(),
    section: text('section').notNull(),
    code: text('code').notNull(),
    status: text('status').$type<KbReviewStatus>().notNull().default('awaiting_review'),
    origin: text('origin').$type<KbEntryOrigin>().notNull(),
    changedBy: text('changed_by').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNote: text('review_note'),
  },
  (table) => [
    primaryKey({
      name: 'kb_entry_review_pk',
      columns: [table.releaseId, table.section, table.code],
    }),
  ],
)

export type KbChangeKind = 'added' | 'edited' | 'removed' | 'reviewed'

/** What was changed in a draft release, by whom and when. Frozen with the release; never copied. */
export const kbChange = pgTable('kb_change', {
  id: uuid('id').primaryKey().defaultRandom(),
  releaseId: releaseRef(),
  section: text('section').notNull(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  change: text('change').$type<KbChangeKind>().notNull(),
  detail: text('detail'),
  actorUserId: uuid('actor_user_id'),
  actorName: text('actor_name').notNull(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
})

/** Child tables guarded by the published-release trigger (kb_change is guarded too, not copied). */
export const FRAMEWORK_CHILD_TABLES = [
  'instrument',
  'lawful_basis',
  'domain',
  'obligation',
  'control',
  'obligation_control',
  'acceptance_criterion',
  'interpretation_decision',
  'process_template',
  'sector_overlay',
  'sector_law',
  'retention_anchor',
  'data_element',
  'vocabulary',
  'vocabulary_term',
  'pbc_item',
  'stuck_point',
  'scoping_question',
  'discovery_question',
  'playbook_doc',
  'notification_entry',
  'questionnaire',
  'question',
  'kb_entry_review',
] as const
