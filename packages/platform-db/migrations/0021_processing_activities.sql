CREATE TABLE "processing_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"ref" integer NOT NULL,
	"template_code" text,
	"name" text NOT NULL,
	"purpose" text,
	"lawful_bases" text[] DEFAULT '{}'::text[] NOT NULL,
	"law_reference" text,
	"principals" text[] DEFAULT '{}'::text[] NOT NULL,
	"sources" text[] DEFAULT '{}'::text[] NOT NULL,
	"systems" text[] DEFAULT '{}'::text[] NOT NULL,
	"internal_recipients" text[] DEFAULT '{}'::text[] NOT NULL,
	"processors" text[] DEFAULT '{}'::text[] NOT NULL,
	"recipients" text[] DEFAULT '{}'::text[] NOT NULL,
	"retention" text,
	"deletion" text,
	"security" text[] DEFAULT '{}'::text[] NOT NULL,
	"transfers_abroad" text DEFAULT 'unknown' NOT NULL,
	"countries" text,
	"consent_status" text,
	"owner" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processing_activity_ref" UNIQUE("tenant_id","ref"),
	CONSTRAINT "processing_activity_name" UNIQUE("department_id","name"),
	CONSTRAINT "processing_activity_transfers" CHECK ("processing_activity"."transfers_abroad" in ('no', 'yes', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "processing_activity_element" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"element_code" text,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"seq" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "processing_activity_element_title" UNIQUE("activity_id","title"),
	CONSTRAINT "processing_activity_element_level" CHECK ("processing_activity_element"."level" in ('L1', 'L2', 'L3', 'L4'))
);
--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_purpose" text;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_elements" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_principals" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_sources" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_internal" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_processors" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_recipients" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_retention" text;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_deletion" text;--> statement-breakpoint
ALTER TABLE "process_template" ADD COLUMN "ropa_security" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "processing_activity" ADD CONSTRAINT "processing_activity_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_activity" ADD CONSTRAINT "processing_activity_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_activity_element" ADD CONSTRAINT "processing_activity_element_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_activity_element" ADD CONSTRAINT "processing_activity_element_activity_id_processing_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."processing_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "processing_activity_department" ON "processing_activity" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "processing_activity_element_activity" ON "processing_activity_element" USING btree ("activity_id");--> statement-breakpoint
SELECT enable_tenant_rls('processing_activity');
--> statement-breakpoint
SELECT enable_tenant_rls('processing_activity_element');
--> statement-breakpoint
-- RoPAs become process-focused (ADR-0008): each department's processing record becomes one
-- processing activity holding the department's data elements, so nothing recorded is lost.
-- Row-level security is forced on these tables, so the copy runs with every tenant visible.
SELECT set_config('app.all_tenants', 'on', true);
--> statement-breakpoint
INSERT INTO "processing_activity" (
	"tenant_id", "department_id", "ref", "name", "purpose", "lawful_bases", "systems",
	"internal_recipients", "recipients", "retention", "security", "transfers_abroad", "countries",
	"notes", "updated_by", "updated_at", "created_at"
)
SELECT p."tenant_id", p."department_id",
	row_number() OVER (PARTITION BY p."tenant_id" ORDER BY d."code"),
	d."name" || ' processing', p."purposes", p."lawful_bases", p."systems", p."shared_with",
	p."recipients", p."retention",
	CASE WHEN coalesce(p."security", '') = '' THEN '{}'::text[] ELSE ARRAY[p."security"] END,
	p."transfers_abroad", p."countries",
	'Moved from the department’s processing record when the RoPA became process-focused.',
	p."updated_by", p."updated_at", p."updated_at"
FROM "department_data_profile" p
JOIN "department" d ON d."id" = p."department_id";
--> statement-breakpoint
INSERT INTO "processing_activity_element" (
	"tenant_id", "activity_id", "element_code", "title", "category", "level", "seq"
)
SELECT e."tenant_id", a."id", e."element_code", e."title", e."category", e."level", e."seq"
FROM "department_data_element" e
JOIN "processing_activity" a ON a."department_id" = e."department_id";
--> statement-breakpoint
SELECT set_config('app.all_tenants', '', true);
