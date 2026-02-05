-- First, check current RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "System can insert users" ON users;
DROP POLICY IF EXISTS "Only Admin can delete products" ON users;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (auth.uid()::text = auth_user_id);

-- Policy 2: Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  );

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = auth_user_id)
  WITH CHECK (auth.uid()::text = auth_user_id);

-- Policy 4: System can insert users (for signup)
CREATE POLICY "System can insert users"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = auth_user_id);

-- Verify all policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query: This should work if policies are correct
-- Run this after executing the above to verify
SELECT id, email, first_name, last_name, role
FROM users
WHERE auth_user_id = auth.uid()::text;
