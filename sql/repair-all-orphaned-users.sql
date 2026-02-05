-- ============================================================================
-- Repair ALL orphaned users (not just the one specific case)
-- ============================================================================

-- Show count before repair
SELECT
  'BEFORE REPAIR' as status,
  count(*) as orphaned_count
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE u.id IS NULL;

-- Repair all orphaned users
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
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE u.id IS NULL
ON CONFLICT (auth_user_id) DO NOTHING;

-- Show count after repair
SELECT
  'AFTER REPAIR' as status,
  count(*) as orphaned_count
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE u.id IS NULL;

-- Show repaired users
SELECT
  '✅ REPAIRED USERS' as status,
  u.id,
  u.email,
  u.role,
  u.created_at as original_created,
  u.updated_at as repaired_at
FROM public.users u
WHERE u.updated_at > u.created_at + interval '1 minute'
  AND u.created_at < now() - interval '1 hour'
ORDER BY u.updated_at DESC;
