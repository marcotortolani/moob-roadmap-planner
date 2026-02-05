import { NextRequest, NextResponse } from 'next/server'
import { acceptInvitation } from '@/lib/email/send-invitation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token es requerido' },
        { status: 400 }
      )
    }

    const result = await acceptInvitation(token)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitación aceptada exitosamente',
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { success: false, message: 'Error al aceptar la invitación' },
      { status: 500 }
    )
  }
}
