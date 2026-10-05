CREATE TABLE "questionnaire" (
	"release_id" uuid NOT NULL,
	"code" text NOT NULL,
	"seq" integer NOT NULL,
	"title" text NOT NULL,
	"respondent" text NOT NULL,
	"description" text NOT NULL,
	"source_file" text,
	CONSTRAINT "questionnaire_pk" PRIMARY KEY("release_id","code")
);
--> statement-breakpoint
ALTER TABLE "question" DROP CONSTRAINT "question_release_control";--> statement-breakpoint
ALTER TABLE "app_user" DROP CONSTRAINT "app_user_keycloak_id_unique";--> statement-breakpoint
ALTER TABLE "assessment_item" DROP CONSTRAINT "assessment_item_question";--> statement-breakpoint
ALTER TABLE "assessment_item" drop column "compliance_state";--> statement-breakpoint
ALTER TABLE "assessment_item" ADD COLUMN "compliance_state" text GENERATED ALWAYS AS (case answer when 'yes' then 'compliant' when 'partial' then 'potential_gap' when 'no' then 'gap' when 'not_applicable' then 'excluded' when 'recorded' then 'informational' else 'pending' end) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "questionnaire_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "section" text NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "control_codes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "answer_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "options" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "scored" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "risk_level" text NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "source_ref" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "attachment_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "mapping_note" text;--> statement-breakpoint
ALTER TABLE "assessment_item" ADD COLUMN "response" jsonb;--> statement-breakpoint
ALTER TABLE "questionnaire" ADD CONSTRAINT "questionnaire_release_id_framework_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."framework_release"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user" DROP COLUMN "keycloak_id";--> statement-breakpoint
ALTER TABLE "user_session" DROP COLUMN "id_token";--> statement-breakpoint
ALTER TABLE "assessment_item" ADD CONSTRAINT "assessment_item_question_department" UNIQUE NULLS NOT DISTINCT("assessment_id","question_code","department_id");--> statement-breakpoint
CREATE TRIGGER framework_content_guard BEFORE INSERT OR UPDATE OR DELETE ON questionnaire
  FOR EACH ROW EXECUTE FUNCTION framework_content_guard();
