CREATE TABLE "control_owner" (
	"tenant_id" uuid NOT NULL,
	"control_code" text NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "control_owner_pk" PRIMARY KEY("tenant_id","control_code")
);
--> statement-breakpoint
CREATE TABLE "evidence_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"assignee_user_id" uuid,
	"due_date" date,
	"status" text DEFAULT 'requested' NOT NULL,
	"evidence_id" uuid,
	"requested_by" uuid,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fulfilled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app_user" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "gates" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "login_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_item" ADD COLUMN "assignee_user_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_item" ADD COLUMN "auto_na_from" text;--> statement-breakpoint
ALTER TABLE "control_owner" ADD CONSTRAINT "control_owner_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_request" ADD CONSTRAINT "evidence_request_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_request" ADD CONSTRAINT "evidence_request_item_id_assessment_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."assessment_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_request" ADD CONSTRAINT "evidence_request_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_request_item" ON "evidence_request" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "evidence_request_assignee" ON "evidence_request" USING btree ("assignee_user_id");--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_username_unique" UNIQUE("username");--> statement-breakpoint
SELECT enable_tenant_rls('evidence_request');
--> statement-breakpoint
SELECT enable_tenant_rls('control_owner');
--> statement-breakpoint
-- Accounts set up before usernames existed kept their sign-in name in email: move it, keep
-- their login, and make them administrators (each was the only account of its instance).
UPDATE app_user SET username = lower(email), email = NULL, login_enabled = true
  WHERE password_hash IS NOT NULL AND email NOT LIKE '%@%';
--> statement-breakpoint
UPDATE app_user SET login_enabled = true WHERE password_hash IS NOT NULL;
--> statement-breakpoint
INSERT INTO role_assignment (user_id, role)
  SELECT u.id, 'firm_admin' FROM app_user u
  WHERE u.password_hash IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM role_assignment r WHERE r.user_id = u.id);
