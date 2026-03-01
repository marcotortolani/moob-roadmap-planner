-- ============================================================================
-- Cleanup: Remove Duplicate Indexes & Optimize Remaining RLS Policies
-- ============================================================================
--
-- This script:
-- 1. Removes duplicate indexes (keeps our optimized idx_* indexes)
-- 2. Optimizes RLS policies for operators and product_names tables
--
-- Safe to run: Only removes redundant indexes and improves performance
-- ============================================================================

-- ────────────────────────────────────────────────────────────
-- PART 1: Remove Duplicate Indexes
-- ────────────────────────────────────────────────────────────

-- invitations: Remove old token indexes (keep idx_invitations_token)
DROP INDEX IF EXISTS public.invitations_token_idx;
DROP INDEX IF EXISTS public.invitations_token_key;

-- operators: Remove old normalized_name indexes (keep idx_operators_normalized_name)
DROP INDEX IF EXISTS public.operators_normalized_name_idx;
DROP INDEX IF EXISTS public.operators_normalized_name_key;

-- product_names: Remove old normalized_name indexes (keep idx_product_names_normalized_name)
DROP INDEX IF EXISTS public.product_names_normalized_name_idx;
DROP INDEX IF EXISTS public.product_names_normalized_name_key;

-- products: Remove old operator and status indexes
DROP INDEX IF EXISTS public.products_operator_idx;
DROP INDEX IF EXISTS public.products_status_idx;

-- users: Remove old email and role indexes
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_role_idx;

-- ────────────────────────────────────────────────────────────
-- PART 2: Optimize RLS Policies for operators table
-- ────────────────────────────────────────────────────────────

-- Drop old policies
DROP POLICY IF EXISTS "operators_insert_policy" ON public.operators;
DROP POLICY IF EXISTS "operators_select_policy" ON public.operators;
DROP POLICY IF EXISTS "operators_update_policy" ON public.operators;

-- Create optimized policies with (SELECT auth.uid())
CREATE POLICY "Everyone can read operators"
  ON public.operators FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert operators"
  ON public.operators FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update operators"
  ON public.operators FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ────────────────────────────────────────────────────────────
-- PART 3: Optimize RLS Policies for product_names table
-- ────────────────────────────────────────────────────────────

-- Drop old policies
DROP POLICY IF EXISTS "product_names_insert_policy" ON public.product_names;
DROP POLICY IF EXISTS "product_names_select_policy" ON public.product_names;
DROP POLICY IF EXISTS "product_names_update_policy" ON public.product_names;

-- Create optimized policies with (SELECT auth.uid())
CREATE POLICY "Everyone can read product_names"
  ON public.product_names FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert product_names"
  ON public.product_names FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update product_names"
  ON public.product_names FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ────────────────────────────────────────────────────────────
-- VERIFICATION
-- ────────────────────────────────────────────────────────────

-- Verify no duplicate indexes remain
SELECT
  tablename,
  COUNT(*) as index_count,
  array_agg(indexname ORDER BY indexname) as indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('invitations', 'operators', 'product_names', 'products', 'users')
GROUP BY tablename
ORDER BY tablename;

-- Verify optimized policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('operators', 'product_names')
ORDER BY tablename, cmd;

-- Summary: Count indexes per table
SELECT
  tablename,
  COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
