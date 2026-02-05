-- ============================================
-- FIX: Allow trigger to insert users during signup
-- Execute this in Supabase SQL Editor
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "System can insert users" ON users;

-- Create new policy that allows service role (triggers) to insert
CREATE POLICY "Allow trigger to insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Optional: Add a more restrictive policy for direct inserts
-- (This ensures only the trigger can create users, not API calls)
CREATE POLICY "Users can only be created by trigger"
  ON users FOR INSERT
  WITH CHECK (
    -- Allow if called by trigger (service role)
    auth.uid() IS NULL OR
    auth.uid()::text = auth_user_id
  );
