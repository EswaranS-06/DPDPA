-- Multi-tenant visibility. A transaction sees a tenant's rows when it is scoped to that tenant
-- (app.tenant_id), lists it (app.tenant_ids, comma separated), or is a firm-wide session
-- (app.all_tenants = 'on'). Unset settings see nothing.
CREATE OR REPLACE FUNCTION tenant_visible(target uuid) RETURNS boolean
  LANGUAGE sql STABLE
  AS $$
    SELECT coalesce(current_setting('app.all_tenants', true), '') = 'on'
      OR coalesce(target = current_tenant_id(), false)
      OR coalesce(
        target = ANY (string_to_array(nullif(current_setting('app.tenant_ids', true), ''), ',')::uuid[]),
        false)
  $$;
--> statement-breakpoint
DROP POLICY tenant_isolation ON tenant;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON tenant
  USING (tenant_visible(id)) WITH CHECK (tenant_visible(id));
--> statement-breakpoint
DROP POLICY tenant_isolation ON legal_entity;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON legal_entity
  USING (tenant_visible(tenant_id)) WITH CHECK (tenant_visible(tenant_id));
--> statement-breakpoint
DROP POLICY tenant_isolation ON code_sequence;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON code_sequence
  USING (tenant_visible(tenant_id)) WITH CHECK (tenant_visible(tenant_id));
--> statement-breakpoint
-- The audit log is append-only for the application.
REVOKE UPDATE, DELETE, TRUNCATE ON audit_event FROM duatf_app;
