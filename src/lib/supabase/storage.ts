import { supabase } from './client'
import type { ActionResult } from '@/lib/errors'
import { success, failure, StorageError, AppError } from '@/lib/errors'
import { withTimeout, TimeoutError } from '@/lib/utils/async'

/**
 * Type-safe storage service for avatars with timeout protection
 */
export class StorageService {
  private readonly SESSION_TIMEOUT = 5000 // 5s to validate session
  private readonly UPLOAD_TIMEOUT = 15000 // 15s to upload image

  /**
   * Validate current session with timeout
   * @private
   */
  private async validateSession(): Promise<ActionResult<string>> {
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        this.SESSION_TIMEOUT,
        'obtener sesión'
      )

      if (error) {
        return failure(
          new AppError(`Error de autenticación: ${error.message}`),
          'Error al verificar tu sesión. Intenta cerrar sesión y volver a entrar.'
        )
      }

      if (!session) {
        return failure(
          new AppError('No hay sesión activa'),
          'Debes iniciar sesión nuevamente para subir imágenes'
        )
      }

      return success(session.user.id)
    } catch (error) {
      if (error instanceof TimeoutError) {
        return failure(
          new AppError('Timeout al verificar sesión'),
          'La verificación de sesión está tardando demasiado. Revisa tu conexión.'
        )
      }

      return failure(
        new AppError('Error desconocido al verificar sesión'),
        'No se pudo verificar tu sesión. Intenta nuevamente.'
      )
    }
  }

  /**
   * Upload avatar from compressed blob
   *
   * @param compressedBlob - Compressed image blob (JPEG)
   * @param originalFileName - Original file name for extension detection
   * @returns Public URL or error
   */
  async uploadAvatar(
    compressedBlob: Blob,
    originalFileName: string
  ): Promise<ActionResult<string>> {
    try {
      // Step 1: Validate session (with timeout)
      console.log('🔐 Validando sesión...')
      const sessionResult = await this.validateSession()

      if (!sessionResult.success) {
        console.error('❌ Sesión inválida:', sessionResult.error)
        return sessionResult
      }

      const userId = sessionResult.data

      // Step 2: Validate blob
      if (compressedBlob.size > 2 * 1024 * 1024) {
        return failure(
          new StorageError('Compressed file too large', 'write'),
          'La imagen comprimida excede 2MB. Intenta con una imagen más pequeña.'
        )
      }

      // Step 3: Generate unique filename
      const fileExt = originalFileName.split('.').pop() || 'jpg'
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      console.log('☁️ Subiendo a Supabase Storage...', {
        bucket: 'avatars',
        fileName,
        blobSize: compressedBlob.size,
      })

      // Step 4: Upload with timeout
      const uploadStartTime = Date.now()
      const { data, error } = await withTimeout(
        supabase.storage
          .from('avatars')
          .upload(fileName, compressedBlob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/jpeg',
          }),
        this.UPLOAD_TIMEOUT,
        'subir imagen a Storage'
      )

      console.log('☁️ Upload response:', {
        duration: `${Date.now() - uploadStartTime}ms`,
        success: !!data,
        error: error?.message,
      })

      if (error) {
        console.error('❌ Error de Supabase Storage:', error)
        return failure(
          new StorageError(`Upload failed: ${error.message}`, 'write'),
          `Error al subir la imagen: ${error.message}`
        )
      }

      if (!data) {
        return failure(
          new StorageError('No data returned from upload', 'write'),
          'No se recibió confirmación de la subida. Intenta nuevamente.'
        )
      }

      // Step 5: Get public URL
      console.log('🔗 Generando URL pública...', data.path)
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)

      console.log('✅ Avatar subido exitosamente:', publicUrl)

      return success(publicUrl)
    } catch (error) {
      console.error('❌ Error al subir avatar:', error)

      if (error instanceof TimeoutError) {
        return failure(
          new StorageError('Upload timeout', 'write'),
          'La subida está tardando demasiado (>15s). Verifica tu conexión a internet.'
        )
      }

      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'write'
        ),
        error instanceof Error
          ? error.message
          : 'Error desconocido al subir el avatar'
      )
    }
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(path: string): Promise<ActionResult<void>> {
    try {
      // Extract path from URL if needed
      const cleanPath = path.includes('/avatars/')
        ? path.split('/avatars/')[1]
        : path

      const { error } = await supabase.storage
        .from('avatars')
        .remove([cleanPath])

      if (error) throw error

      return success(undefined)
    } catch (error) {
      console.error('Avatar delete error:', error)
      return failure(
        new StorageError('Delete failed', 'delete'),
        'Error al eliminar el avatar'
      )
    }
  }
}

export const storageService = new StorageService()
