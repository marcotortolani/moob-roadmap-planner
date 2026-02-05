-- Improved trigger function that's compatible with Prisma's cuid()
-- This version uses Prisma's default value for id instead of generating UUID

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table (let Prisma's default cuid() generate the ID)
  INSERT INTO public.users (
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

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth.users insert
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    RETURN new;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger was created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
