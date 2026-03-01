-- =============================================
-- pg_cron Keep-Alive Setup for Supabase Free Tier
-- =============================================
-- Run this script in the Supabase SQL Editor.
-- pg_cron is available on all Supabase plans by default.
--
-- This replaces the GitHub Actions + Vercel API approach as the primary
-- keep-alive mechanism. pg_cron runs INSIDE the database, bypasses RLS,
-- and is guaranteed to count as real activity for Supabase's inactivity checks.
-- =============================================

-- Step 1: Enable pg_cron extension (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

GRANT USAGE ON SCHEMA cron TO postgres;

-- Step 2: Remove existing job if it exists (idempotent re-run)
SELECT cron.unschedule('supabase-keep-alive')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'supabase-keep-alive'
);

-- Step 3: Schedule daily keep-alive at 10:00 AM UTC
SELECT cron.schedule(
  'supabase-keep-alive',
  '0 10 * * *',
  $$
    SELECT COUNT(*) FROM public.users;
  $$
);

-- =============================================
-- Verification queries (run separately to check)
-- =============================================

-- Check the job is registered and active:
-- SELECT jobid, jobname, schedule, command, active FROM cron.job;

-- Run the job manually for immediate testing:
-- SELECT cron.run_job('supabase-keep-alive');

-- Check execution history:
-- SELECT jobid, status, return_message, start_time, end_time
-- FROM cron.job_run_details
-- ORDER BY start_time DESC
-- LIMIT 10;
