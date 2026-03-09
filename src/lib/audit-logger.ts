/**
 * Audit Logger
 *
 * Writes structured audit records to the `audit_logs` table via the
 * service-role client (bypasses RLS so it always succeeds regardless of
 * the actor's permissions). Fire-and-forget – audit failures never block
 * the main operation.
 *
 * Run sql/setup/create-audit-logs-table.sql once in Supabase first.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'INVITATION_SENT'
  | 'INVITATION_REVOKED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'

export type AuditResourceType = 'user' | 'product' | 'invitation' | 'auth'

export interface AuditEventOptions {
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string
  actorId?: string
  actorEmail?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
  success?: boolean
  errorMessage?: string
}

/**
 * Log an audit event asynchronously.
 * Errors are swallowed — audit logging must never break the calling operation.
 */
export async function logAuditEvent(opts: AuditEventOptions): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('audit_logs').insert({
      action: opts.action,
      resource_type: opts.resourceType,
      resource_id: opts.resourceId ?? null,
      actor_id: opts.actorId ?? null,
      actor_email: opts.actorEmail ?? null,
      ip_address: opts.ipAddress ?? null,
      metadata: opts.metadata ?? {},
      success: opts.success ?? true,
      error_message: opts.errorMessage ?? null,
    })

    if (error) {
      console.error('[AuditLogger] Failed to write audit log:', error.message)
    }
  } catch (err) {
    // Never let audit logging break the calling operation
    console.error('[AuditLogger] Unexpected error:', err)
  }
}

/**
 * Extract IP address from a Next.js request.
 * Handles proxied requests (Vercel, Cloudflare, etc.)
 */
export function getIpAddress(request: Request): string {
  const forwarded = (request.headers as Headers).get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

