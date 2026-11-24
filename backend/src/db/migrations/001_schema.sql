-- Migration 001: OCOP Đồng Nai Lên Sàn Core Schema (Dedicated private schema `ocop_app`)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS ocop_app;

-- 1. Users, Roles & Producer Memberships
CREATE TABLE IF NOT EXISTS ocop_app.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.role_memberships (
  user_id uuid NOT NULL REFERENCES ocop_app.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('seller', 'affiliate', 'ops')),
  granted_by uuid REFERENCES ocop_app.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS ocop_app.ocop_producers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  owner_name text NOT NULL,
  area text NOT NULL,
  ocop_stars smallint NOT NULL CHECK (ocop_stars IN (3, 4, 5)),
  cert_status_label text NOT NULL DEFAULT 'Đang đối chiếu hồ sơ pilot',
  cert_ref_no text,
  public_contact text,
  story text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  seed_tag text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.producer_memberships (
  producer_id uuid NOT NULL REFERENCES ocop_app.ocop_producers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES ocop_app.profiles(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'owner' CHECK (member_role IN ('owner', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (producer_id, user_id)
);

-- 2. Catalog, Media, Certifications & Marketplace Listings
CREATE TABLE IF NOT EXISTS ocop_app.product_categories (
  id text PRIMARY KEY,
  label text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ocop_app.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES ocop_app.ocop_producers(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES ocop_app.product_categories(id),
  sku text NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  search_normalized text NOT NULL DEFAULT '',
  unit text NOT NULL,
  spec text NOT NULL,
  area text NOT NULL,
  price_vnd integer NOT NULL CHECK (price_vnd >= 1000 AND price_vnd <= 500000000),
  price_updated_at timestamptz NOT NULL DEFAULT now(),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0 AND stock <= 1000000),
  commission_rate_bps integer NOT NULL CHECK (commission_rate_bps >= 0 AND commission_rate_bps <= 10000),
  commission_condition text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'needs_revision', 'published', 'archived')),
  review_note text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  story text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  media_kit_ready boolean NOT NULL DEFAULT false,
  seed_tag text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (producer_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_status_cat ON ocop_app.products (status, category_id);
CREATE INDEX IF NOT EXISTS idx_products_producer ON ocop_app.products (producer_id);

CREATE TABLE IF NOT EXISTS ocop_app.product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES ocop_app.products(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES ocop_app.ocop_producers(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'video/webm', 'video/mp4')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.ocop_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES ocop_app.ocop_producers(id) ON DELETE CASCADE,
  ref_no text NOT NULL,
  stars smallint NOT NULL CHECK (stars IN (3, 4, 5)),
  verification_status text NOT NULL DEFAULT 'unverified_pilot' CHECK (verification_status IN ('unverified_pilot', 'verified_pilot', 'verified_official', 'expired')),
  private_file_path text,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.product_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES ocop_app.products(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'shopee', 'lazada')),
  shop_id text NOT NULL,
  external_item_id text NOT NULL,
  listing_url text NOT NULL,
  is_demo_target boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, shop_id, external_item_id)
);

-- 3. Affiliate Links & Intentional Clicks
CREATE TABLE IF NOT EXISTS ocop_app.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  affiliate_user_id uuid NOT NULL REFERENCES ocop_app.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES ocop_app.products(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'shopee', 'lazada')),
  target_url text NOT NULL,
  is_demo_target boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  clicks_count integer NOT NULL DEFAULT 0 CHECK (clicks_count >= 0),
  seed_tag text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aff_links_user ON ocop_app.affiliate_links (affiliate_user_id);

CREATE TABLE IF NOT EXISTS ocop_app.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id uuid NOT NULL REFERENCES ocop_app.affiliate_links(id) ON DELETE CASCADE,
  intentional_cta boolean NOT NULL DEFAULT true,
  user_agent_hash text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Orders, Import Batches & Marketplace Webhook Events
