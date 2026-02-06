'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Send, Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const InvitationSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'USER', 'GUEST'], {
    required_error: 'Selecciona un rol',
  }),
})

type InvitationFormData = z.infer<typeof InvitationSchema>

interface InvitationFormProps {
  onSuccess?: () => void
}

export function InvitationForm({ onSuccess }: InvitationFormProps) {
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(InvitationSchema),
    defaultValues: {
      email: '',
      role: undefined,
    },
  })

  const onSubmit = async (data: InvitationFormData) => {
    setIsPending(true)
    setInviteLink(null)

    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar invitación')
      }

      // Set the invite link to display
      if (result.data?.inviteLink) {
        setInviteLink(result.data.inviteLink)
      }

      toast({
        title: 'Invitación creada',
        description: `Copia el enlace y envíalo a ${data.email}`,
        duration: 5000,
      })

      form.reset()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al enviar invitación',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      toast({
        title: 'Copiado',
        description: 'Link de invitación copiado al portapapeles',
      })
    }
  }

  return (
    <Card className="neo-card" style={{ borderRadius: 0 }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Enviar Invitación
        </CardTitle>
        <CardDescription>
          Invita a nuevos usuarios a unirse al Roadmap Planner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      {...field}
                      className="neo-input"
                      style={{ borderRadius: 0 }}
                    />
                  </FormControl>
                  <FormDescription>
                    El usuario recibirá un email con un enlace de registro
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full neo-button" disabled={isPending}>
              {isPending ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Crear Invitación
                </>
              )}
            </Button>

            {inviteLink && (
              <Alert className="mt-4">
                <Mail className="h-4 w-4" />
                <AlertTitle>Link de Invitación Generado</AlertTitle>
                <AlertDescription>
                  <p className="text-sm mb-2">
                    Copia este enlace y envíaselo al usuario:
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <code className="flex-1 w-full p-2 bg-muted rounded text-xs break-all overflow-wrap-anywhere">
                      {inviteLink}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="w-full sm:w-auto shrink-0 neo-button"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
