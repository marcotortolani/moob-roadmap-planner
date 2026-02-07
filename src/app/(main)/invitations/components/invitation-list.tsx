'use client'

import { useState } from 'react'
import { formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Copy,
  Trash2,
  MoreVertical,
} from 'lucide-react'

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
import { useToast } from '@/hooks/use-toast'
import { Invitation } from '../page'

interface InvitationListProps {
  invitations: Invitation[]
  onRevoke?: () => void
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    icon: Clock,
    className: 'badge-status-pending',
    color: 'text-yellow-600',
  },
  ACCEPTED: {
    label: 'Aceptada',
    icon: CheckCircle2,
    className: 'badge-status-accepted',
    color: 'text-green-600',
  },
  EXPIRED: {
    label: 'Expirada',
    icon: XCircle,
    className: 'badge-status-expired',
    color: 'text-gray-600',
  },
  REVOKED: {
    label: 'Revocada',
    icon: Ban,
    className: 'badge-status-revoked',
    color: 'text-red-600',
  },
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

export function InvitationList({ invitations, onRevoke }: InvitationListProps) {
  const { toast } = useToast()
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/signup?token=${token}`
    navigator.clipboard.writeText(inviteLink)
    toast({
      title: 'Enlace copiado',
      description: 'El enlace de invitación ha sido copiado al portapapeles',
    })
  }

  const handleRevoke = async () => {
    if (!selectedInvitation) return

    setIsRevoking(true)

    try {
      const response = await fetch('/api/invitations/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId: selectedInvitation.id }),
      })

      if (!response.ok) {
        throw new Error('Error al revocar invitación')
      }

      toast({
        title: 'Invitación revocada',
        description: `La invitación a ${selectedInvitation.email} ha sido revocada`,
      })

      setRevokeDialogOpen(false)
      setSelectedInvitation(null)
      onRevoke?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo revocar la invitación',
        variant: 'destructive',
      })
    } finally {
      setIsRevoking(false)
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const formatSentTime = (sentDate: string) => {
    const now = new Date()
    // Parse the UTC timestamp and convert to local time
    const sent = new Date(sentDate + 'Z') // Add 'Z' to ensure it's parsed as UTC

    const days = differenceInDays(now, sent)
    const hours = differenceInHours(now, sent)
    const minutes = differenceInMinutes(now, sent)

    if (days >= 2) {
      return `hace ${days} días`
    } else if (days >= 1) {
      return 'ayer'
    } else if (hours >= 1) {
      return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
    } else if (minutes >= 1) {
      return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
    } else {
      return 'hace un momento'
    }
  }

  const formatExpiresTime = (sentDate: string) => {
    const now = new Date()
    // Parse the UTC timestamp and convert to local time
    const sent = new Date(sentDate + 'Z') // Add 'Z' to ensure it's parsed as UTC
    const expires = new Date(sent.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 días

    const days = differenceInDays(expires, now)
    const hours = differenceInHours(expires, now)
    const minutes = differenceInMinutes(expires, now)

    if (days >= 2) {
      return `en ${days} días`
    } else if (days >= 1) {
      return 'mañana'
    } else if (hours >= 1) {
      return `en ${hours} ${hours === 1 ? 'hora' : 'horas'}`
    } else if (minutes >= 1) {
      return `en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
    } else {
      return 'expira pronto'
    }
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No hay invitaciones</p>
          <p className="text-sm text-muted-foreground">
            Las invitaciones que envíes aparecerán aquí
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invitaciones</CardTitle>
          <CardDescription>
            Gestiona las invitaciones enviadas a nuevos usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[100px]">Rol</TableHead>
                  <TableHead className="min-w-[120px]">Estado</TableHead>
                  <TableHead className="min-w-[120px]">Enviada</TableHead>
                  <TableHead className="min-w-[120px]">Expira</TableHead>
                  <TableHead className="text-right min-w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {invitations.map((invitation) => {
                const statusConfig = STATUS_CONFIG[invitation.status]
                const roleConfig =
                  ROLE_CONFIG[invitation.role as keyof typeof ROLE_CONFIG]
                const StatusIcon = statusConfig.icon
                const expired = isExpired(invitation.expires_at)

                return (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invitation.role.toLowerCase() as 'admin' | 'user' | 'guest'}>
                        {roleConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`h-4 w-4 ${statusConfig.color}`}
                        />
                        <Badge variant={invitation.status.toLowerCase() as 'pending' | 'accepted' | 'expired' | 'revoked'}>
                          {statusConfig.label}
                        </Badge>
                        {expired && invitation.status === 'PENDING' && (
                          <Badge variant="expired">Expirada</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatSentTime(invitation.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.status === 'ACCEPTED'
                        ? '-'
                        : invitation.status === 'EXPIRED' || expired
                          ? 'Expirada'
                          : formatExpiresTime(invitation.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {invitation.status === 'PENDING' && !expired && (
                            <>
                              <DropdownMenuItem
                                onClick={() => copyInviteLink(invitation.token)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar enlace
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedInvitation(invitation)
                                  setRevokeDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revocar
                              </DropdownMenuItem>
                            </>
                          )}
                          {(invitation.status !== 'PENDING' || expired) && (
                            <DropdownMenuItem disabled>
                              No hay acciones disponibles
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar invitación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas revocar la invitación enviada a{' '}
              <strong>{selectedInvitation?.email}</strong>? El usuario no podrá
              usar el enlace de invitación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? 'Revocando...' : 'Revocar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
