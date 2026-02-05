-- ============================================
-- CREATE ADMIN USER MANUALLY (bypassing trigger)
-- Execute this in Supabase SQL Editor
-- ============================================

-- IMPORTANT: Replace these values:
-- - 'admin@tuempresa.com' with your email
-- - 'tu-password-seguro' with your password

-- Step 1: Create user in auth.users
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users (this creates the authentication user)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@tuempresa.com', -- REPLACE THIS
    crypt('tu-password-seguro', gen_salt('bf')), -- REPLACE THIS
    NOW(),
    jsonb_build_object(
      'role', 'ADMIN',
      'first_name', 'Admin',
      'last_name', 'User'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Step 2: Create record in users table
  INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    role,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    encode(gen_random_bytes(12), 'base64'), -- generate cuid-like id
    new_user_id::text,
    'admin@tuempresa.com', -- REPLACE THIS (same as above)
    'ADMIN',
    'Admin',
    'User',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Admin user created successfully with ID: %', new_user_id;
END $$;
