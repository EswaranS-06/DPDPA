CREATE TABLE "breach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"aware_at" timestamp with time zone NOT NULL,
	"occurred_at" timestamp with time zone,
	"place" text,
	"natures" text[] DEFAULT '{}'::text[] NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"cyber_incident" boolean DEFAULT false NOT NULL,
	"affected_principals" integer,
	"data_affected" text,
	"likely_impact" text,
	"measures" text,
	"safety_steps" text,
	"contact" text,
	"cause" text,
	"person_responsible" text,
	"remedial" text,
	"board_first_at" timestamp with time zone,
	"board_detailed_at" timestamp with time zone,
	"board_reference" text,
	"board_extended_to" timestamp with time zone,
	"principals_at" timestamp with time zone,
	"principals_how" text,
	"cert_in_at" timestamp with time zone,
	"processor_id" uuid,
	"department_id" uuid,
	"activity_refs" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"contained_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"close_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "breach_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "breach_event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"breach_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"kind" text NOT NULL,
	"happened_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "dpia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"activity_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"description" text,
	"purpose" text,
	"rights_affected" text,
	"necessity" text,
	"consulted" text,
	"outcome" text,
	"outcome_note" text,
	"prepared_by" text,
	"completed_on" date,
	"next_review_on" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dpia_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "dpia_risk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dpia_id" uuid NOT NULL,
	"seq" integer DEFAULT 0 NOT NULL,
	"risk" text NOT NULL,
	"likelihood" integer NOT NULL,
	"impact" integer NOT NULL,
	"measures" text,
	"residual_likelihood" integer NOT NULL,
	"residual_impact" integer NOT NULL,
	CONSTRAINT "dpia_risk_range" CHECK ("dpia_risk"."likelihood" between 1 and 5 and "dpia_risk"."impact" between 1 and 5 and "dpia_risk"."residual_likelihood" between 1 and 5 and "dpia_risk"."residual_impact" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "processor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"kind" text DEFAULT 'processor' NOT NULL,
	"service" text,
	"location" text DEFAULT 'unknown' NOT NULL,
	"countries" text,
	"contact_name" text,
	"contact_email" text,
	"contract" text DEFAULT 'unknown' NOT NULL,
	"contract_start" date,
	"contract_end" date,
	"contract_evidence_id" uuid,
	"terms" text[] DEFAULT '{}'::text[] NOT NULL,
	"rating" text,
	"last_assessed_on" date,
	"next_review_on" date,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processor_tenant_code" UNIQUE("tenant_id","code"),
	CONSTRAINT "processor_contract_dates" CHECK ("processor"."contract_start" is null or "processor"."contract_end" is null or "processor"."contract_end" >= "processor"."contract_start")
);
--> statement-breakpoint
CREATE TABLE "rights_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"kind" text NOT NULL,
	"received_on" date NOT NULL,
	"due_on" date NOT NULL,
	"channel" text,
	"requester_ref" text NOT NULL,
	"principal_type" text,
	"details" text,
	"identity_verified" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"outcome" text,
	"closed_on" date,
	"department_id" uuid,
	"handler" text,
	"source" text DEFAULT 'recorded' NOT NULL,
	"contact" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rights_request_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "rights_response_days" integer;--> statement-breakpoint
ALTER TABLE "breach" ADD CONSTRAINT "breach_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breach" ADD CONSTRAINT "breach_processor_id_processor_id_fk" FOREIGN KEY ("processor_id") REFERENCES "public"."processor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breach" ADD CONSTRAINT "breach_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breach_event" ADD CONSTRAINT "breach_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breach_event" ADD CONSTRAINT "breach_event_breach_id_breach_id_fk" FOREIGN KEY ("breach_id") REFERENCES "public"."breach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dpia" ADD CONSTRAINT "dpia_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dpia" ADD CONSTRAINT "dpia_activity_id_processing_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."processing_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dpia_risk" ADD CONSTRAINT "dpia_risk_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dpia_risk" ADD CONSTRAINT "dpia_risk_dpia_id_dpia_id_fk" FOREIGN KEY ("dpia_id") REFERENCES "public"."dpia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processor" ADD CONSTRAINT "processor_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processor" ADD CONSTRAINT "processor_contract_evidence_id_evidence_id_fk" FOREIGN KEY ("contract_evidence_id") REFERENCES "public"."evidence"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_request" ADD CONSTRAINT "rights_request_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_request" ADD CONSTRAINT "rights_request_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "breach_event_breach" ON "breach_event" USING btree ("breach_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dpia_activity" ON "dpia" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "dpia_risk_dpia" ON "dpia_risk" USING btree ("dpia_id");--> statement-breakpoint
CREATE UNIQUE INDEX "processor_tenant_name" ON "processor" USING btree ("tenant_id",lower("name"));--> statement-breakpoint
CREATE INDEX "rights_request_due" ON "rights_request" USING btree ("tenant_id","due_on");--> statement-breakpoint
SELECT enable_tenant_rls('processor');
--> statement-breakpoint
SELECT enable_tenant_rls('breach');
--> statement-breakpoint
SELECT enable_tenant_rls('breach_event');
--> statement-breakpoint
SELECT enable_tenant_rls('rights_request');
--> statement-breakpoint
SELECT enable_tenant_rls('dpia');
--> statement-breakpoint
SELECT enable_tenant_rls('dpia_risk');
