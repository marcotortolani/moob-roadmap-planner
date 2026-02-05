import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [API change-password] Starting password change request')

    const supabase = await createServerSupabaseClient()

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log('🔐 [API change-password] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      error: sessionError,
    })

    if (sessionError || !session) {
      console.error('🔐 [API change-password] No session:', sessionError)
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || typeof newPassword !== 'string') {
      console.error('🔐 [API change-password] Invalid password')
      return NextResponse.json(
        { error: 'Contraseña inválida' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      console.error('🔐 [API change-password] Password too short')
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    console.log('🔐 [API change-password] Calling Supabase updateUser...')

    // Update password with timeout
    const updatePromise = supabase.auth.updateUser({
      password: newPassword,
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT: Supabase no respondió en 10 segundos'))
      }, 10000)
    })

    const { data, error } = await Promise.race([
      updatePromise,
      timeoutPromise,
    ]).catch((err) => {
      console.error('🔐 [API change-password] Race error:', err)
      return { data: null, error: err }
    })

    console.log('🔐 [API change-password] Supabase response:', {
      hasData: !!data,
      hasUser: !!data?.user,
      error: error ? { message: error.message } : null,
    })

    if (error) {
      console.error('🔐 [API change-password] Update error:', error)
      return NextResponse.json(
        {
          error:
            error.message === 'TIMEOUT: Supabase no respondió en 10 segundos'
              ? error.message
              : 'Error al actualizar la contraseña',
        },
        { status: 500 }
      )
    }

    console.log('🔐 [API change-password] Password updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    })
  } catch (error: any) {
    console.error('🔐 [API change-password] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
