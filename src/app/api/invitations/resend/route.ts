import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/sendgrid/service'
import { logAuditEvent, getIpAddress } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get current user (admin check + inviter name)
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role, first_name, last_name')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden reenviar invitaciones.' },
        { status: 403 }
      )
    }

    // Parse body
    const body = await request.json()
    const { invitationId } = body

    if (!invitationId) {
      return NextResponse.json(
        { error: 'ID de invitación requerido' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminSupabaseClient()

    // Fetch the invitation
    const { data: invitation, error: fetchError } = await adminSupabase
      .from('invitations')
      .select('id, email, role, status')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    // Only allow resending EXPIRED or REVOKED invitations
    if (invitation.status !== 'EXPIRED' && invitation.status !== 'REVOKED') {
      return NextResponse.json(
        { error: 'Solo se pueden reenviar invitaciones expiradas o revocadas' },
        { status: 400 }
      )
    }

    // Generate new token and expiration
    const newToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Update the invitation record
    const { error: updateError } = await adminSupabase
      .from('invitations')
      .update({
        token: newToken,
        expires_at: expiresAt.toISOString(),
        status: 'PENDING',
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('[Resend invitation] Update error:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la invitación' },
        { status: 500 }
      )
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?token=${newToken}`
    const inviterName =
      currentUser.first_name && currentUser.last_name
        ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
        : 'El administrador'

    // Send invitation email (fire-and-forget — email failure doesn't block the update)
    const emailResult = await sendInvitationEmail({
      email: invitation.email,
      role: invitation.role as 'ADMIN' | 'USER' | 'GUEST',
      inviteLink,
      inviterName,
      expiresAt,
    })

    if (!emailResult.success) {
      console.error('[Resend invitation] Email send failed:', emailResult.error)
    }

    // Audit log (fire-and-forget)
    logAuditEvent({
      action: 'INVITATION_SENT',
      resourceType: 'invitation',
      resourceId: invitationId,
      actorId: currentUser.id,
      actorEmail: session.user.email,
      ipAddress: getIpAddress(request),
      metadata: {
        resent: true,
        email: invitation.email,
        role: invitation.role,
        previousStatus: invitation.status,
        emailSent: emailResult.success,
      },
    })

    return NextResponse.json({
      success: true,
      inviteLink,
      emailSent: emailResult.success,
      data: { invitationId, newToken },
    })
  } catch (error) {
    console.error('[Resend invitation] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
