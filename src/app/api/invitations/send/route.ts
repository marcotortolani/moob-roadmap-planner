import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendInvitation } from '@/lib/email/send-invitation'

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

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role')
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

    // Parse request body
    const body = await request.json()
    const { email, role } = body

    console.log('📧 [Invitations API] Request body:', { email, role })

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'USER', 'GUEST'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido. Debe ser ADMIN, USER o GUEST' },
        { status: 400 }
      )
    }

    // Send invitation
    console.log('📧 [Invitations API] Calling sendInvitation...')
    const result = await sendInvitation(email, role as 'ADMIN' | 'USER' | 'GUEST', currentUser.id)

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
