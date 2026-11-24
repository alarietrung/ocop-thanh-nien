-- Migration 002: Least-Privilege Grants, Transaction-Scoped Actor Helpers & Default-Deny RLS
-- Do NOT expose `ocop_app` in Supabase PostgREST Data API settings.

REVOKE ALL ON SCHEMA ocop_app FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA ocop_app FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA ocop_app FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA ocop_app FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA ocop_app FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA ocop_app FROM authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ocop_runtime') THEN
    CREATE ROLE ocop_runtime NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA ocop_app TO ocop_runtime;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ocop_app TO ocop_runtime;
-- Append-only ledger: deny UPDATE/DELETE even at role grant level
REVOKE UPDATE, DELETE ON ocop_app.commission_ledger FROM ocop_runtime;
REVOKE UPDATE, DELETE ON ocop_app.audit_logs FROM ocop_runtime;

CREATE OR REPLACE FUNCTION ocop_app.current_actor_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('ocop.actor_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION ocop_app.current_actor_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('ocop.actor_role', true), ''), 'public');
$$;

CREATE OR REPLACE FUNCTION ocop_app.is_producer_member(target_producer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM ocop_app.producer_memberships pm
    WHERE pm.producer_id = target_producer_id
      AND pm.user_id = ocop_app.current_actor_id()
  );
$$;

-- Enable RLS (Default-Deny) on all domain tables
ALTER TABLE ocop_app.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.role_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.ocop_producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.producer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.ocop_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.product_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.pilot_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocop_app.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS producers_public_read ON ocop_app.ocop_producers;
CREATE POLICY producers_public_read ON ocop_app.ocop_producers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS products_read_policy ON ocop_app.products;
CREATE POLICY products_read_policy ON ocop_app.products
  FOR SELECT USING (
    status = 'published'
    OR ocop_app.current_actor_role() = 'ops'
    OR ocop_app.is_producer_member(producer_id)
  );

DROP POLICY IF EXISTS products_write_policy ON ocop_app.products;
CREATE POLICY products_write_policy ON ocop_app.products
  FOR ALL USING (
    ocop_app.current_actor_role() = 'ops'
    OR ocop_app.is_producer_member(producer_id)
  )
  WITH CHECK (
    ocop_app.current_actor_role() = 'ops'
    OR ocop_app.is_producer_member(producer_id)
  );

DROP POLICY IF EXISTS listings_read_policy ON ocop_app.product_listings;
CREATE POLICY listings_read_policy ON ocop_app.product_listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ocop_app.products p
      WHERE p.id = product_id
        AND (p.status = 'published' OR ocop_app.current_actor_role() = 'ops' OR ocop_app.is_producer_member(p.producer_id))
    )
  );

DROP POLICY IF EXISTS aff_links_policy ON ocop_app.affiliate_links;
CREATE POLICY aff_links_policy ON ocop_app.affiliate_links
  FOR ALL USING (
    ocop_app.current_actor_role() IN ('ops', 'public')
    OR affiliate_user_id = ocop_app.current_actor_id()
  )
  WITH CHECK (
    ocop_app.current_actor_role() = 'ops'
    OR affiliate_user_id = ocop_app.current_actor_id()
  );

DROP POLICY IF EXISTS orders_scope_policy ON ocop_app.orders;
CREATE POLICY orders_scope_policy ON ocop_app.orders
  FOR ALL USING (
    ocop_app.current_actor_role() = 'ops'
    OR ocop_app.is_producer_member(producer_id)
    OR affiliate_user_id = ocop_app.current_actor_id()
  )
  WITH CHECK (
    ocop_app.current_actor_role() = 'ops'
    OR ocop_app.is_producer_member(producer_id)
  );

DROP POLICY IF EXISTS ledger_scope_policy ON ocop_app.commission_ledger;
CREATE POLICY ledger_scope_policy ON ocop_app.commission_ledger
  FOR SELECT USING (
    ocop_app.current_actor_role() = 'ops'
    OR affiliate_user_id = ocop_app.current_actor_id()
  );

DROP POLICY IF EXISTS ledger_insert_policy ON ocop_app.commission_ledger;
CREATE POLICY ledger_insert_policy ON ocop_app.commission_ledger
  FOR INSERT WITH CHECK (
    ocop_app.current_actor_role() IN ('ops', 'seller')
  );

DROP POLICY IF EXISTS pilot_app_insert ON ocop_app.pilot_applications;
CREATE POLICY pilot_app_insert ON ocop_app.pilot_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS pilot_app_ops_read ON ocop_app.pilot_applications;
CREATE POLICY pilot_app_ops_read ON ocop_app.pilot_applications
  FOR SELECT USING (ocop_app.current_actor_role() = 'ops');

DROP POLICY IF EXISTS audit_ops_policy ON ocop_app.audit_logs;
CREATE POLICY audit_ops_policy ON ocop_app.audit_logs
  FOR ALL USING (ocop_app.current_actor_role() = 'ops')
  WITH CHECK (true);
