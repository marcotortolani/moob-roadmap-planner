-- ============================================================================
-- Verify current trigger and policy status
-- ============================================================================

-- 1. Check trigger exists and is enabled
SELECT
  'TRIGGER STATUS' as check_type,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users'
  AND event_object_schema = 'auth';

-- 2. Check trigger function exists
SELECT
  'FUNCTION EXISTS' as check_type,
  proname,
  prosecdef as security_definer,
  provolatile
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;

-- 3. Check INSERT RLS policy
SELECT
  'RLS INSERT POLICY' as check_type,
  policyname,
  cmd,
  with_check::text
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public'
  AND cmd = 'INSERT';

-- 4. Confirm orphaned user
SELECT
  'ORPHANED USER CHECK' as check_type,
  au.id as auth_user_id,
  au.email,
  au.created_at,
  CASE
    WHEN u.id IS NULL THEN '❌ ORPHANED (no public.users record)'
    ELSE '✅ OK (has public.users record)'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE au.id::text = '6590eb51-2a05-4fac-ba85-6e1457df1b17';
