import { createAdminSupabaseClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/errors'
import { success, failure, ValidationError } from '@/lib/errors'
import { sendInvitationEmail } from '@/lib/sendgrid/service'

export async function sendInvitation(
  email: string,
  role: 'ADMIN' | 'USER' | 'GUEST',
  sentById: string,
  inviterName: string
): Promise<ActionResult<{ invitationId: string; inviteLink: string }>> {
  try {
    console.log('📧 [sendInvitation] Starting...', { email, role, sentById })

    const supabase = createAdminSupabaseClient()

    // ✅ OPTIMIZATION: Parallelize both validation queries (Sprint 2.2)
    // Check if user exists AND check for pending invitation in parallel
    console.log('📧 [sendInvitation] Running parallel validation checks...')
    const [userCheckResult, invitationCheckResult] = await Promise.all([
      supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle(),
      supabase
        .from('invitations')
        .select('id')
        .eq('email', email)
        .eq('status', 'PENDING')
        .maybeSingle(),
    ])

    const { data: existingUser, error: userCheckError } = userCheckResult
    const { data: existingInvitation, error: invCheckError } = invitationCheckResult

    console.log('📧 [sendInvitation] Validation results:', {
      existingUser,
      userCheckError,
      existingInvitation,
      invCheckError,
    })

    // Handle validation errors
    if (userCheckError) {
      console.error('📧 [sendInvitation] User check error:', userCheckError)
      return failure(
        new ValidationError('email', 'Error checking user'),
        'Error al verificar el usuario'
      )
    }

    if (invCheckError) {
      console.error('📧 [sendInvitation] Invitation check error:', invCheckError)
      return failure(
        new ValidationError('email', 'Error checking invitation'),
        'Error al verificar la invitación'
      )
    }

    // Validate if user exists
    if (existingUser) {
      console.log('📧 [sendInvitation] User already exists, returning failure')
      return failure(
        new ValidationError('email', 'User already exists'),
        'Este email ya está registrado'
      )
    }

    // Validate if invitation exists
    if (existingInvitation) {
      console.log('📧 [sendInvitation] Pending invitation exists, returning failure')
      return failure(
        new ValidationError('email', 'Invitation already sent'),
        'Ya existe una invitación pendiente para este email'
      )
    }

    // Create invitation record
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    // Generate unique ID and token
    const invitationId = crypto.randomUUID()
    const invitationToken = crypto.randomUUID()

    console.log('📧 [sendInvitation] Creating invitation record...', { invitationId, invitationToken })
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .insert({
        id: invitationId,
        email,
        role,
        token: invitationToken,
        expires_at: expiresAt.toISOString(),
        sent_by_id: sentById,
      })
      .select()
      .single()

    console.log('📧 [sendInvitation] Invitation record result:', { invitation, invError })

    if (invError) {
      console.error('📧 [sendInvitation] Error creating invitation:', invError)
      throw invError
    }

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?token=${invitation.token}`
    console.log('📧 [sendInvitation] Generated invite link:', inviteLink)

    // ✅ OPTIMIZATION: inviterName is now passed as parameter (Sprint 2.1)
    // This eliminates the N+1 query that was fetching inviter name here

    // Send invitation email via SendGrid
    // Using fire-and-forget pattern - email failure should not block invitation creation
    console.log('📧 [sendInvitation] Sending email via SendGrid...')
    const emailResult = await sendInvitationEmail({
      email,
      role,
      inviteLink,
      inviterName,
      expiresAt,
    })

    if (!emailResult.success) {
      console.error('❌ Failed to send invitation email:', emailResult.error)
      // DO NOT throw error - invitation was created successfully
      // Admin can still manually share the invite link
    } else {
      console.log('✅ Invitation email sent successfully:', emailResult.emailId)
    }

    console.log('📧 [sendInvitation] Returning success with data:', {
      invitationId: invitation.id,
      inviteLink,
    })

    return success({
      invitationId: invitation.id,
      inviteLink,
    })
  } catch (error) {
    console.error('📧 [sendInvitation] Unexpected error:', error)
    return failure(
      new ValidationError('email', 'Failed to send invitation'),
      'Error al enviar la invitación'
    )
  }
}

export async function validateInvitationToken(
  token: string
): Promise<ActionResult<{ email: string; role: 'ADMIN' | 'USER' | 'GUEST' }>> {
  try {
    const supabase = createAdminSupabaseClient()

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('email, role, expires_at, status')
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return failure(
        new ValidationError('token', 'Invalid token'),
        'Token de invitación inválido'
      )
    }

    if (invitation.status !== 'PENDING') {
      return failure(
        new ValidationError('token', 'Invitation already used'),
        'Esta invitación ya fue utilizada'
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'EXPIRED' })
        .eq('token', token)

      return failure(
        new ValidationError('token', 'Invitation expired'),
        'Esta invitación ha expirado'
      )
    }

    return success({
      email: invitation.email,
      role: invitation.role as 'ADMIN' | 'USER' | 'GUEST',
    })
  } catch (error) {
    console.error('Validate invitation error:', error)
    return failure(
      new ValidationError('token', 'Validation failed'),
      'Error al validar la invitación'
    )
  }
}

export async function acceptInvitation(token: string): Promise<ActionResult<void>> {
  try {
    const supabase = createAdminSupabaseClient()

    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (error) throw error

    return success(undefined)
  } catch (error) {
    console.error('Accept invitation error:', error)
    return failure(
      new ValidationError('token', 'Failed to accept'),
      'Error al aceptar la invitación'
    )
  }
}
