'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userInitials: string;
  onAvatarChange: (url: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  userInitials,
  onAvatarChange,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Calculate new dimensions (max 300x300)
          let width = img.width;
          let height = img.height;
          const maxSize = 300;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('No se pudo comprimir la imagen'));
              }
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'El archivo debe ser una imagen (JPG, PNG, WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Compress image
      console.log('🖼️ Comprimiendo imagen...');
      const compressedBlob = await compressImage(file);
      console.log('🖼️ Imagen comprimida:', {
        originalSize: file.size,
        compressedSize: compressedBlob.size,
      });

      // Get current user
      console.log('👤 Obteniendo sesión...');
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log('👤 Sesión:', { session: !!session, error: sessionError });

      if (sessionError) {
        throw new Error(`Error al obtener sesión: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      console.log('☁️ Subiendo a Supabase Storage...', {
        bucket: 'avatars',
        fileName,
        blobSize: compressedBlob.size,
        blobType: compressedBlob.type,
      });

      // Upload to Supabase Storage
      const uploadStartTime = Date.now();
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      console.log('☁️ Upload response:', {
        duration: `${Date.now() - uploadStartTime}ms`,
        data,
        error,
      });

      if (error) {
        console.error('❌ Error de Supabase Storage:', error);
        throw new Error(`Error al subir: ${error.message}`);
      }

      if (!data) {
        throw new Error('No se recibió respuesta de Supabase Storage');
      }

      // Get public URL
      console.log('🔗 Generando URL pública...', data.path);
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(data.path);

      console.log('✅ Avatar subido exitosamente:', publicUrl);

      setPreviewUrl(publicUrl);
      onAvatarChange(publicUrl);

      toast({
        title: 'Avatar actualizado',
        description: 'Tu foto de perfil ha sido actualizada.',
      });
    } catch (error) {
      console.error('❌ Error al subir avatar:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo subir el avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-24 w-24 border-3 border-black">
        <AvatarImage src={previewUrl} alt="Avatar" />
        <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Cambiar foto
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG o WebP (max 5MB)
        </p>
      </div>
    </div>
  );
}
