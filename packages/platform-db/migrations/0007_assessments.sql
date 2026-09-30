CREATE TABLE "assessment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"release_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"period_start" date,
	"period_end" date,
	"due_date" date,
	"previous_assessment_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "assessment_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "assessment_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"question_code" text NOT NULL,
	"control_code" text NOT NULL,
	"domain_code" text NOT NULL,
	"seq" integer NOT NULL,
	"department_id" uuid,
	"answer" text DEFAULT 'not_assessed' NOT NULL,
	"compliance_state" text GENERATED ALWAYS AS (case answer when 'yes' then 'compliant' when 'partial' then 'potential_gap' when 'no' then 'gap' when 'not_applicable' then 'excluded' else 'pending' end) STORED NOT NULL,
	"na_reason" text,
	"comment" text,
	"answered_by" uuid,
	"answered_at" timestamp with time zone,
	"review_state" text DEFAULT 'not_reviewed' NOT NULL,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "assessment_item_question" UNIQUE("assessment_id","question_code"),
	CONSTRAINT "assessment_item_na_reason" CHECK ("assessment_item"."answer" <> 'not_applicable' or length(trim(coalesce("assessment_item"."na_reason", ''))) > 0)
);
--> statement-breakpoint
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_item" ADD CONSTRAINT "assessment_item_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_item" ADD CONSTRAINT "assessment_item_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_item" ADD CONSTRAINT "assessment_item_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_item_department" ON "assessment_item" USING btree ("department_id");