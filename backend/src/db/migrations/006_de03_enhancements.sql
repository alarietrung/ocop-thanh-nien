-- Migration 006: Additive schema for De 03 enhancements (safe & idempotent)
-- Adds optional referral tracking on direct orders plus tables for:
--   1. Bonus B: Farm visit booking requests (ocop_visit_requests)
--   2. Bonus C: Youth volunteer hours & farmer approval (ocop_volunteer_logs)
--   3. One-tap farmer support requests (ocop_support_requests)
--   4. Offline-synced voice season notes (ocop_season_notes)
-- Preserves all existing tables, triggers, RPCs, and RLS policies from 004_supabase_storefront.sql.

ALTER TABLE public.ocop_direct_orders
  ADD COLUMN IF NOT EXISTS referral_code text DEFAULT '' CHECK (length(referral_code) <= 32),
  ADD COLUMN IF NOT EXISTS fulfillment_label text DEFAULT '' CHECK (length(fulfillment_label) <= 240);

CREATE TABLE IF NOT EXISTS public.ocop_visit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id text NOT NULL REFERENCES public.ocop_gardens(id),
  visitor_name text NOT NULL CHECK (length(trim(visitor_name)) BETWEEN 2 AND 100),
  visitor_phone text NOT NULL CHECK (visitor_phone ~ '^\+?[0-9]{8,15}$'),
  visit_date date NOT NULL,
  time_slot text NOT NULL CHECK (length(trim(time_slot)) BETWEEN 3 AND 60),
  guests_count integer NOT NULL CHECK (guests_count BETWEEN 1 AND 30),
  package_name text NOT NULL CHECK (length(trim(package_name)) BETWEEN 3 AND 160),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ocop_visit_requests_producer_idx
  ON public.ocop_visit_requests (producer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ocop_volunteer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id text NOT NULL REFERENCES public.ocop_gardens(id),
  member_code text NOT NULL CHECK (length(trim(member_code)) BETWEEN 2 AND 60),
  member_name text NOT NULL CHECK (length(trim(member_name)) BETWEEN 2 AND 120),
  activity_date date NOT NULL,
  task_title text NOT NULL CHECK (length(trim(task_title)) BETWEEN 3 AND 200),
  hours numeric(4,1) NOT NULL CHECK (hours >= 0.5 AND hours <= 12.0),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note text NOT NULL DEFAULT '' CHECK (length(review_note) <= 300),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ocop_volunteer_logs_producer_status_idx
  ON public.ocop_volunteer_logs (producer_id, status, activity_date DESC);
CREATE INDEX IF NOT EXISTS ocop_volunteer_logs_member_idx
  ON public.ocop_volunteer_logs (member_code, status);

CREATE TABLE IF NOT EXISTS public.ocop_support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id text NOT NULL REFERENCES public.ocop_gardens(id),
  topic text NOT NULL CHECK (length(trim(topic)) BETWEEN 3 AND 160),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'done')),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ocop_support_requests_producer_idx
  ON public.ocop_support_requests (producer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ocop_season_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code text NOT NULL REFERENCES public.ocop_catalog(batch_code),
  producer_id text NOT NULL REFERENCES public.ocop_gardens(id),
  stage text NOT NULL CHECK (length(trim(stage)) BETWEEN 2 AND 120),
  detail text NOT NULL CHECK (length(trim(detail)) BETWEEN 3 AND 600),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ocop_season_notes_batch_idx
  ON public.ocop_season_notes (batch_code, recorded_at DESC);

ALTER TABLE public.ocop_visit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocop_volunteer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocop_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocop_season_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ocop_visit_requests, public.ocop_volunteer_logs,
  public.ocop_support_requests, public.ocop_season_notes FROM PUBLIC, anon, authenticated;

GRANT INSERT (producer_id, visitor_name, visitor_phone, visit_date, time_slot, guests_count, package_name, note)
  ON public.ocop_visit_requests TO anon, authenticated;
GRANT SELECT, UPDATE (status) ON public.ocop_visit_requests TO authenticated;

GRANT SELECT ON public.ocop_volunteer_logs TO authenticated;
GRANT INSERT (producer_id, member_code, member_name, activity_date, task_title, hours, note)
  ON public.ocop_volunteer_logs TO authenticated;
GRANT UPDATE (status, review_note, reviewed_by, reviewed_at)
  ON public.ocop_volunteer_logs TO authenticated;

GRANT SELECT, INSERT (producer_id, topic, note), UPDATE (status)
  ON public.ocop_support_requests TO authenticated;

GRANT SELECT ON public.ocop_season_notes TO anon, authenticated;
GRANT INSERT (batch_code, producer_id, stage, detail, recorded_at)
  ON public.ocop_season_notes TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_visit_requests' AND policyname = 'ocop_visit_insert') THEN
    CREATE POLICY ocop_visit_insert ON public.ocop_visit_requests FOR INSERT TO anon, authenticated
      WITH CHECK (status = 'requested');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_visit_requests' AND policyname = 'ocop_visit_seller_manage') THEN
    CREATE POLICY ocop_visit_seller_manage ON public.ocop_visit_requests FOR ALL TO authenticated
      USING (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid())))
      WITH CHECK (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid())));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_volunteer_logs' AND policyname = 'ocop_volunteer_select') THEN
    CREATE POLICY ocop_volunteer_select ON public.ocop_volunteer_logs FOR SELECT TO authenticated
      USING (
        created_by = (SELECT auth.uid())
        OR producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid()))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_volunteer_logs' AND policyname = 'ocop_volunteer_insert') THEN
    CREATE POLICY ocop_volunteer_insert ON public.ocop_volunteer_logs FOR INSERT TO authenticated
      WITH CHECK (created_by = (SELECT auth.uid()) AND status = 'pending');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_volunteer_logs' AND policyname = 'ocop_volunteer_seller_review') THEN
    CREATE POLICY ocop_volunteer_seller_review ON public.ocop_volunteer_logs FOR UPDATE TO authenticated
      USING (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid())))
      WITH CHECK (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid())));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_support_requests' AND policyname = 'ocop_support_seller_rw') THEN
    CREATE POLICY ocop_support_seller_rw ON public.ocop_support_requests FOR ALL TO authenticated
      USING (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid())))
      WITH CHECK (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid())));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_season_notes' AND policyname = 'ocop_season_notes_public_read') THEN
    CREATE POLICY ocop_season_notes_public_read ON public.ocop_season_notes FOR SELECT TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ocop_season_notes' AND policyname = 'ocop_season_notes_seller_insert') THEN
    CREATE POLICY ocop_season_notes_seller_insert ON public.ocop_season_notes FOR INSERT TO authenticated
      WITH CHECK (producer_id IN (SELECT m.producer_id FROM public.ocop_seller_memberships m WHERE m.user_id = (SELECT auth.uid())));
  END IF;
END $$;
