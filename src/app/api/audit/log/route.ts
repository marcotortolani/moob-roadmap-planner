import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAuditEvent, type AuditAction, type AuditResourceType } from '@/lib/audit-logger'

interface AuditLogBody {
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body: AuditLogBody = await request.json()
    const { action, resourceType, resourceId, metadata } = body

    if (!action || !resourceType) {
      return NextResponse.json({ error: 'action y resourceType son requeridos' }, { status: 400 })
    }

    // actor_id and actor_email come from the verified session — never from the request body
    await logAuditEvent({
      action,
      resourceType,
      resourceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      metadata,
    })

    return NextResponse.json({ success: true })
  } catch {
    // Audit logging must never break anything — swallow errors silently
    return NextResponse.json({ success: true })
  }
}
