/**
 * Client-side audit logging helper.
 *
 * Safe to import from 'use client' components and hooks — contains no
 * server-only imports (no next/headers, no service-role client).
 *
 * Calls /api/audit/log which runs server-side and writes to audit_logs
 * via the admin Supabase client. Fire-and-forget.
 */

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

export function logAuditEventFromClient(opts: {
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string
  metadata?: Record<string, unknown>
}): void {
  fetch('/api/audit/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  }).catch(() => {
    // Audit logging must never surface errors to the user
  })
}
