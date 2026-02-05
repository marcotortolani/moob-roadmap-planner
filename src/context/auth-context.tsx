'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/lib/types'
import { getCurrentUser } from '@/app/actions/auth'
import { getQueryClient } from '@/lib/react-query/client'

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
  const hasInitialized = useRef(false) // Prevent double initialization
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
    if (isUpdatingPassword.current) {
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
      if (isUpdatingPassword.current) {
        return transformUser(supabaseUser)
      }

      // If user doesn't exist and we haven't exhausted retries, wait and retry
      if (
        (error.code === 'PGRST116' || error.message?.includes('0 rows')) &&
        retryCount < MAX_RETRIES
      ) {
        const delay = RETRY_DELAYS[retryCount]
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchUserData(supabaseUser, retryCount + 1)
      }

      // If still not found after all retries, sign out
      if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
        await supabase.auth.signOut()
        throw new Error('Usuario eliminado del sistema o no se pudo crear correctamente. Por favor contacta al administrador.')
      }

      return transformUser(supabaseUser)
    }

    return transformUser(supabaseUser, data)
  }

  // Initialize auth state
  useEffect(() => {
    // Prevent double initialization (strict mode, HMR, etc.)
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Safety timeout: if auth doesn't load in 10 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 10000)

    const initAuth = async () => {
      try {
        const { user: userData, error } = await getCurrentUser()

        if (error) {
          setUser(null)
        } else if (userData) {
          // Check if user is BLOCKED (replaces per-request middleware check)
          if (userData.role === 'BLOCKED') {
            await supabase.auth.signOut()
            setUser(null)
            router.push('/login?error=blocked')
            return
          }
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        clearTimeout(safetyTimeout)
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userData = await fetchUserData(session.user)
          setUser(userData)
        } catch {
          setUser(null)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/login')
      } else if (event === 'TOKEN_REFRESHED') {
        try {
          const { user: userData, error } = await getCurrentUser()
          if (error || !userData) {
            setUser(null)
          } else {
            setUser(userData)
          }
        } catch {
          // Token refresh failed silently - user stays logged in with current data
        }
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

          // Invalidate all React Query caches to ensure fresh data after login
          const queryClient = getQueryClient()
          queryClient.invalidateQueries()
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
    // Clear all React Query caches to prevent stale data on next login
    const queryClient = getQueryClient()
    queryClient.clear()

    await supabase.auth.signOut()
    setUser(null)
  }

  // Update user - using API route instead of direct Supabase client
  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in')

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name || user.name,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : user.avatarUrl,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el perfil')
      }

      setUser({
        ...user,
        name: result.data.firstName && result.data.lastName
          ? `${result.data.firstName} ${result.data.lastName}`
          : user.name,
        avatarUrl: result.data.avatarUrl || user.avatarUrl,
      })

      return { error: null }
    } catch (error) {
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
      isUpdatingPassword.current = true

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })

      const result = await response.json()

      if (!response.ok) {
        isUpdatingPassword.current = false
        return { error: new Error(result.error || 'Error al actualizar la contraseña') }
      }

      // Let auth state settle before clearing the flag
      setTimeout(() => {
        isUpdatingPassword.current = false
      }, 1000)

      return { error: null }
    } catch (error: any) {
      isUpdatingPassword.current = false

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
