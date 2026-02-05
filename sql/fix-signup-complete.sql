-- ============================================================================
-- Complete fix for signup issues
-- This script fixes both the RLS policy and the trigger for user creation
-- ============================================================================

-- ============ PART 1: Fix RLS Policy for INSERT ============

-- Drop old policies
DROP POLICY IF EXISTS "System can insert users" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;

-- Create new policy that allows the trigger to insert users
CREATE POLICY "Allow user creation"
  ON users FOR INSERT TO public
  WITH CHECK (
    -- Allow if the auth_user_id being inserted matches the current auth.uid()
    -- This covers both the trigger case and direct inserts
    auth_user_id = (auth.uid())::text
    OR
    -- Fallback: allow if there's no current auth.uid()
    auth.uid() IS NULL
  );

-- ============ PART 2: Fix Trigger Function ============

-- Improved trigger function compatible with Prisma
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table with generated UUID as ID
  INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    role,
    first_name,
    last_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid()::text,  -- Generate UUID as ID (cuid not available in SQL)
    new.id::text,
    new.email,
    -- Parse role from metadata, default to USER
    COALESCE(
      (new.raw_user_meta_data->>'role')::public."Role",
      'USER'::public."Role"
    ),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  );

  RAISE NOTICE 'User record created in public.users for %', new.email;
  RETURN new;

EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth.users insert
    RAISE WARNING 'Failed to create user record for %: %', new.email, SQLERRM;
    RETURN new;
END;
$$;

-- ============ PART 3: Recreate Trigger ============

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============ PART 4: Verification ============

-- Verify RLS policy
SELECT
  'RLS Policy: ' || policyname as status,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- Verify trigger
SELECT
  'Trigger: ' || trigger_name as status,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Show current user count
SELECT
  'Current users in database: ' || count(*)::text as status
FROM users;
