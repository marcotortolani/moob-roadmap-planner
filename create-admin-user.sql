-- ============================================
-- CREATE FIRST ADMIN USER
-- Execute this AFTER creating the user in Supabase Auth UI
-- ============================================

-- IMPORTANT: First create the user via Supabase Dashboard:
-- 1. Go to: Authentication → Users
-- 2. Click "Add user"
-- 3. Enter email and password
-- 4. Enable "Auto Confirm User"
-- 5. Click "Create user"
-- 6. Then run this SQL, replacing 'your-email@example.com' with the actual email

-- Update user metadata to be ADMIN
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'ADMIN',
  'first_name', 'Admin',
  'last_name', 'User'
)
WHERE email = 'your-email@example.com';

-- Manually create the user record in the users table
INSERT INTO users (auth_user_id, email, role, first_name, last_name)
SELECT
  id::text,
  email,
  'ADMIN'::role,
  'Admin',
  'User'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (auth_user_id) DO UPDATE
SET role = 'ADMIN';
