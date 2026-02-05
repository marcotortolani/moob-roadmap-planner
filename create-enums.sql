-- ============================================
-- CREATE MISSING ENUMS
-- Execute this in Supabase SQL Editor
-- ============================================

-- Create Role enum
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'GUEST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Status enum
DO $$ BEGIN
  CREATE TYPE "Status" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DEMO_OK', 'LIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create MilestoneStatus enum
DO $$ BEGIN
  CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create InvitationStatus enum
DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Verify enums were created
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder;
