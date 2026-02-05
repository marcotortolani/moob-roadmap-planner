import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, avatarUrl } = body

    console.log('📝 [Profile API] Update request:', {
      user_id: session.user.id,
      name,
      avatarUrl,
    })

    // Parse name into first and last name
    const [firstName, ...lastNameParts] = (name || '').split(' ')
    const lastName = lastNameParts.join(' ')

    // Update database
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', session.user.id)
      .select()
      .single()

    console.log('📝 [Profile API] Update result:', { data, error })

    if (error) {
      console.error('📝 [Profile API] Update error:', error)
      return NextResponse.json(
        { error: `Error al actualizar: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No se encontró el usuario' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        avatarUrl: data.avatar_url,
      },
    })
  } catch (error) {
    console.error('📝 [Profile API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
