CREATE TABLE "department_data_element" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"element_code" text,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"source" text,
	"storage" text,
	"security" text,
	"access" text,
	"seq" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "department_data_element_title" UNIQUE("department_id","title"),
	CONSTRAINT "department_data_element_level" CHECK ("department_data_element"."level" in ('L1', 'L2', 'L3', 'L4'))
);
--> statement-breakpoint
CREATE TABLE "department_data_profile" (
	"department_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"purposes" text,
	"lawful_bases" text[] DEFAULT '{}'::text[] NOT NULL,
	"systems" text[] DEFAULT '{}'::text[] NOT NULL,
	"shared_with" text[] DEFAULT '{}'::text[] NOT NULL,
	"recipients" text[] DEFAULT '{}'::text[] NOT NULL,
	"transfers_abroad" text DEFAULT 'unknown' NOT NULL,
	"countries" text,
	"retention" text,
	"security" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "department_data_element" ADD CONSTRAINT "department_data_element_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_data_element" ADD CONSTRAINT "department_data_element_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_data_profile" ADD CONSTRAINT "department_data_profile_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_data_profile" ADD CONSTRAINT "department_data_profile_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "department_data_element_department" ON "department_data_element" USING btree ("department_id");--> statement-breakpoint
SELECT enable_tenant_rls('department_data_element');
--> statement-breakpoint
SELECT enable_tenant_rls('department_data_profile');
