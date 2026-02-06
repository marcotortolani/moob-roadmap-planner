'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { ArrowLeft, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onFormSubmit = async (data: ForgotPasswordFormData) => {
    setIsPending(true)

    try {
      const { error } = await resetPassword(data.email)

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo enviar el email de recuperación.',
          variant: 'destructive',
        })
      } else {
        setEmailSent(true)
        toast({
          title: 'Email enviado',
          description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error. Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="neo-card" style={{ borderRadius: 0 }}>
        <CardHeader className="space-y-1 border-b-2 border-black">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="font-headline text-2xl text-center uppercase">
            Email Enviado
          </CardTitle>
          <CardDescription className="text-center">
            Te hemos enviado un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Si no ves el email en tu bandeja de entrada, revisa la carpeta de spam o correo
              no deseado.
            </AlertDescription>
          </Alert>

          <Button asChild className="neo-button w-full uppercase font-bold" variant="outline">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neo-card" style={{ borderRadius: 0 }}>
      <CardHeader className="space-y-1 border-b-2 border-black">
        <CardTitle className="font-headline text-2xl uppercase">Recuperar Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      className="neo-input"
                      style={{ borderRadius: 0 }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Button type="submit" className="neo-button w-full uppercase font-bold" disabled={isPending}>
                {isPending ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              <Button asChild className="neo-button w-full uppercase font-bold" variant="ghost">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
