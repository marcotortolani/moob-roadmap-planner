-- URGENTE: Fix infinite recursion in RLS policies

-- Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "System can insert users" ON users;

-- Simple policy: All authenticated users can read all user records
-- (We'll control what they can see in the application layer)
CREATE POLICY "Authenticated users can read users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their OWN profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = auth_user_id)
  WITH CHECK (auth.uid()::text = auth_user_id);

-- System can insert new users (during signup)
CREATE POLICY "System can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = auth_user_id);

-- Verify policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
