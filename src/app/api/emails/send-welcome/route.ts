/**
 * Send Welcome Email API Route
 * Called after user successfully completes signup
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/sendgrid/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, role } = body

    console.log('📧 [API] Received welcome email request:', { email, firstName, role })

    if (!email || !firstName || !role) {
      console.error('❌ [API] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, role' },
        { status: 400 }
      )
    }

    console.log('📧 [API] Calling sendWelcomeEmail...')
    const result = await sendWelcomeEmail({
      email,
      firstName,
      role: role as 'ADMIN' | 'USER' | 'GUEST',
    })

    if (!result.success) {
      console.error('❌ [API] Welcome email failed:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('✅ [API] Welcome email sent successfully:', result.emailId)
    return NextResponse.json({
      success: true,
      emailId: result.emailId,
    })
  } catch (error) {
    console.error('❌ [API] Welcome email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
