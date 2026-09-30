CREATE TABLE "finding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"assessment_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"question_code" text NOT NULL,
	"control_code" text NOT NULL,
	"domain_code" text NOT NULL,
	"title" text NOT NULL,
	"gap_type" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"recommendation" text NOT NULL,
	"references" text[] DEFAULT '{}'::text[] NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_reason" text,
	CONSTRAINT "finding_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "finding_event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"finding_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"kind" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"finding_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"likelihood" integer NOT NULL,
	"impact" integer NOT NULL,
	"score" integer GENERATED ALWAYS AS (likelihood * impact) STORED NOT NULL,
	"treatment" text DEFAULT 'mitigate' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"owner_name" text,
	"accepted_by" uuid,
	"accepted_at" timestamp with time zone,
	"acceptance_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "risk_tenant_code" UNIQUE("tenant_id","code"),
	CONSTRAINT "risk_likelihood_range" CHECK ("risk"."likelihood" between 1 and 5),
	CONSTRAINT "risk_impact_range" CHECK ("risk"."impact" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "risk_band" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"min_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"tone" text NOT NULL,
	"seq" integer NOT NULL,
	CONSTRAINT "risk_band_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "finding" ADD CONSTRAINT "finding_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding" ADD CONSTRAINT "finding_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding" ADD CONSTRAINT "finding_item_id_assessment_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."assessment_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding_event" ADD CONSTRAINT "finding_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding_event" ADD CONSTRAINT "finding_event_finding_id_finding_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."finding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk" ADD CONSTRAINT "risk_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk" ADD CONSTRAINT "risk_finding_id_finding_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."finding"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "finding_item" ON "finding" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "finding_event_finding" ON "finding_event" USING btree ("finding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_finding" ON "risk" USING btree ("finding_id");