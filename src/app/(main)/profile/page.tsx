// src/app/profile/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { UserProfileSchema, UserProfileFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AvatarUpload } from '@/components/avatar-upload';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RoleBadge } from '@/components/rbac/role-badge';
import { Separator } from '@/components/ui/separator';

// Password change schema
const PasswordChangeSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type PasswordChangeFormData = z.infer<typeof PasswordChangeSchema>;

export default function ProfilePage() {
  const { user, updateUser, updatePassword } = useAuth();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [isPasswordPending, setIsPasswordPending] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Split name into firstName and lastName
  const [firstName, ...lastNameParts] = (user?.name || '').split(' ');
  const lastName = lastNameParts.join(' ');

  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: {
      firstName: firstName || '',
      lastName: lastName || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onFormSubmit = async (data: UserProfileFormData) => {
    console.log('📝 [Profile] Form submitted:', data);
    setIsPending(true);

    try {
      console.log('📝 [Profile] Calling updateUser...');
      // Combine firstName and lastName for the API
      const { error } = await updateUser({
        name: `${data.firstName} ${data.lastName}`.trim(),
        avatarUrl: data.avatarUrl,
      });
      console.log('📝 [Profile] updateUser returned:', { error });

      if (error) {
        console.error('📝 [Profile] Update error:', error);
        toast({
          title: 'Error',
          description: error.message || 'No se pudo actualizar el perfil.',
          variant: 'destructive',
        });
        return;
      }

      console.log('📝 [Profile] Update successful!');
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido guardada.',
      });
    } catch (error) {
      console.error('📝 [Profile] Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al actualizar el perfil.',
        variant: 'destructive',
      });
    } finally {
      console.log('📝 [Profile] Setting isPending to false');
      setIsPending(false);
    }
  };

  const handleAvatarChange = (url: string) => {
    form.setValue('avatarUrl', url);
  };

  const onPasswordSubmit = async (data: PasswordChangeFormData) => {
    console.log('🔐 [onPasswordSubmit] Starting password change...')
    setIsPasswordPending(true);

    try {
      console.log('🔐 [onPasswordSubmit] Calling updatePassword...')
      const result = await Promise.race([
        updatePassword(data.newPassword),
        new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => {
            console.error('⏱️ [onPasswordSubmit] Timeout reached after 15s')
            reject(new Error('Timeout: La solicitud tardó demasiado'))
          }, 15000)  // Reducido a 15 segundos
        )
      ]);

      console.log('🔐 [onPasswordSubmit] updatePassword returned:', result)

      if (result.error) {
        console.error('🔐 [onPasswordSubmit] Error updating password:', result.error)
        toast({
          title: 'Error',
          description: result.error.message || 'No se pudo actualizar la contraseña.',
          variant: 'destructive',
        });
        setIsPasswordPending(false);
        return;
      }

      console.log('🔐 [onPasswordSubmit] Password updated successfully!')
      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido actualizada exitosamente.',
      });
      // Reset form
      passwordForm.reset();
      setIsPasswordPending(false);

    } catch (error: any) {
      console.error('🔐 [onPasswordSubmit] Caught error:', error)

      // Handle specific error types
      let errorMessage = 'Ocurrió un error al actualizar la contraseña.';
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        errorMessage = 'La solicitud fue cancelada. Por favor intenta de nuevo.';
      } else if (error.message?.includes('Timeout')) {
        errorMessage = 'La solicitud tardó demasiado. Por favor intenta de nuevo.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsPasswordPending(false);
    }
  };

  if (!user) {
    return null;
  }

  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex justify-center items-start pt-10">
      <div className="w-full max-w-2xl space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <div>
              <CardTitle className="font-headline text-2xl">Mi Perfil</CardTitle>
              <CardDescription>
                Actualiza tu información personal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
              {/* Avatar Upload */}
              <div>
                <AvatarUpload
                  currentAvatarUrl={form.watch('avatarUrl')}
                  userInitials={userInitials}
                  onAvatarChange={handleAvatarChange}
                />
              </div>

              {/* User Info Display */}
              <div className="grid gap-1.5 leading-none">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="font-semibold text-xl">{user.name}</h2>
                  <RoleBadge />
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hidden field for avatarUrl */}
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => <input type="hidden" {...field} />}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Security Section - Password Change */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Seguridad</CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              {/* New Password */}
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
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
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showNewPassword ? (
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

              {/* Confirm Password */}
              <FormField
                control={passwordForm.control}
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
                          aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

              <div className="flex justify-end">
                <Button type="submit" disabled={isPasswordPending}>
                  {isPasswordPending ? 'Actualizando...' : 'Cambiar Contraseña'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
