ALTER TABLE "breach" ADD COLUMN "reported_by" text;--> statement-breakpoint
ALTER TABLE "breach" ADD COLUMN "report_channel" text;--> statement-breakpoint
ALTER TABLE "breach" ADD COLUMN "detected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "breach" ADD COLUMN "records_affected" integer;--> statement-breakpoint
ALTER TABLE "breach" ADD COLUMN "children_affected" integer;--> statement-breakpoint
ALTER TABLE "breach" ADD COLUMN "review_on" date;--> statement-breakpoint
ALTER TABLE "breach" ADD COLUMN "lessons" text;--> statement-breakpoint
ALTER TABLE "rights_request" ADD COLUMN "requester_role" text;--> statement-breakpoint
ALTER TABLE "rights_request" ADD COLUMN "verification_method" text;--> statement-breakpoint
ALTER TABLE "rights_request" ADD COLUMN "verified_on" date;--> statement-breakpoint
ALTER TABLE "rights_request" ADD COLUMN "acknowledged_on" date;--> statement-breakpoint
ALTER TABLE "rights_request" ADD COLUMN "letter_ref" text;