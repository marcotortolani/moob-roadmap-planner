import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { isSameOrigin, csrfRejected } from '@/lib/csrf'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    const { error, status } = csrfRejected()
    return NextResponse.json({ error }, { status })
  }

  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar invitaciones.' },
        { status: 403 }
      )
    }

    // Rate limit: 30 deletions per hour per admin
    const rateLimit = checkRateLimit(`delete-invitation:${currentUser.id}`, RATE_LIMITS.invitationDelete)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Espera ${rateLimit.retryAfterSeconds} segundos.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }

    const body = await request.json()
    const { invitationId } = body

    if (!invitationId) {
      return NextResponse.json(
        { error: 'ID de invitación requerido' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminSupabaseClient()

    const { error } = await adminSupabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)

    if (error) {
      console.error('[Delete invitation] Error:', error)
      return NextResponse.json(
        { error: 'Error al eliminar la invitación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Delete invitation] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
