-- ============================================================
-- Audit Logs Table
-- Run once in Supabase SQL Editor to enable audit logging.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  action        TEXT NOT NULL,          -- e.g. 'USER_DELETED', 'ROLE_CHANGED'
  resource_type TEXT NOT NULL,          -- e.g. 'user', 'product'
  resource_id   TEXT,                   -- affected record id (optional)

  -- Who did it
  actor_id      TEXT,                   -- public.users.id of the person acting
  actor_email   TEXT,                   -- denormalized for readability in logs
  ip_address    TEXT,

  -- Extra context (flexible JSONB)
  metadata      JSONB DEFAULT '{}',

  -- Result
  success       BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id    ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource    ON public.audit_logs (resource_type, resource_id);

-- RLS: only admins can read; backend inserts via service role key (bypasses RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read audit_logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()::text
      AND   role = 'ADMIN'
    )
  );

-- No direct INSERT/UPDATE/DELETE from browser (service role only)
-- The backend inserts via createAdminSupabaseClient() which bypasses RLS.
