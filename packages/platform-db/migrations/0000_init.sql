CREATE TABLE "code_sequence" (
	"tenant_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"last_value" integer NOT NULL,
	CONSTRAINT "code_sequence_pk" PRIMARY KEY("tenant_id","scope")
);
--> statement-breakpoint
CREATE TABLE "legal_entity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"legal_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_entity_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "outbox_event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "processed_event" (
	"consumer" text NOT NULL,
	"event_id" bigint NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_event_pk" PRIMARY KEY("consumer","event_id")
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "acceptance_criterion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"obligation_code" text NOT NULL,
	"seq" integer NOT NULL,
	"text" text NOT NULL,
	"critical" boolean DEFAULT false NOT NULL,
	"control_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "criterion_obligation_seq" UNIQUE("release_id","obligation_code","seq")
);
--> statement-breakpoint
CREATE TABLE "control" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"domain_code" text NOT NULL,
	"control_type" text NOT NULL,
	"nature" text NOT NULL,
	"frequency" text NOT NULL,
	"owner_role" text NOT NULL,
	"test_procedure" text NOT NULL,
	"evidence" text[] DEFAULT '{}'::text[] NOT NULL,
	"iso27001" text[] DEFAULT '{}'::text[] NOT NULL,
	"iso27701" text[] DEFAULT '{}'::text[] NOT NULL,
	"nist_csf" text[] DEFAULT '{}'::text[] NOT NULL,
	"body_md" text NOT NULL,
	CONSTRAINT "control_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "data_element" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"personal_data" boolean NOT NULL,
	"context_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"note" text,
	CONSTRAINT "data_element_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "discovery_question" (
	"release_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"section" text NOT NULL,
	"topic" text,
	"text" text NOT NULL,
	"creates" text,
	CONSTRAINT "discovery_question_pk" PRIMARY KEY("release_id","seq")
);
--> statement-breakpoint
CREATE TABLE "domain" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"body_md" text NOT NULL,
	CONSTRAINT "domain_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "framework_release" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"source" text NOT NULL,
	"source_digest" text,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" text,
	"published_at" timestamp with time zone,
	CONSTRAINT "framework_release_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "instrument" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"kind" text NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"chapter" text,
	"chapter_title" text,
	"phase" integer,
	"in_force_date" date,
	"status_text" text,
	"phase_note" text,
	"summary_md" text,
	"body_md" text NOT NULL,
	"obligation_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"related_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "instrument_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "interpretation_decision" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"position" text,
	"rationale" text,
	"risk_if_board_disagrees" text,
	"review_date" date,
	"status" text DEFAULT 'open' NOT NULL,
	"obligation_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "interpretation_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "lawful_basis" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"reference" text NOT NULL,
	"body_md" text NOT NULL,
	CONSTRAINT "lawful_basis_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "notification_entry" (
	"release_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"date" text NOT NULL,
	"instrument" text NOT NULL,
	"summary" text NOT NULL,
	"impact" text NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "notification_entry_pk" PRIMARY KEY("release_id","seq")
);
--> statement-breakpoint
CREATE TABLE "obligation" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"requirement" text NOT NULL,
	"domain_code" text NOT NULL,
	"regime" text NOT NULL,
	"act_ref" text,
	"rule_ref" text,
	"schedule_ref" text,
	"actor" text NOT NULL,
	"phase" integer NOT NULL,
	"in_force" date,
	"in_force_until" date,
	"status_text" text,
	"penalty_tier" text,
	"penalty_text" text,
	"section" double precision,
	"trigger" jsonb NOT NULL,
	"evidence_expected" text[] DEFAULT '{}'::text[] NOT NULL,
	"anchor_level" text,
	"tier" text,
	"track" text,
	"body_md" text NOT NULL,
	CONSTRAINT "obligation_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "obligation_control" (
	"release_id" uuid NOT NULL,
	"obligation_code" text NOT NULL,
	"control_code" text NOT NULL,
	CONSTRAINT "obligation_control_pk" PRIMARY KEY("release_id","obligation_code","control_code")
);
--> statement-breakpoint
CREATE TABLE "pbc_item" (
	"release_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"evidence" text NOT NULL,
	"domain_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"owner" text NOT NULL,
	CONSTRAINT "pbc_item_pk" PRIMARY KEY("release_id","seq")
);
--> statement-breakpoint
CREATE TABLE "playbook_doc" (
	"release_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"doc_type" text NOT NULL,
	"body_md" text NOT NULL,
	CONSTRAINT "playbook_doc_pk" PRIMARY KEY("release_id","slug")
);
--> statement-breakpoint
CREATE TABLE "process_template" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"sector_code" text NOT NULL,
	"sector_name" text NOT NULL,
	"department" text NOT NULL,
	"activities" text[] DEFAULT '{}'::text[] NOT NULL,
	"data_principals" text[] DEFAULT '{}'::text[] NOT NULL,
	"data_categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"typical_systems" text[] DEFAULT '{}'::text[] NOT NULL,
	"typical_third_parties" text[] DEFAULT '{}'::text[] NOT NULL,
	"typical_lawful_basis" text[] DEFAULT '{}'::text[] NOT NULL,
	"flags" text[] DEFAULT '{}'::text[] NOT NULL,
	"context_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"obligation_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"assessor_note" text,
	"body_md" text NOT NULL,
	CONSTRAINT "process_template_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "retention_anchor" (
	"release_id" uuid NOT NULL,
	"overlay_code" text NOT NULL,
	"seq" integer NOT NULL,
	"record" text NOT NULL,
	"period" text NOT NULL,
	"source" text NOT NULL,
	"confidence" text NOT NULL,
	CONSTRAINT "retention_anchor_pk" PRIMARY KEY("release_id","overlay_code","seq")
);
--> statement-breakpoint
CREATE TABLE "scoping_question" (
	"release_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"section" text NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT "scoping_question_pk" PRIMARY KEY("release_id","seq")
);
--> statement-breakpoint
CREATE TABLE "sector_law" (
	"release_id" uuid NOT NULL,
	"overlay_code" text NOT NULL,
	"seq" integer NOT NULL,
	"law" text NOT NULL,
	"relevance" text NOT NULL,
	CONSTRAINT "sector_law_pk" PRIMARY KEY("release_id","overlay_code","seq")
);
--> statement-breakpoint
CREATE TABLE "sector_overlay" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"covers" text NOT NULL,
	"regulators" text[] DEFAULT '{}'::text[] NOT NULL,
	"key_principals" text[] DEFAULT '{}'::text[] NOT NULL,
	"process_template_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"localisation" text,
	"hotspots" text[] DEFAULT '{}'::text[] NOT NULL,
	"body_md" text NOT NULL,
	CONSTRAINT "sector_overlay_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "stuck_point" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"body_md" text NOT NULL,
	CONSTRAINT "stuck_point_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"intro" text,
	"columns" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "vocabulary_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
