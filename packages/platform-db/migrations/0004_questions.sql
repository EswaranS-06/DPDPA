CREATE TABLE "question" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"seq" integer NOT NULL,
	"control_code" text NOT NULL,
	"domain_code" text NOT NULL,
	"text" text NOT NULL,
	"guidance" text NOT NULL,
	"recommendation" text NOT NULL,
	"obligation_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"references" text[] DEFAULT '{}'::text[] NOT NULL,
	"applicability" jsonb NOT NULL,
	"risk_weight" integer NOT NULL,
	"evidence_required" text[] DEFAULT '{}'::text[] NOT NULL,
	"evidence_recommended" text[] DEFAULT '{}'::text[] NOT NULL,
	"evidence_supporting" text[] DEFAULT '{}'::text[] NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	CONSTRAINT "question_pk" PRIMARY KEY("release_id","code"),
	CONSTRAINT "question_release_control" UNIQUE("release_id","control_code")
);
--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Questions belong to a framework release and are frozen with it.
CREATE TRIGGER framework_content_guard BEFORE INSERT OR UPDATE OR DELETE ON question
  FOR EACH ROW EXECUTE FUNCTION framework_content_guard();
