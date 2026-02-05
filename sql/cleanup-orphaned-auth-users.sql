-- ============================================================================
-- Cleanup orphaned auth.users that don't have corresponding records in users table
-- This happens when the trigger fails during signup
-- ============================================================================

-- Find orphaned auth users (in auth.users but not in public.users)
SELECT
  '⚠️ Found orphaned auth user: ' || au.email as warning,
  au.id as auth_user_id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- If you see any orphaned users above, you can delete them using Supabase Dashboard:
-- Go to Authentication → Users → Find the user → Delete

-- Alternatively, if you have the service role key, you can use the admin API:
-- await supabase.auth.admin.deleteUser(auth_user_id)
