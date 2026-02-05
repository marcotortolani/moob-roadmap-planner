-- ============================================
-- FIX ADMIN USER PASSWORD
-- Execute this in Supabase SQL Editor
-- ============================================

-- IMPORTANT: Replace 'tu-email@example.com' and 'tu-nueva-password'

-- Update user with proper password encryption
UPDATE auth.users
SET
  encrypted_password = crypt('tu-nueva-password', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_token = '',
  email_change_confirm_status = 0,
  updated_at = NOW()
WHERE email = 'tu-email@example.com';

-- Verify the update
SELECT
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as is_confirmed,
  raw_user_meta_data
FROM auth.users
WHERE email = 'tu-email@example.com';
