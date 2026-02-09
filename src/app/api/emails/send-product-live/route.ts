/**
 * Send Product LIVE Email API Route
 * Called when a product status changes to LIVE
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendProductLiveEmail } from '@/lib/sendgrid/service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCountryName, getLanguageName } from '@/lib/format-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, productUrl, operator, country, language } = body

    if (!productName || !operator || !country || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, operator, country, language' },
        { status: 400 }
      )
    }

    // Get current user (who changed the product to LIVE)
    // Using getUser() instead of getSession() for security (validates token with Auth server)
    const supabase = await createServerSupabaseClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error('❌ No authenticated user:', authError)
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get ALL active users from database (excluding BLOCKED users)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('email, first_name, last_name, role')
      .neq('role', 'BLOCKED')

    if (userError || !users || users.length === 0) {
      console.error('❌ Failed to fetch users:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Map all active users to recipients
    const recipients = users.map(user => ({
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    }))

    console.log('📧 Sending product LIVE email to ALL active users:', recipients.map(r => r.email).join(', '))

    // Transform country and language codes to human-readable names
    const countryName = getCountryName(country)
    const languageName = getLanguageName(language)

    console.log('📧 Sending product LIVE emails with:', {
      productName,
      country: `${country} → ${countryName}`,
      language: `${language} → ${languageName}`,
      recipientCount: recipients.length,
    })

    // Send product LIVE notification to all recipients
    const result = await sendProductLiveEmail({
      productName,
      productUrl,
      operator,
      country: countryName, // Send transformed name
      language: languageName, // Send transformed name
      goLiveDate: new Date(),
      recipients,
    })

    if (!result.success) {
      console.error('❌ Product LIVE emails failed:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('❌ Product LIVE email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
