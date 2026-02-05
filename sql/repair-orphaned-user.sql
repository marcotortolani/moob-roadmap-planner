-- ============================================================================
-- Repair specific orphaned user
-- Creates public.users record for auth user 6590eb51-2a05-4fac-ba85-6e1457df1b17
-- ============================================================================

-- Repair the orphaned user by manually creating the public.users record
INSERT INTO public.users (
  id,
  auth_user_id,
  email,
  role,
  first_name,
  last_name,
  avatar_url,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid()::text,  -- Generate UUID as ID (cuid not available in SQL)
  au.id::text,
  au.email,
  COALESCE(
    (au.raw_user_meta_data->>'role')::public."Role",
    'USER'::public."Role"
  ),
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  au.raw_user_meta_data->>'avatar_url',
  au.created_at,
  now()
FROM auth.users au
WHERE au.id::text = '6590eb51-2a05-4fac-ba85-6e1457df1b17'
ON CONFLICT (auth_user_id) DO NOTHING;

-- Verify repair
SELECT
  '✅ USER REPAIRED' as status,
  u.id,
  u.auth_user_id,
  u.email,
  u.role,
  u.first_name,
  u.last_name,
  u.created_at
FROM public.users u
WHERE u.auth_user_id = '6590eb51-2a05-4fac-ba85-6e1457df1b17';
