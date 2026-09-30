CREATE TABLE "action_event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"action_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"from_status" text,
	"to_status" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "remediation_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"finding_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"owner_user_id" uuid,
	"department_id" uuid,
	"due_date" date,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	CONSTRAINT "remediation_action_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "evidence_link" ADD COLUMN "action_id" uuid;--> statement-breakpoint
ALTER TABLE "action_event" ADD CONSTRAINT "action_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_event" ADD CONSTRAINT "action_event_action_id_remediation_action_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."remediation_action"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remediation_action" ADD CONSTRAINT "remediation_action_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remediation_action" ADD CONSTRAINT "remediation_action_finding_id_finding_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."finding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remediation_action" ADD CONSTRAINT "remediation_action_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_event_action" ON "action_event" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "remediation_action_finding" ON "remediation_action" USING btree ("finding_id");--> statement-breakpoint
ALTER TABLE "evidence_link" ADD CONSTRAINT "evidence_link_action_id_remediation_action_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."remediation_action"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_link_action_idx" ON "evidence_link" USING btree ("action_id");--> statement-breakpoint
ALTER TABLE "evidence_link" ADD CONSTRAINT "evidence_link_action" UNIQUE("evidence_id","action_id");--> statement-breakpoint
ALTER TABLE "evidence_link" ADD CONSTRAINT "evidence_link_target" CHECK (num_nonnulls("evidence_link"."item_id", "evidence_link"."action_id") = 1);