import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendInvitation } from '@/lib/email/send-invitation'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export async function POST(request: NextRequest) {
  try {
    console.log('📧 [Invitations API] Starting invitation process...')

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log('📧 [Invitations API] Session check:', session ? 'Authenticated' : 'Not authenticated')

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Get current user with name for email personalization
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, first_name, last_name')
      .eq('auth_user_id', session.user.id)
      .single()

    console.log('📧 [Invitations API] Current user:', currentUser, 'Error:', userError)

    // Check if user is admin
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden enviar invitaciones.' },
        { status: 403 }
      )
    }

    // Prepare inviter name for email
    const inviterName = currentUser.first_name && currentUser.last_name
      ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
      : 'El administrador'

    // Parse request body
    const body = await request.json()
    const { email, role } = body

    console.log('📧 [Invitations API] Request body:', { email, role })

    // Rate limit: 20 invitations per hour per admin user
    const rateLimitKey = `send-invitation:${currentUser.id}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.invitationSend)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Demasiadas invitaciones enviadas. Espera ${rateLimit.retryAfterSeconds} segundos.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      )
    }

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      )
    }

    // Validate email format
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'USER', 'GUEST'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido. Debe ser ADMIN, USER o GUEST' },
        { status: 400 }
      )
    }

    // Send invitation with inviterName to avoid N+1 query
    console.log('📧 [Invitations API] Calling sendInvitation...')
    const result = await sendInvitation(
      email,
      role as 'ADMIN' | 'USER' | 'GUEST',
      currentUser.id,
      inviterName
    )

    console.log('📧 [Invitations API] Result:', result)

    if (!result.success) {
      console.error('📧 [Invitations API] Failed:', result.message)
      return NextResponse.json(
        { error: result.message || 'Error al enviar invitación' },
        { status: 400 }
      )
    }

    console.log('📧 [Invitations API] Success! Returning data:', result.data)

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('📧 [Invitations API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
