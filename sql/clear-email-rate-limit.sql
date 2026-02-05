-- ============================================================================
-- Clear email rate limit for testing
-- ============================================================================
-- NOTE: This clears the rate limit table to allow sending more emails
-- Use this ONLY in development/testing environments

-- Check current rate limit entries
SELECT
  'Current rate limit entries' as info,
  key,
  value,
  created_at
FROM auth.audit_log_entries
WHERE
  payload->>'action' = 'email_sent'
  AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- If you need to clear specific email's rate limit, Supabase handles this internally
-- The best solution is to wait 1 hour or increase the rate limit in Dashboard

-- Alternative: If you have access to the rate_limits table (not standard in Supabase)
-- DELETE FROM auth.rate_limits WHERE email = 'your-email@example.com';

-- For development, recommend going to:
-- Supabase Dashboard → Authentication → Rate Limits
-- And increase the "Email sending rate limit" to 10-20 per hour
