'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'

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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Verify reset token on mount
  // Supabase handles the code automatically via PKCE flow and creates a session
  useEffect(() => {
    // Check if we have an authenticated session (Supabase already processed the code)
    // Or if we have the legacy hash-based token
    const checkAuth = async () => {
      // Check for legacy hash-based flow (implicit)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      // Check for PKCE flow (code in query params - Supabase processes this automatically)
      const queryParams = searchParams
      const code = queryParams.get('code')
      const error = queryParams.get('error')
      const errorDescription = queryParams.get('error_description')

      // If there's an error from Supabase
      if (error) {
        toast({
          title: 'Error',
          description: errorDescription || 'El enlace de recuperación es inválido o ha expirado.',
          variant: 'destructive',
        })
        setTimeout(() => router.push('/forgot-password'), 3000)
        return
      }

      // If we have a code (PKCE flow) or access_token (implicit flow), we're good
      // Supabase will handle the code automatically and create a session
      if (code || (accessToken && type === 'recovery')) {
        // Session will be created automatically by Supabase
        // User can now set their new password
        return
      }

      // If we don't have a code or token, but we might already have a session
      // (e.g., after page reload), that's also fine - user can proceed
      // The middleware will handle redirects if there's no valid session
    }

    checkAuth()
  }, [router, toast, searchParams])

  const onFormSubmit = async (data: ResetPasswordFormData) => {
    setIsPending(true)

    try {
      const { error } = await updatePassword(data.password)

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo actualizar la contraseña.',
          variant: 'destructive',
        })
      } else {
        setResetSuccess(true)
        toast({
          title: 'Contraseña actualizada',
          description: 'Tu contraseña ha sido actualizada exitosamente.',
        })
        setTimeout(() => router.push('/login'), 2000)
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

  if (resetSuccess) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="font-headline text-2xl text-center">
            Contraseña Actualizada
          </CardTitle>
          <CardDescription className="text-center">
            Tu contraseña ha sido actualizada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Redirigiendo al inicio de sesión...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-headline text-2xl">Nueva Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña para tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Mínimo 8 caracteres, con mayúsculas, minúsculas y números
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={
                          showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>

              <Button asChild className="w-full" variant="ghost">
                <Link href="/login">Cancelar</Link>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Wrapper with Suspense for Next.js 15 useSearchParams compatibility
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
