'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  signup: (
    email: string,
    password: string,
    metadata: {
      firstName: string
      lastName: string
      role: string
      avatarUrl?: string
    }
  ) => Promise<{ error: Error | null }>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isUpdatingPassword = useRef(false)
  const router = useRouter()

  // Transform Supabase user to app User
  const transformUser = (supabaseUser: SupabaseUser, dbUser?: any): User => {
    return {
      id: dbUser?.id || supabaseUser.id,
      name:
        dbUser?.first_name && dbUser?.last_name
          ? `${dbUser.first_name} ${dbUser.last_name}`
          : supabaseUser.email || '',
      email: supabaseUser.email || '',
      role: dbUser?.role || supabaseUser.user_metadata?.role || 'USER',
      avatarUrl: dbUser?.avatar_url || supabaseUser.user_metadata?.avatar_url,
      authUserId: supabaseUser.id, // Always store the auth user ID
    }
  }

  // Fetch user from database with retry logic for trigger latency
  const fetchUserData = async (
    supabaseUser: SupabaseUser,
    retryCount = 0
  ): Promise<User> => {
    // Skip retries if we're updating password to avoid conflicts
    if (isUpdatingPassword.current) {
      console.log('⏭️ Skipping fetchUserData during password update')
      return transformUser(supabaseUser)
    }

    const MAX_RETRIES = 4
    const RETRY_DELAYS = [300, 600, 1200, 2000] // Progressive delays in ms

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', supabaseUser.id)
      .single()

    if (error) {
      console.error(`Error fetching user data (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error)

      // Skip retries if we're updating password
      if (isUpdatingPassword.current) {
        console.log('⏭️ Skipping retry during password update')
        return transformUser(supabaseUser)
      }

      // If user doesn't exist and we haven't exhausted retries, wait and retry
      if (
        (error.code === 'PGRST116' || error.message?.includes('0 rows')) &&
        retryCount < MAX_RETRIES
      ) {
        const delay = RETRY_DELAYS[retryCount]
        console.log(`⏳ User record not found yet. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`)

        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchUserData(supabaseUser, retryCount + 1)
      }

      // If still not found after all retries, sign out
      if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
        console.warn('❌ User record not found in database after all retries. Signing out...')
        await supabase.auth.signOut()
        throw new Error('Usuario eliminado del sistema o no se pudo crear correctamente. Por favor contacta al administrador.')
      }

      return transformUser(supabaseUser)
    }

    console.log('✅ User record found successfully')
    return transformUser(supabaseUser, data)
  }

  // Initialize auth state
  useEffect(() => {
    // Safety timeout: if auth doesn't load in 10 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      console.warn('⏱️ Auth initialization timeout - forcing loading to false')
      setLoading(false)
    }, 10000)

    const initAuth = async () => {
      try {
        console.log('🔐 [Auth Init] Starting...')
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log('🔐 [Auth Init] Session:', !!session)

        if (session?.user) {
          try {
            console.log('🔐 [Auth Init] Fetching user data...')
            const userData = await fetchUserData(session.user)
            setUser(userData)
            console.log('🔐 [Auth Init] User data loaded')
          } catch (error) {
            // User was deleted, fetchUserData already signed them out
            console.error('Error fetching user data, user will be signed out:', error)
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        clearTimeout(safetyTimeout)
        setLoading(false)
        console.log('🔐 [Auth Init] Complete')
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [Auth Change] Event:', event, 'Has session:', !!session)

      // Note: We don't skip the entire handler during password update
      // because that would cause a deadlock. Instead, fetchUserData()
      // will return early with basic user data when isUpdatingPassword is true.

      if (session?.user) {
        try {
          // fetchUserData will skip DB queries and retries if isUpdatingPassword is true
          const userData = await fetchUserData(session.user)
          setUser(userData)
        } catch (error) {
          // User was deleted, fetchUserData already signed them out
          console.error('Error fetching user data, user will be signed out:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }

      // IMPORTANT: Only set loading to false during initial auth
      // Don't show loading screen for token refreshes or other auth changes
      // The initial auth useEffect will handle setting loading to false

      // Handle specific events
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Login
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        try {
          const userData = await fetchUserData(data.user)

          // Check if user is BLOCKED
          if (userData.role === 'BLOCKED') {
            await supabase.auth.signOut()
            throw new Error('Tu cuenta ha sido bloqueada. Contacta al administrador.')
          }

          setUser(userData)
        } catch (error) {
          // User was deleted or blocked, already signed out
          throw error
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Signup
  const signup = async (
    email: string,
    password: string,
    metadata: {
      firstName: string
      lastName: string
      role: string
      avatarUrl?: string
    }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata.firstName,
            last_name: metadata.lastName,
            role: metadata.role,
            avatar_url: metadata.avatarUrl,
          },
        },
      })

      if (error) throw error

      // User record created automatically by trigger
      if (data.user) {
        try {
          const userData = await fetchUserData(data.user)
          setUser(userData)
        } catch (error) {
          // User record not created by trigger
          throw new Error('Error al crear el usuario en la base de datos')
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Logout
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Update user - using API route instead of direct Supabase client
  const updateUser = async (updates: Partial<User>) => {
    try {
      console.log('🔄 [updateUser] Starting update via API...', { updates, user })

      if (!user) throw new Error('No user logged in')

      console.log('🔄 [updateUser] Calling /api/profile/update...')

      // Call API route instead of using Supabase client directly
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updates.name || user.name,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : user.avatarUrl,
        }),
      })

      const result = await response.json()

      console.log('🔄 [updateUser] API response:', { status: response.status, result })

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el perfil')
      }

      // Update local state with API response
      console.log('🔄 [updateUser] Updating local state...')
      const updatedUser = {
        ...user,
        name: result.data.firstName && result.data.lastName
          ? `${result.data.firstName} ${result.data.lastName}`
          : user.name,
        avatarUrl: result.data.avatarUrl || user.avatarUrl,
      }
      setUser(updatedUser)

      console.log('✅ [updateUser] Update completed successfully!')
      return { error: null }
    } catch (error) {
      console.error('❌ [updateUser] Error:', error)
      return { error: error as Error }
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Update password - using API route instead of direct Supabase client
  const updatePassword = async (newPassword: string) => {
    try {
      console.log('🔐 [updatePassword] Starting password update via API...')

      // Set flag to prevent auth state change conflicts
      isUpdatingPassword.current = true
      console.log('🔐 [updatePassword] Flag set, calling API...')

      // Call API route with fetch timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout

      console.log('🔐 [updatePassword] Fetching /api/profile/change-password...')

      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })

      console.log('🔐 [updatePassword] API response status:', response.status)

      const result = await response.json()

      console.log('🔐 [updatePassword] API response data:', {
        success: result.success,
        error: result.error,
      })

      if (!response.ok) {
        console.error('🔐 [updatePassword] API error:', result.error)
        isUpdatingPassword.current = false
        return { error: new Error(result.error || 'Error al actualizar la contraseña') }
      }

      console.log('🔐 [updatePassword] Password updated successfully')

      // Wait a bit before clearing the flag to let auth settle
      setTimeout(() => {
        console.log('🔐 [updatePassword] Clearing flag')
        isUpdatingPassword.current = false
      }, 1000)

      return { error: null }
    } catch (error: any) {
      console.error('🔐 [updatePassword] Caught error:', error)
      isUpdatingPassword.current = false

      // Handle AbortError (timeout)
      if (error.name === 'AbortError') {
        return {
          error: new Error(
            'La solicitud tardó demasiado. Por favor verifica tu conexión e intenta de nuevo.'
          ),
        }
      }

      return { error: error as Error }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
