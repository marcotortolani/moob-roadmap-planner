-- RLS Policies for operators and product_names tables
-- Run this in Supabase SQL Editor after applying the Prisma migration

-- Enable Row Level Security
ALTER TABLE "operators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_names" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operators table
CREATE POLICY "operators_select_policy" ON "operators"
  FOR SELECT
  USING (true); -- Everyone can read

CREATE POLICY "operators_insert_policy" ON "operators"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL); -- Only authenticated users can insert

CREATE POLICY "operators_update_policy" ON "operators"
  FOR UPDATE
  USING (auth.uid() IS NOT NULL); -- Only authenticated users can update

-- RLS Policies for product_names table
CREATE POLICY "product_names_select_policy" ON "product_names"
  FOR SELECT
  USING (true); -- Everyone can read

CREATE POLICY "product_names_insert_policy" ON "product_names"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL); -- Only authenticated users can insert

CREATE POLICY "product_names_update_policy" ON "product_names"
  FOR UPDATE
  USING (auth.uid() IS NOT NULL); -- Only authenticated users can update
