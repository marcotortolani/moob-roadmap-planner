-- Fix RLS policy to allow trigger to insert users
-- The trigger runs as SECURITY DEFINER, so it needs a policy that allows inserts

-- Drop old policy if exists
DROP POLICY IF EXISTS "System can insert users" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

-- Create new policy that allows:
-- 1. Trigger inserts (when auth_user_id matches the new user being created)
-- 2. The user themselves can insert their own record
CREATE POLICY "Allow user creation"
  ON users FOR INSERT TO public
  WITH CHECK (
    -- Allow if the auth_user_id being inserted matches the current auth.uid()
    -- This covers both the trigger case and direct inserts
    auth_user_id = (auth.uid())::text
    OR
    -- Allow if there's no current auth.uid() (shouldn't happen, but safe fallback)
    auth.uid() IS NULL
  );

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';
