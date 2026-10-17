CREATE TABLE "client_maturity_target" (
	"tenant_id" uuid NOT NULL,
	"domain_code" text NOT NULL,
	"target" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_maturity_target_tenant_id_domain_code_pk" PRIMARY KEY("tenant_id","domain_code"),
	CONSTRAINT "client_maturity_target_range" CHECK ("client_maturity_target"."target" between 0 and 4)
);
--> statement-breakpoint
ALTER TABLE "client_maturity_target" ADD CONSTRAINT "client_maturity_target_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
SELECT enable_tenant_rls('client_maturity_target');
