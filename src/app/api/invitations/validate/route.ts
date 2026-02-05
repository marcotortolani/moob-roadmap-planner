import { NextRequest, NextResponse } from 'next/server'
import { validateInvitationToken } from '@/lib/email/send-invitation'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Validate API] Starting validation...')
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    console.log('🔍 [Validate API] Token:', token ? `${token.substring(0, 10)}...` : 'null')

    if (!token) {
      console.log('🔍 [Validate API] No token provided')
      return NextResponse.json(
        { success: false, message: 'Token es requerido' },
        { status: 400 }
      )
    }

    console.log('🔍 [Validate API] Calling validateInvitationToken...')
    const result = await validateInvitationToken(token)

    console.log('🔍 [Validate API] Result:', result)

    if (!result.success) {
      console.log('🔍 [Validate API] Validation failed:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    console.log('🔍 [Validate API] Validation success!')
    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('🔍 [Validate API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Error al validar la invitación' },
      { status: 500 }
    )
  }
}
