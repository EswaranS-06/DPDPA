CREATE TABLE "kb_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"section" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"change" text NOT NULL,
	"detail" text,
	"actor_user_id" uuid,
	"actor_name" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_entry_review" (
	"release_id" uuid NOT NULL,
	"section" text NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'awaiting_review' NOT NULL,
	"origin" text NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	CONSTRAINT "kb_entry_review_pk" PRIMARY KEY("release_id","section","code")
);
--> statement-breakpoint
ALTER TABLE "kb_change" ADD CONSTRAINT "kb_change_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_entry_review" ADD CONSTRAINT "kb_entry_review_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TRIGGER framework_content_guard BEFORE INSERT OR UPDATE OR DELETE ON kb_entry_review
  FOR EACH ROW EXECUTE FUNCTION framework_content_guard();
--> statement-breakpoint
CREATE TRIGGER framework_content_guard BEFORE INSERT OR UPDATE OR DELETE ON kb_change
  FOR EACH ROW EXECUTE FUNCTION framework_content_guard();
