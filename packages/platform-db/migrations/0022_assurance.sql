CREATE TABLE "assessment_signoff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approver_user_id" uuid NOT NULL,
	"due_date" date,
	"note" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"snapshot" jsonb
);
--> statement-breakpoint
ALTER TABLE "risk" ADD COLUMN "accepted_until" date;--> statement-breakpoint
ALTER TABLE "assessment_signoff" ADD CONSTRAINT "assessment_signoff_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_signoff" ADD CONSTRAINT "assessment_signoff_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_signoff_assessment" ON "assessment_signoff" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_signoff_approver" ON "assessment_signoff" USING btree ("approver_user_id");--> statement-breakpoint
SELECT enable_tenant_rls('assessment_signoff');
