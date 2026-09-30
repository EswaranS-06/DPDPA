-- Row-level security for tenant tables, grants for the non-owner app role,
-- and guards that make published framework releases immutable.
-- Superusers bypass RLS, so the application must connect as the app role (duatf_app).
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid $$;
--> statement-breakpoint
ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tenant FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON tenant
  USING (id = current_tenant_id()) WITH CHECK (id = current_tenant_id());
--> statement-breakpoint
ALTER TABLE legal_entity ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE legal_entity FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON legal_entity
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
--> statement-breakpoint
ALTER TABLE code_sequence ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE code_sequence FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON code_sequence
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
--> statement-breakpoint
CREATE OR REPLACE FUNCTION framework_release_guard() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF OLD.status IN ('published', 'superseded') THEN
    IF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status = 'superseded'
       AND NEW.id = OLD.id AND NEW.version = OLD.version THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Framework release % is % and cannot be changed', OLD.version, OLD.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER framework_release_guard
  BEFORE UPDATE OR DELETE ON framework_release
  FOR EACH ROW EXECUTE FUNCTION framework_release_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION framework_content_guard() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
DECLARE
  old_status text;
  new_status text;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO old_status FROM framework_release WHERE id = OLD.release_id;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    SELECT status INTO new_status FROM framework_release WHERE id = NEW.release_id;
  END IF;
  IF old_status IN ('published', 'superseded') OR new_status IN ('published', 'superseded') THEN
    RAISE EXCEPTION 'Rows of a % framework release cannot be changed (table %)',
      COALESCE(old_status, new_status), TG_TABLE_NAME
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DO $$
DECLARE
  target text;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'instrument', 'lawful_basis', 'domain', 'obligation', 'control', 'obligation_control',
    'acceptance_criterion', 'interpretation_decision', 'process_template', 'sector_overlay',
    'sector_law', 'retention_anchor', 'data_element', 'vocabulary', 'vocabulary_term',
    'pbc_item', 'stuck_point', 'scoping_question', 'discovery_question', 'playbook_doc',
    'notification_entry'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER framework_content_guard BEFORE INSERT OR UPDATE OR DELETE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION framework_content_guard()', target);
  END LOOP;
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO duatf_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO duatf_app;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO duatf_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO duatf_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO duatf_app;
