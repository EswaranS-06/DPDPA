ALTER TABLE "remediation_action" ADD COLUMN "phase" integer;--> statement-breakpoint
ALTER TABLE "remediation_action" ADD COLUMN "effort_days" real;--> statement-breakpoint
ALTER TABLE "remediation_action" ADD CONSTRAINT "remediation_action_phase" CHECK ("remediation_action"."phase" between 1 and 3);