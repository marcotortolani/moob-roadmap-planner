import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', session.user.id)
      .single()

    // Check if user is admin
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden revocar invitaciones.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { invitationId } = body

    if (!invitationId) {
      return NextResponse.json(
        { error: 'ID de invitación requerido' },
        { status: 400 }
      )
    }

    // Update invitation status to REVOKED
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'REVOKED' })
      .eq('id', invitationId)
      .eq('status', 'PENDING') // Only revoke pending invitations

    if (error) {
      return NextResponse.json(
        { error: 'Error al revocar invitación' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitación revocada exitosamente',
    })
  } catch (error) {
    console.error('Revoke invitation error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
