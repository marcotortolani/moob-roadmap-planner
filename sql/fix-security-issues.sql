-- ============================================================================
-- Fix ALL Supabase Security (5) + Performance (29) Advisories
-- ============================================================================
--
-- SECURITY fixes:
--   1. Enable RLS on product_history
--   2. Enable RLS on _prisma_migrations
--   3. Fix mutable search_path on log_product_created
--   4. Fix mutable search_path on log_product_updated
--   (5. Compromised password check → enable in Dashboard > Auth > Settings)
--
-- PERFORMANCE fixes:
--   A. Auth RLS Initialization Plan: wrap auth.uid() in (SELECT auth.uid())
--      so it's evaluated ONCE per query instead of per-row
--   B. Multiple Permissive Policies: replace ALL policies with specific
--      INSERT/UPDATE/DELETE to eliminate overlap with SELECT policies
--
-- Run this in Supabase SQL Editor as a single script.
-- ============================================================================

BEGIN;

-- ============================================================
-- SECURITY 1: Enable RLS on product_history
-- ============================================================

ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read product history" ON public.product_history;
CREATE POLICY "Authenticated users can read product history"
  ON public.product_history FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- SECURITY 2: Enable RLS on _prisma_migrations
-- ============================================================

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
-- No policies needed: only postgres role (Prisma CLI) accesses this table,
-- and postgres has BYPASSRLS privilege.

-- ============================================================
-- SECURITY 3+4: Fix mutable search_path on trigger functions
-- ============================================================

CREATE OR REPLACE FUNCTION log_product_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_history (
    id, product_id, change_type, field_name,
    old_value, new_value, changed_by_id, changed_at
  )
  VALUES (
    gen_random_uuid()::text, NEW.id, 'CREATED',
    NULL, NULL, NULL, NEW.created_by_id, NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION log_product_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.name IS DISTINCT FROM NEW.name) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'name', OLD.name, NEW.name, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.operator IS DISTINCT FROM NEW.operator) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'operator', OLD.operator, NEW.operator, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.country IS DISTINCT FROM NEW.country) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'country', OLD.country, NEW.country, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.language IS DISTINCT FROM NEW.language) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'language', OLD.language, NEW.language, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.start_date IS DISTINCT FROM NEW.start_date) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'start_date', OLD.start_date::text, NEW.start_date::text, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.end_date IS DISTINCT FROM NEW.end_date) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'end_date', OLD.end_date::text, NEW.end_date::text, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'status', OLD.status::text, NEW.status::text, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.productive_url IS DISTINCT FROM NEW.productive_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'productive_url', OLD.productive_url, NEW.productive_url, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.vercel_demo_url IS DISTINCT FROM NEW.vercel_demo_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'vercel_demo_url', OLD.vercel_demo_url, NEW.vercel_demo_url, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.wp_content_prod_url IS DISTINCT FROM NEW.wp_content_prod_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'wp_content_prod_url', OLD.wp_content_prod_url, NEW.wp_content_prod_url, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.wp_content_test_url IS DISTINCT FROM NEW.wp_content_test_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'wp_content_test_url', OLD.wp_content_test_url, NEW.wp_content_test_url, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.chatbot_url IS DISTINCT FROM NEW.chatbot_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'chatbot_url', OLD.chatbot_url, NEW.chatbot_url, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.comments IS DISTINCT FROM NEW.comments) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'comments', OLD.comments, NEW.comments, NEW.updated_by_id, NEW.updated_at);
  END IF;
  IF (OLD.card_color IS DISTINCT FROM NEW.card_color) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'card_color', OLD.card_color, NEW.card_color, NEW.updated_by_id, NEW.updated_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================
-- PERFORMANCE: Rebuild ALL RLS policies with (SELECT auth.uid())
-- and eliminate ALL-policy overlaps
-- ============================================================

-- Helper: The pattern (SELECT auth.uid()) evaluates auth.uid() once
-- per query instead of once per row. Major perf win on large tables.

-- ────────────────────────────────────────────────────────────
-- custom_urls: Replace ALL + SELECT with specific policies
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin and User can manage custom_urls" ON public.custom_urls;
DROP POLICY IF EXISTS "Everyone can read custom_urls" ON public.custom_urls;
DROP POLICY IF EXISTS "Admin and User can insert custom_urls" ON public.custom_urls;
DROP POLICY IF EXISTS "Admin and User can update custom_urls" ON public.custom_urls;
DROP POLICY IF EXISTS "Admin and User can delete custom_urls" ON public.custom_urls;

