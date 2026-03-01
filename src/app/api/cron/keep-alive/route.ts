import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * Keep-Alive Endpoint for Supabase Free Tier
 *
 * This endpoint is called by a GitHub Actions cron job every day
 * to prevent Supabase from pausing the database due to inactivity.
 *
 * Free tier projects are paused after 7 days of inactivity.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request comes from our cron job
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('❌ [Keep-Alive] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    // Check authorization
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ [Keep-Alive] Unauthorized request attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 [Keep-Alive] Starting keep-alive check...')

    const supabase = createAdminSupabaseClient()

    // Perform a simple query to keep the database active
    // We'll just count users (lightweight operation)
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('❌ [Keep-Alive] Database query failed:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    console.log('✅ [Keep-Alive] Database is active. Users count:', count)

    return NextResponse.json({
      success: true,
      message: 'Database keep-alive successful',
      userCount: count,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ [Keep-Alive] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
