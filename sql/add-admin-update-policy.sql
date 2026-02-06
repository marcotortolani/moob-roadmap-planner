-- Consolidated UPDATE policy for users table
-- Replaces separate "own profile" and "admin update" policies

DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON users;

CREATE POLICY "Users and admins can update profiles"
  ON users FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid())::text = auth_user_id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  )
  WITH CHECK (
    (SELECT auth.uid())::text = auth_user_id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );
