'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, Edit, MoreVertical, User as UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  created_at: string
  auth_user_id: string
}

interface UsersListProps {
  users: User[]
  currentUserId: string
  onUpdate?: () => void
}

const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrador',
    className: 'badge-role-admin',
  },
  USER: {
    label: 'Usuario',
    className: 'badge-role-user',
  },
  GUEST: {
    label: 'Invitado',
    className: 'badge-role-guest',
  },
  BLOCKED: {
    label: 'Bloqueado',
    className: 'badge-role-blocked',
  },
}

export function UsersList({ users, currentUserId, onUpdate }: UsersListProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<'ADMIN' | 'USER' | 'GUEST'>('USER')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleRoleClick = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setRoleDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    setIsDeleting(true)

    try {
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar usuario')
      }

      toast({
        title: 'Usuario eliminado',
        description: `${selectedUser.email} ha sido eliminado correctamente`,
      })

      setDeleteDialogOpen(false)
      setSelectedUser(null)
      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo eliminar el usuario',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser || newRole === selectedUser.role) {
      setRoleDialogOpen(false)
      return
    }

    setIsUpdatingRole(true)

    try {
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar rol')
      }

      toast({
        title: 'Rol actualizado',
        description: `El rol de ${selectedUser.email} ha sido actualizado a ${ROLE_CONFIG[newRole].label}`,
      })

      setRoleDialogOpen(false)
      setSelectedUser(null)
      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo actualizar el rol',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const getUserName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.email
  }

  if (users.length === 0) {
    return (
      <Card className="neo-card" style={{ borderRadius: 0 }}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No hay usuarios registrados</p>
          <p className="text-sm text-muted-foreground">
            Los usuarios registrados aparecerán aquí
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="neo-card" style={{ borderRadius: 0 }}>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Gestiona los usuarios que ya tienen acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Usuario</TableHead>
                  <TableHead className="min-w-[100px]">Rol</TableHead>
                  <TableHead className="min-w-[120px]">Registrado</TableHead>
                  <TableHead className="text-right min-w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role]
                  const isCurrentUser = user.auth_user_id === currentUserId

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {getUserName(user)}
                            {isCurrentUser && (
                              <Badge variant={undefined} className="neo-badge bg-neo-gray-light text-black text-xs">
                                Tú
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={undefined} className={roleConfig.className}>
                          {roleConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at + 'Z'), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="neo-button">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRoleClick(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Cambiar rol
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="neo-card" style={{ borderRadius: 0 }}>
          <AlertDialogHeader className="border-b-2 border-black pb-4">
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>{selectedUser?.email}</strong>? Esta acción no se puede
              deshacer y el usuario perderá acceso al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="neo-button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 neo-button"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="neo-card" style={{ borderRadius: 0 }}>
          <DialogHeader className="border-b-2 border-black pb-4">
            <DialogTitle>Cambiar rol de usuario</DialogTitle>
            <DialogDescription>
              Cambia el rol de {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value) => setNewRole(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col">
                    <span className="font-medium">Administrador</span>
                    <span className="text-xs text-muted-foreground">
                      Acceso completo: crear, editar y eliminar
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="USER">
                  <div className="flex flex-col">
                    <span className="font-medium">Usuario</span>
                    <span className="text-xs text-muted-foreground">
                      Puede crear y editar productos
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="GUEST">
                  <div className="flex flex-col">
                    <span className="font-medium">Invitado</span>
                    <span className="text-xs text-muted-foreground">
                      Solo puede ver productos
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="BLOCKED">
                  <div className="flex flex-col">
                    <span className="font-medium">Bloqueado</span>
                    <span className="text-xs text-muted-foreground">
                      No puede ingresar a la aplicación
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={isUpdatingRole}
              className="neo-button"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdatingRole} className="neo-button">
              {isUpdatingRole ? 'Actualizando...' : 'Actualizar rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
