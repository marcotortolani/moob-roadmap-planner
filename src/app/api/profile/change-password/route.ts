import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Validate password complexity:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula'
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra minúscula'
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número'
  }
  return null
}

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

    // Rate limit: 5 password changes per 15 minutes per user
    const rateLimitKey = `change-password:${session.user.id}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.passwordChange)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Demasiados intentos. Espera ${rateLimit.retryAfterSeconds} segundos antes de intentar nuevamente.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(RATE_LIMITS.passwordChange.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        }
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

    // Validate password complexity
    const complexityError = validatePasswordComplexity(newPassword)
    if (complexityError) {
      console.error('🔐 [API change-password] Password complexity error:', complexityError)
      return NextResponse.json(
        { error: complexityError },
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
      hasUser: !!(data as { user?: unknown })?.user,
      error: error ? { message: (error as Error).message } : null,
    })

    if (error) {
      console.error('🔐 [API change-password] Update error:', error)
      return NextResponse.json(
        {
          error:
            (error as Error).message === 'TIMEOUT: Supabase no respondió en 10 segundos'
              ? (error as Error).message
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
  } catch (error: unknown) {
    console.error('🔐 [API change-password] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
