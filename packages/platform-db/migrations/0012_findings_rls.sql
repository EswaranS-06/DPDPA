SELECT enable_tenant_rls('finding');
--> statement-breakpoint
SELECT enable_tenant_rls('finding_event');
--> statement-breakpoint
SELECT enable_tenant_rls('risk');
--> statement-breakpoint
-- Default risk bands for likelihood x impact (1-25); firm administrators can change them.
INSERT INTO risk_band (name, min_score, max_score, tone, seq) VALUES
  ('Low', 1, 4, 'live', 0),
  ('Medium', 5, 9, 'pending', 1),
  ('High', 10, 16, 'severe', 2),
  ('Critical', 17, 25, 'severe', 3);
