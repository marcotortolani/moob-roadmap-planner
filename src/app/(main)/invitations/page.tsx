'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useIsAdmin } from '@/lib/rbac/hooks'
import { supabase } from '@/lib/supabase/client'
import { Loader2, ShieldAlert } from 'lucide-react'

import { InvitationForm } from './components/invitation-form'
import { InvitationList } from './components/invitation-list'
import { UsersList } from './components/users-list'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface Invitation {
  id: string
  email: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  token: string
  expires_at: string
  created_at: string
  accepted_at?: string | null
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  created_at: string
  auth_user_id: string
}

export default function InvitationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const isAdmin = useIsAdmin()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is admin
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, authLoading, isAdmin, router])

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching invitations:', error)
        return
      }

      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    await Promise.all([fetchInvitations(), fetchUsers()])
    setIsLoading(false)
  }

  useEffect(() => {
    if (user && isAdmin) {
      fetchData()
    }
  }, [user, isAdmin])

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Solo los administradores pueden acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-screen-3xl py-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">
          Gestión de Usuarios e Invitaciones
        </h1>
        <p className="text-muted-foreground">
          Gestiona usuarios registrados y envía invitaciones a nuevos usuarios
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">
            Usuarios ({users.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitaciones ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UsersList
            users={users}
            currentUserId={user?.authUserId || ''}
            onUpdate={fetchData}
          />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <InvitationForm onSuccess={fetchData} />
            </div>

            <div className="md:col-span-2">
              <InvitationList
                invitations={invitations || []}
                onRevoke={fetchData}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
