import { supabase } from './client'
import type { ActionResult } from '@/lib/errors'
import { success, failure, StorageError } from '@/lib/errors'

/**
 * Type-safe storage service for avatars
 */
export class StorageService {
  /**
   * Upload avatar for user
   */
  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<ActionResult<string>> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return failure(
          new StorageError('Invalid file type', 'write'),
          'El archivo debe ser una imagen (JPEG, PNG, o WebP)'
        )
      }

      if (file.size > 2 * 1024 * 1024) {
        return failure(
          new StorageError('File too large', 'write'),
          'El archivo no debe superar 2MB'
        )
      }

      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${userId}/${Date.now()}.${ext}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)

      return success(publicUrl)
    } catch (error) {
      console.error('Avatar upload error:', error)
      return failure(
        new StorageError('Upload failed', 'write'),
        'Error al subir el avatar'
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