CREATE TABLE IF NOT EXISTS ocop_app.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES ocop_app.profiles(id),
  producer_id uuid REFERENCES ocop_app.ocop_producers(id),
  total_rows integer NOT NULL DEFAULT 0,
  valid_rows integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'previewed' CHECK (status IN ('previewed', 'committed')),
  payload_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('tiktok', 'shopee', 'lazada')),
  shop_id text NOT NULL,
  external_order_id text NOT NULL,
  producer_id uuid NOT NULL REFERENCES ocop_app.ocop_producers(id),
  affiliate_link_id uuid REFERENCES ocop_app.affiliate_links(id),
  affiliate_user_id uuid REFERENCES ocop_app.profiles(id),
  attribution_status text NOT NULL DEFAULT 'unassigned' CHECK (attribution_status IN ('attributed', 'unassigned')),
  gross_amount_vnd integer NOT NULL CHECK (gross_amount_vnd >= 0 AND gross_amount_vnd <= 1000000000),
  net_amount_vnd integer NOT NULL CHECK (net_amount_vnd >= 0 AND net_amount_vnd <= 1000000000),
  commission_rate_bps integer NOT NULL CHECK (commission_rate_bps >= 0 AND commission_rate_bps <= 10000),
  commission_vnd integer NOT NULL CHECK (commission_vnd >= 0 AND commission_vnd <= 500000000),
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'completed', 'cancelled', 'refunded')),
  source text NOT NULL DEFAULT 'demo_fixture' CHECK (source IN ('demo_fixture', 'csv_import', 'partner_api')),
  import_batch_id uuid REFERENCES ocop_app.import_batches(id),
  ordered_at timestamptz NOT NULL DEFAULT now(),
  seed_tag text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, shop_id, external_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_producer ON ocop_app.orders (producer_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate ON ocop_app.orders (affiliate_user_id, ordered_at DESC);

CREATE TABLE IF NOT EXISTS ocop_app.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES ocop_app.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES ocop_app.products(id),
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 10000),
  unit_price_vnd integer NOT NULL CHECK (unit_price_vnd >= 0),
  commission_rate_bps integer NOT NULL CHECK (commission_rate_bps >= 0 AND commission_rate_bps <= 10000)
);

CREATE TABLE IF NOT EXISTS ocop_app.marketplace_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('tiktok', 'shopee', 'lazada')),
  external_event_id text NOT NULL,
  event_type text NOT NULL,
  event_timestamp timestamptz NOT NULL,
  raw_payload jsonb NOT NULL,
  processed_at timestamptz,
  UNIQUE (platform, external_event_id)
);

-- 5. Double-Entry Append-Only Commission Ledger & Payout Batches
CREATE TABLE IF NOT EXISTS ocop_app.commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_group_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES ocop_app.orders(id),
  affiliate_user_id uuid NOT NULL REFERENCES ocop_app.profiles(id),
  account_type text NOT NULL CHECK (account_type IN ('platform_escrow', 'affiliate_payable')),
  direction text NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount_vnd integer NOT NULL CHECK (amount_vnd > 0 AND amount_vnd <= 500000000),
  state text NOT NULL CHECK (state IN ('pending', 'available', 'paid', 'clawed_back')),
  reversal_of_tx_group_id uuid,
  note text NOT NULL DEFAULT '',
  seed_tag text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_aff ON ocop_app.commission_ledger (affiliate_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION ocop_app.prevent_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'commission_ledger is append-only; use a reversal entry instead';
END;
$$;

DROP TRIGGER IF EXISTS trg_commission_ledger_immutable ON ocop_app.commission_ledger;
CREATE TRIGGER trg_commission_ledger_immutable
BEFORE UPDATE OR DELETE ON ocop_app.commission_ledger
FOR EACH ROW EXECUTE FUNCTION ocop_app.prevent_ledger_mutation();

CREATE TABLE IF NOT EXISTS ocop_app.payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label text NOT NULL,
  total_amount_vnd integer NOT NULL CHECK (total_amount_vnd >= 0),
  status text NOT NULL DEFAULT 'simulated' CHECK (status IN ('simulated', 'approved', 'disbursed')),
  created_by uuid REFERENCES ocop_app.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id uuid NOT NULL REFERENCES ocop_app.payout_batches(id) ON DELETE CASCADE,
  affiliate_user_id uuid NOT NULL REFERENCES ocop_app.profiles(id),
  amount_vnd integer NOT NULL CHECK (amount_vnd > 0)
);

-- 6. Video Templates, Media Assets, Pilot Applications & Audit Logs
CREATE TABLE IF NOT EXISTS ocop_app.video_templates (
  id text PRIMARY KEY,
  duration_sec smallint NOT NULL CHECK (duration_sec IN (15, 30, 45)),
  title text NOT NULL,
  goal text NOT NULL,
  scenes_json jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS ocop_app.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES ocop_app.profiles(id),
  producer_id uuid REFERENCES ocop_app.ocop_producers(id),
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800),
  status text NOT NULL DEFAULT 'pending_upload' CHECK (status IN ('pending_upload', 'ready', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.pilot_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL,
  business_name text NOT NULL,
  area text NOT NULL,
  product_note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocop_app.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
