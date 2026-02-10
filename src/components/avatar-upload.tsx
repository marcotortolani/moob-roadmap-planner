'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, X } from 'lucide-react';
import { storageService } from '@/lib/supabase/storage';
import { isFailure } from '@/lib/errors';

type UploadStep = 'idle' | 'compressing' | 'validating' | 'uploading' | 'success' | 'error';

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
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const isUploading = uploadStep !== 'idle' && uploadStep !== 'success' && uploadStep !== 'error';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  const startCancelTimer = () => {
    // Show cancel button after 10s
    cancelTimeoutRef.current = setTimeout(() => {
      setShowCancelButton(true);
    }, 10000);
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current);
    }
    setUploadStep('idle');
    setShowCancelButton(false);
    toast({
      title: 'Subida cancelada',
      description: 'La subida del avatar ha sido cancelada.',
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

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    setUploadStep('compressing');
    setShowCancelButton(false);
    startCancelTimer();

    try {
      // Step 1: Compress image
      console.log('🖼️ Comprimiendo imagen...');
      const compressedBlob = await compressImage(file);
      console.log('🖼️ Imagen comprimida:', {
        originalSize: file.size,
        compressedSize: compressedBlob.size,
      });

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Operación cancelada');
      }

      // Step 2: Validate session + upload
      setUploadStep('validating');

      // Small delay to show validation step
      await new Promise(resolve => setTimeout(resolve, 300));

      setUploadStep('uploading');

      // Step 3: Upload using storage service
      const result = await storageService.uploadAvatar(compressedBlob, file.name);

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Operación cancelada');
      }

      if (isFailure(result)) {
        throw new Error(result.message || result.error.message);
      }

      const publicUrl = result.data;

      console.log('✅ Avatar subido exitosamente:', publicUrl);

      setUploadStep('success');
      setPreviewUrl(publicUrl);
      onAvatarChange(publicUrl);

      // Clear cancel timer
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
      }

      toast({
        title: 'Avatar actualizado',
        description: 'Tu foto de perfil ha sido actualizada.',
      });

      // Reset to idle after 1s
      setTimeout(() => setUploadStep('idle'), 1000);
    } catch (error) {
      console.error('❌ Error al subir avatar:', error);

      setUploadStep('error');

      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo subir el avatar',
        variant: 'destructive',
      });

      // Reset to idle after 2s
      setTimeout(() => setUploadStep('idle'), 2000);
    } finally {
      setShowCancelButton(false);

      // Clear cancel timer
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getUploadStepMessage = () => {
    switch (uploadStep) {
      case 'compressing':
        return '⏳ Paso 1/3: Comprimiendo...';
      case 'validating':
        return '🔐 Paso 2/3: Validando...';
      case 'uploading':
        return '☁️ Paso 3/3: Subiendo...';
      case 'success':
        return '✅ ¡Completado!';
      case 'error':
        return '❌ Error';
      default:
        return null;
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

        <div className="flex items-center gap-2">
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
                {getUploadStepMessage()}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Cambiar foto
              </>
            )}
          </Button>

          {showCancelButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelUpload}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          JPG, PNG o WebP (max 5MB)
        </p>
      </div>
    </div>
  );
}
