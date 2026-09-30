CREATE TABLE "client_profile" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"industry" text NOT NULL,
	"sector_code" text,
	"organisation_type" text NOT NULL,
	"website" text,
	"country" text DEFAULT 'India' NOT NULL,
	"state" text,
	"address" text,
	"employee_count" integer,
	"data_principal_count" integer,
	"dpo_name" text,
	"dpo_email" text,
	"dpo_phone" text,
	"primary_contact_name" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"primary_contact_phone" text,
	"assessment_period_start" date,
	"assessment_period_end" date,
	"applicability" text DEFAULT 'under_review' NOT NULL,
	"applicability_note" text,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"head_name" text,
	"head_email" text,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "department_tenant_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;