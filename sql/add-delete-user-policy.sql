-- Add RLS policy to allow admins to delete users
-- This policy allows admin users to delete other users from the users table

DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE TO authenticated
  USING (
    -- Allow deletion if the requesting user is an admin
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
    -- And prevent self-deletion (though API also checks this)
    AND auth.uid()::text != auth_user_id
  );

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'DELETE';
