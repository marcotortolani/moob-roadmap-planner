'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Server action to get current authenticated user
 * More reliable than client-side getSession()
 */
export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient()

    // Use getUser() which validates token with server
    // More reliable than getSession() which only reads cookies
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('[getCurrentUser] Error:', error)
      return { user: null, error: error.message }
    }

    if (!user) {
      return { user: null, error: null }
    }

    // Fetch user data from database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (dbError) {
      console.error('[getCurrentUser] DB Error:', dbError)
      // If user doesn't exist in DB but exists in auth, they're orphaned
      if (dbError.code === 'PGRST116') {
        return { user: null, error: 'User not found in database' }
      }
      return { user: null, error: dbError.message }
    }

    // Return combined user data
    return {
      user: {
        id: dbUser.id,
        name:
          dbUser.first_name && dbUser.last_name
            ? `${dbUser.first_name} ${dbUser.last_name}`
            : user.email || '',
        email: user.email || '',
        role: dbUser.role || 'USER',
        avatarUrl: dbUser.avatar_url,
        authUserId: user.id,
      },
      error: null,
    }
  } catch (error: any) {
    console.error('[getCurrentUser] Unexpected error:', error)
    return { user: null, error: error.message || 'Internal server error' }
  }
}
