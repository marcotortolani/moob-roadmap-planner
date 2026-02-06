-- RLS policy: admin can delete any user except themselves

DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid())::text != auth_user_id
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = (SELECT auth.uid())::text
        AND u.role::text = 'ADMIN'
    )
  );