CREATE POLICY "Everyone can read custom_urls"
  ON public.custom_urls FOR SELECT
  USING (true);

CREATE POLICY "Admin and User can insert custom_urls"
  ON public.custom_urls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Admin and User can update custom_urls"
  ON public.custom_urls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Admin and User can delete custom_urls"
  ON public.custom_urls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

-- ────────────────────────────────────────────────────────────
-- holidays: Replace ALL + SELECT with specific policies
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin and User Can manage holidays" ON public.holidays;
DROP POLICY IF EXISTS "Everyone can read holidays" ON public.holidays;
DROP POLICY IF EXISTS "Admin and User can insert holidays" ON public.holidays;
DROP POLICY IF EXISTS "Admin and User can update holidays" ON public.holidays;
DROP POLICY IF EXISTS "Admin and User can delete holidays" ON public.holidays;

CREATE POLICY "Everyone can read holidays"
  ON public.holidays FOR SELECT
  USING (true);

CREATE POLICY "Admin and User can insert holidays"
  ON public.holidays FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Admin and User can update holidays"
  ON public.holidays FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Admin and User can delete holidays"
  ON public.holidays FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

-- ────────────────────────────────────────────────────────────
-- milestones: Replace ALL + SELECT with specific policies
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin and User can manage milestones" ON public.milestones;
DROP POLICY IF EXISTS "Everyone can read milestones" ON public.milestones;
DROP POLICY IF EXISTS "Admin and User can insert milestones" ON public.milestones;
DROP POLICY IF EXISTS "Admin and User can update milestones" ON public.milestones;
DROP POLICY IF EXISTS "Admin and User can delete milestones" ON public.milestones;

CREATE POLICY "Everyone can read milestones"
  ON public.milestones FOR SELECT
  USING (true);

CREATE POLICY "Admin and User can insert milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Admin and User can update milestones"
  ON public.milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Admin and User can delete milestones"
  ON public.milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

-- ────────────────────────────────────────────────────────────
-- invitations: Consolidate 2 SELECT policies, fix auth.uid()
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can read invitations" ON public.invitations;
DROP POLICY IF EXISTS "Public can read invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.invitations;

-- Consolidated SELECT: admin sees all, anyone can see PENDING (for token validation)
CREATE POLICY "Read invitations"
  ON public.invitations FOR SELECT
  USING (
    status = 'PENDING'::"InvitationStatus"
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );

CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );

-- ────────────────────────────────────────────────────────────
-- products: Fix auth.uid() in all policies (no overlap issue)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Everyone can read products" ON public.products;
DROP POLICY IF EXISTS "Admin and User can create products" ON public.products;
DROP POLICY IF EXISTS "Admin and User can update products" ON public.products;
DROP POLICY IF EXISTS "Only Admin can delete products" ON public.products;

CREATE POLICY "Everyone can read products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admin and User can create products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Admin and User can update products"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text IN ('ADMIN', 'USER')
    )
  );

CREATE POLICY "Only Admin can delete products"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );

-- ────────────────────────────────────────────────────────────
-- users: Consolidate 2 UPDATE policies, fix auth.uid()
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- INSERT: user can create own record, or trigger (SECURITY DEFINER bypasses RLS)
CREATE POLICY "Allow user creation"
  ON public.users FOR INSERT TO public
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())::text
    OR (SELECT auth.uid()) IS NULL
  );

-- SELECT: any authenticated user can read (internal tool)
CREATE POLICY "Authenticated users can read users"
  ON public.users FOR SELECT TO authenticated
  USING (true);

-- UPDATE: user updates own profile OR admin updates anyone
CREATE POLICY "Users and admins can update profiles"
  ON public.users FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid())::text = auth_user_id
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  )
  WITH CHECK (
    (SELECT auth.uid())::text = auth_user_id
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );

-- DELETE: admin can delete anyone except themselves
CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid())::text != auth_user_id
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );

COMMIT;

-- ============================================================
-- VERIFICATION (run after the transaction commits)
-- ============================================================

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies use (SELECT auth.uid()) pattern
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Check functions have search_path set
SELECT proname, proconfig
FROM pg_proc
WHERE proname IN ('log_product_created', 'log_product_updated', 'handle_new_user');
