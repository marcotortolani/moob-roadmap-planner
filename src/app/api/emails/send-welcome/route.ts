/**
 * Send Welcome Email API Route
 * Called after user successfully completes signup
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/sendgrid/service'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
const VALID_ROLES = ['ADMIN', 'USER', 'GUEST'] as const
type ValidRole = (typeof VALID_ROLES)[number]

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    // Rate limit: 10 welcome emails per hour per IP
    const rateLimitKey = `send-welcome:${ip}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.emailSend)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      )
    }

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

    // Validate email format
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate firstName to prevent injection in email templates
    if (typeof firstName !== 'string' || firstName.length > 100) {
      return NextResponse.json(
        { error: 'Invalid firstName: must be a string with max 100 characters' },
        { status: 400 }
      )
    }

    // Validate role is an expected value
    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    console.log('📧 [API] Calling sendWelcomeEmail...')
    const result = await sendWelcomeEmail({
      email,
      firstName: firstName.trim(),
      role: role as ValidRole,
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
