-- Fix missing default values for operators and product_names tables
-- Run this in Supabase SQL Editor

-- Add default for updated_at columns
ALTER TABLE "operators"
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "product_names"
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Add default for created_at columns (should already have it, but ensure it)
ALTER TABLE "operators"
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "product_names"
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Add trigger to auto-update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to operators table
DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;
CREATE TRIGGER update_operators_updated_at
    BEFORE UPDATE ON operators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to product_names table
DROP TRIGGER IF EXISTS update_product_names_updated_at ON product_names;
CREATE TRIGGER update_product_names_updated_at
    BEFORE UPDATE ON product_names
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
