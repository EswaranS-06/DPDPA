CREATE TABLE "client_document_profile" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"collections" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"doc_flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"doc_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_checklist" (
	"tenant_id" uuid NOT NULL,
	"template_id" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signed_by" uuid,
	"signed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_checklist_tenant_id_template_id_pk" PRIMARY KEY("tenant_id","template_id")
);
--> statement-breakpoint
CREATE TABLE "document_export" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" text NOT NULL,
	"record_ref" text,
	"format" text NOT NULL,
	"template_sha" text,
	"user_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_template_review" (
	"template_id" text NOT NULL,
	"sha256" text NOT NULL,
	"reviewed_by" uuid NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	CONSTRAINT "document_template_review_template_id_sha256_pk" PRIMARY KEY("template_id","sha256")
);
--> statement-breakpoint
ALTER TABLE "client_document_profile" ADD CONSTRAINT "client_document_profile_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_checklist" ADD CONSTRAINT "document_checklist_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_export" ADD CONSTRAINT "document_export_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_export_tenant" ON "document_export" USING btree ("tenant_id","at");--> statement-breakpoint
SELECT enable_tenant_rls('client_document_profile');--> statement-breakpoint
SELECT enable_tenant_rls('document_checklist');--> statement-breakpoint
SELECT enable_tenant_rls('document_export');
