'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Eye, EyeOff, Upload, CheckCircle2, Loader2 } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { storageService } from '@/lib/supabase/storage'

const SignupSchema = z
  .object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
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

type SignupFormData = z.infer<typeof SignupSchema>

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signup } = useAuth()
  const { toast } = useToast()

  const [isPending, setIsPending] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Invitation data
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null)
  const [invitationRole, setInvitationRole] = useState<string | null>(null)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Validate invitation token on mount
  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      toast({
        title: 'Token inválido',
        description: 'No se proporcionó un token de invitación válido.',
        variant: 'destructive',
      })
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    setInvitationToken(token)

    // Validate token via API
    fetch(`/api/invitations/validate?token=${token}`)
      .then(async (res) => {
        const contentType = res.headers.get('content-type')

        // Check if response is JSON
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('Expected JSON but received:', text.substring(0, 200))
          throw new Error('El servidor devolvió una respuesta inválida')
        }

        return res.json()
      })
      .then((result) => {
        setIsValidatingToken(false)

        if (result.success) {
          setInvitationEmail(result.data.email)
          setInvitationRole(result.data.role)
        } else {
          toast({
            title: 'Invitación inválida',
            description: result.message || 'El token de invitación es inválido o ha expirado.',
            variant: 'destructive',
          })
          setTimeout(() => router.push('/login'), 3000)
        }
      })
      .catch((error) => {
        setIsValidatingToken(false)
        toast({
          title: 'Error',
          description: error.message || 'Error al validar la invitación.',
          variant: 'destructive',
        })
        console.error('Validation error:', error)
      })
  }, [searchParams, router, toast])

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'))
            return
          }

          // Calculate new dimensions (max 300x300)
          let width = img.width
          let height = img.height
          const maxSize = 300

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                reject(new Error('No se pudo comprimir la imagen'))
              }
            },
            'image/jpeg',
            0.85 // 85% quality
          )
        }
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'La imagen no debe superar 5MB.',
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Tipo de archivo inválido',
        description: 'Solo se permiten imágenes (JPEG, PNG, WebP).',
        variant: 'destructive',
      })
      return
    }

    try {
      console.log('🖼️ Comprimiendo imagen...')
      const compressedFile = await compressImage(file)
      console.log('🖼️ Imagen comprimida:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
      })

      setAvatarFile(compressedFile)

      // Generate preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Error compressing image:', error)
      toast({
        title: 'Error',
        description: 'No se pudo procesar la imagen.',
        variant: 'destructive',
      })
    }
  }

  const onFormSubmit = async (data: SignupFormData) => {
    if (!invitationEmail || !invitationRole || !invitationToken) {
      toast({
        title: 'Error',
        description: 'Datos de invitación incompletos.',
        variant: 'destructive',
      })
      return
    }

    setIsPending(true)

    try {
      // FIRST: Create account (this will authenticate the user)
      const { error: signupError } = await signup(invitationEmail, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        role: invitationRole,
      })

      if (signupError) {
        toast({
          title: 'Error al crear cuenta',
          description: signupError.message || 'No se pudo crear la cuenta.',
          variant: 'destructive',
        })
        return
      }

      // SECOND: Upload avatar if provided (now user is authenticated)
      let avatarUrl: string | undefined
      if (avatarFile) {
        console.log('📤 Uploading avatar after signup...')
        const uploadResult = await storageService.uploadAvatar(
          'temp', // Will be replaced with actual user ID in the storage service
          avatarFile
        )

        if (uploadResult.success) {
          avatarUrl = uploadResult.data
          console.log('✅ Avatar uploaded successfully:', avatarUrl)

          // Update user profile with avatar URL
          const updateResponse = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${data.firstName} ${data.lastName}`,
              avatarUrl,
            }),
          })

          if (!updateResponse.ok) {
            console.error('❌ Failed to update avatar in profile')
          }
        } else {
          console.error('❌ Avatar upload failed:', uploadResult.error)
          toast({
            title: 'Advertencia',
            description: 'No se pudo subir el avatar, pero tu cuenta fue creada exitosamente.',
          })
        }
      }

      // THIRD: Mark invitation as accepted via API
      await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitationToken }),
      })

      setSignupSuccess(true)
      toast({
        title: 'Cuenta creada',
        description: 'Tu cuenta ha sido creada exitosamente.',
      })

      setTimeout(() => router.push('/'), 2000)
    } catch (error) {
      console.error('Signup error:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al crear la cuenta. Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  if (isValidatingToken) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Validando invitación...</p>
        </CardContent>
      </Card>
    )
  }

  if (signupSuccess) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="font-headline text-2xl text-center">
            ¡Bienvenido!
          </CardTitle>
          <CardDescription className="text-center">
            Tu cuenta ha sido creada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Redirigiendo...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-headline text-2xl">Completar Registro</CardTitle>
        <CardDescription>
          Completa tu información para acceder al Roadmap Planner
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Invitation Info */}
        <div className="mb-6 space-y-2 rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email:</span>
            <span className="text-sm text-muted-foreground">{invitationEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Rol:</span>
            <Badge variant="secondary">{invitationRole}</Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <FormItem>
              <FormLabel>Foto de Perfil (Opcional)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-border">
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        {avatarPreview ? 'Cambiar' : 'Subir'} Foto
                      </span>
                    </Button>
                  </label>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Tamaño máximo: 2MB. Formatos: JPEG, PNG, WebP
              </FormDescription>
            </FormItem>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
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

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
