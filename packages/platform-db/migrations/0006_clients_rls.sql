-- Row-level security for client tables. enable_tenant_rls() is reused by later migrations.
CREATE OR REPLACE FUNCTION enable_tenant_rls(target regclass) RETURNS void
  LANGUAGE plpgsql
  AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', target);
  EXECUTE format(
    'CREATE POLICY tenant_isolation ON %s USING (tenant_visible(tenant_id)) WITH CHECK (tenant_visible(tenant_id))',
    target);
END
$$;
--> statement-breakpoint
SELECT enable_tenant_rls('client_profile');
--> statement-breakpoint
SELECT enable_tenant_rls('department');
