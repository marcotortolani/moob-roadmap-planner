-- Add policy for ADMIN to update other users

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = auth_user_id)
  WITH CHECK (auth.uid()::text = auth_user_id);

-- NEW: Add policy for ADMIN to update ANY user
CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  );

-- Verify policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
