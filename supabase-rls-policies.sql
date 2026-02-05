-- ============================================
-- RLS POLICIES FOR ROADMAP PLANNER
-- Execute this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- ============ USERS TABLE ============

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = auth_user_id);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = auth_user_id)
  WITH CHECK (auth.uid()::text = auth_user_id);

-- System can insert users (via signup trigger)
CREATE POLICY "System can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = auth_user_id);

-- ============ INVITATIONS TABLE ============

-- Admins can read all invitations
CREATE POLICY "Admins can read invitations"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  );

-- Anyone can read invitation by token (for signup validation)
CREATE POLICY "Public can read invitation by token"
  ON invitations FOR SELECT
  USING (status = 'PENDING');

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  );

-- Admins can update invitations (accept/revoke)
CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  );

-- ============ PRODUCTS TABLE ============

-- Everyone can read products
CREATE POLICY "Everyone can read products"
  ON products FOR SELECT
  USING (true);

-- Admin and User can create products
CREATE POLICY "Admin and User can create products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role IN ('ADMIN', 'USER')
    )
  );

-- Admin and User can update products
CREATE POLICY "Admin and User can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role IN ('ADMIN', 'USER')
    )
  );

-- Only Admin can delete products
CREATE POLICY "Only Admin can delete products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role = 'ADMIN'
    )
  );

-- ============ MILESTONES & CUSTOM_URLS ============

-- Everyone can read milestones
CREATE POLICY "Everyone can read milestones"
  ON milestones FOR SELECT
  USING (true);

-- Admin and User can manage milestones
CREATE POLICY "Admin and User can manage milestones"
  ON milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role IN ('ADMIN', 'USER')
    )
  );

-- Everyone can read custom_urls
CREATE POLICY "Everyone can read custom_urls"
  ON custom_urls FOR SELECT
  USING (true);

-- Admin and User can manage custom_urls
CREATE POLICY "Admin and User can manage custom_urls"
  ON custom_urls FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role IN ('ADMIN', 'USER')
    )
  );

-- ============ HOLIDAYS ============

CREATE POLICY "Everyone can read holidays"
  ON holidays FOR SELECT
  USING (true);

CREATE POLICY "Admin and User can manage holidays"
  ON holidays FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE auth.uid()::text = u.auth_user_id
      AND u.role IN ('ADMIN', 'USER')
    )
  );

-- ============ HELPER FUNCTIONS ============

-- Get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_auth_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role::text FROM users WHERE auth_user_id = user_auth_id::text;
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()::text
    AND role = 'ADMIN'
  );
$$;

-- Trigger to create user record after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, role, first_name, last_name, avatar_url)
  VALUES (
    new.id::text,
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::public.role, 'USER'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