CREATE TABLE "vocabulary_term" (
	"release_id" uuid NOT NULL,
	"vocabulary_code" text NOT NULL,
	"seq" integer NOT NULL,
	"term" text NOT NULL,
	"meaning" text,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "vocabulary_term_pk" PRIMARY KEY("release_id","vocabulary_code","seq")
);
--> statement-breakpoint
ALTER TABLE "code_sequence" ADD CONSTRAINT "code_sequence_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_entity" ADD CONSTRAINT "legal_entity_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceptance_criterion" ADD CONSTRAINT "acceptance_criterion_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control" ADD CONSTRAINT "control_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_element" ADD CONSTRAINT "data_element_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_question" ADD CONSTRAINT "discovery_question_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument" ADD CONSTRAINT "instrument_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interpretation_decision" ADD CONSTRAINT "interpretation_decision_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawful_basis" ADD CONSTRAINT "lawful_basis_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_entry" ADD CONSTRAINT "notification_entry_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation" ADD CONSTRAINT "obligation_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_control" ADD CONSTRAINT "obligation_control_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pbc_item" ADD CONSTRAINT "pbc_item_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_doc" ADD CONSTRAINT "playbook_doc_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_template" ADD CONSTRAINT "process_template_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_anchor" ADD CONSTRAINT "retention_anchor_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoping_question" ADD CONSTRAINT "scoping_question_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sector_law" ADD CONSTRAINT "sector_law_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sector_overlay" ADD CONSTRAINT "sector_overlay_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stuck_point" ADD CONSTRAINT "stuck_point_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_term" ADD CONSTRAINT "vocabulary_term_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;