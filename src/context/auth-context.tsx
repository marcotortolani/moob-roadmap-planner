'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { User } from '@/lib/types'
import type { DbUser } from '@/types/database'
import { getQueryClient } from '@/lib/react-query/client'
import { getErrorMessage, logError } from '@/lib/errors/error-handler'

// --- localStorage cache helpers (survive page reloads) ---
const CACHED_USER_KEY = 'rp-cached-user'

function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(CACHED_USER_KEY)
    return cached ? JSON.parse(cached) as User : null
  } catch { return null }
}

function setCachedUser(user: User | null): void {
  if (typeof window === 'undefined') return
  try {
    user ? localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user))
         : localStorage.removeItem(CACHED_USER_KEY)
  } catch { /* non-fatal */ }
}

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
  const supabase = getSupabaseClient()
  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [loading, setLoading] = useState(() => getCachedUser() === null)
  const isUpdatingPassword = useRef(false)
  const hasInitialized = useRef(false) // Prevent double initialization
  const router = useRouter()

  // Always update both React state and localStorage cache together
  const setUserAndCache = useCallback((newUser: User | null) => {
    setUser(newUser)
    setCachedUser(newUser)
  }, [])

  // Transform Supabase user to app User
  const transformUser = (supabaseUser: SupabaseUser, dbUser?: DbUser): User => {
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

    // v0.8.7: No more manual initAuth() with getSession().
    // onAuthStateChange fires INITIAL_SESSION as its first event, which replaces initAuth().
    // Warm start: if localStorage has a cached user, React state is already populated
    // (loading=false, user!=null) so queries fire immediately. INITIAL_SESSION then
    // validates/updates the cached user in the background.
    // Security: middleware calls getUser() server-side on every request.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          try {
            const userData = await fetchUserData(session.user)
            if (userData.role === 'BLOCKED') {
              await supabase.auth.signOut()
              setUserAndCache(null)
              router.push('/login?error=blocked')
            } else {
              setUserAndCache(userData)
            }
          } catch {
            // fetchUserData failed — keep cached user (middleware already validated)
          }
        } else {
          // SDK didn't find a session.
          // If we have a cached user and middleware let us through, try getSession() with delay
          const cached = getCachedUser()
          if (cached) {
            setTimeout(async () => {
              try {
                const { data: { session: retry } } = await supabase.auth.getSession()
                if (retry?.user) {
                  try {
                    const userData = await fetchUserData(retry.user)
                    setUserAndCache(userData)
                  } catch { /* keep cached */ }
                } else {
                  setUserAndCache(null)
                }
              } catch {
                setUserAndCache(null)
              }
            }, 500)
          } else {
            setUserAndCache(null)
          }
        }
        clearTimeout(safetyTimeout)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userData = await fetchUserData(session.user)
          setUserAndCache(userData)
        } catch {
          setUserAndCache(null)
        }
      } else if (event === 'SIGNED_OUT') {
        getQueryClient().clear()
        setUserAndCache(null)
        router.push('/login')
      } else if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          let signedOut = false
          try {
            const userData = await fetchUserData(session.user)
            setUserAndCache(userData)
          } catch {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
              setUserAndCache(null)
              router.push('/login')
              signedOut = true
            }
          } finally {
            if (!signedOut) getQueryClient().invalidateQueries()
          }
        } else {
          setUserAndCache(null)
          router.push('/login')
        }
      }
    })

    // Validate session when user returns to the tab after being away.
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        try { await supabase.auth.signOut() } catch { /* ignore */ }
        setUserAndCache(null)
        router.push('/login')
        return
      }

      getQueryClient().invalidateQueries()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cross-tab sync: if another tab logs out, detect via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHED_USER_KEY && e.newValue === null) {
        setUser(null)
        setLoading(false)
        router.push('/login')
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router, setUserAndCache])

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

          setUserAndCache(userData)

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
          setUserAndCache(userData)

          // Send welcome email via API route (fire-and-forget - don't block signup if email fails)
          console.log('📧 Sending welcome email to:', email)
          fetch('/api/emails/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              firstName: metadata.firstName,
              role: metadata.role,
            }),
          })
            .then(async response => {
              const data = await response.json()
              if (response.ok) {
                console.log('✅ Welcome email sent successfully:', data)
              } else {
                console.error('❌ Welcome email API error:', data)
              }
            })
            .catch(error => {
              console.error('❌ Failed to send welcome email:', error)
              // Don't throw - signup was successful
            })
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

    // Always redirect even if signOut fails (e.g. token already expired)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[logout] signOut failed, proceeding with local cleanup:', err)
    }
    setUserAndCache(null)
    router.push('/login')
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

      setUserAndCache({
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
    } catch (error: unknown) {
      isUpdatingPassword.current = false
      const errorMessage = getErrorMessage(error)
      logError('updatePassword', error, { userId: user?.id })

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: new Error(
            'La solicitud tardó demasiado. Por favor verifica tu conexión e intenta de nuevo.'
          ),
        }
      }

      return { error: error instanceof Error ? error : new Error(errorMessage) }
    }
  }

  // IMPORTANT: Always render children through the Provider.
  // Previously, `if (loading) return <spinner>` blocked ALL rendering,
  // preventing React Query hooks from mounting and making Supabase requests.
  // The middleware already validates auth cookies, so data fetching can
  // start immediately. User info (name, avatar, role) loads asynchronously.
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
