import type { IOperatorRepository } from '../../operator.repository'
import type { Operator } from '@/lib/types'
import type { ActionResult } from '@/lib/errors'
import { success, failure, StorageError } from '@/lib/errors'
import { supabase } from '@/lib/supabase/client'

export class SupabaseOperatorRepository implements IOperatorRepository {
  private tableName = 'operators'

  /**
   * Normalize a name for case-insensitive comparison
   */
  private normalizeName(name: string): string {
    return name.trim().toLowerCase()
  }

  async getAll(): Promise<ActionResult<Operator[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return failure(new StorageError(error.message, 'read'))
      }

      return success(data.map(this.mapToOperator))
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'read',
        ),
      )
    }
  }

  async getById(id: string): Promise<ActionResult<Operator | null>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return success(null)
        }
        return failure(new StorageError(error.message, 'read'))
      }

      return success(this.mapToOperator(data))
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'read',
        ),
      )
    }
  }

  async findByNormalizedName(
    name: string,
  ): Promise<ActionResult<Operator | null>> {
    try {
      const normalized = this.normalizeName(name)
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('normalized_name', normalized)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return success(null)
        }
        return failure(new StorageError(error.message, 'read'))
      }

      return success(this.mapToOperator(data))
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'read',
        ),
      )
    }
  }

  async getOrCreate(
    name: string,
    createdById: string,
  ): Promise<ActionResult<Operator>> {
    // First, try to find existing operator
    const normalized = this.normalizeName(name)
    const findResult = await this.findByNormalizedName(name)

    if (!findResult.success) {
      return findResult as ActionResult<Operator>
    }

    if (findResult.data) {
      // Already exists, return it
      return success(findResult.data)
    }

    // Doesn't exist, create it
    try {
      const trimmedName = name.trim()
      // Generate ID client-side (Prisma's cuid is client-side, not database default)
      const id = crypto.randomUUID()

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          id,
          name: trimmedName,
          normalized_name: normalized,
          created_by_id: createdById,
        })
        .select()
        .single()

      if (error) {
        // Handle unique constraint violation - another user might have created it concurrently
        if (error.code === '23505') {
          // Unique constraint violation, try fetching again
          const retryResult = await this.findByNormalizedName(name)
          if (retryResult.success && retryResult.data) {
            return success(retryResult.data)
          }
        }
        return failure(new StorageError(error.message, 'write'))
      }

      return success(this.mapToOperator(data))
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'write',
        ),
      )
    }
  }

  async search(term: string): Promise<ActionResult<Operator[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .ilike('name', `%${term}%`)
        .order('name', { ascending: true })
        .limit(20)

      if (error) {
        return failure(new StorageError(error.message, 'read'))
      }

      return success(data.map(this.mapToOperator))
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'read',
        ),
      )
    }
  }

  async create(
    item: Omit<Operator, 'id'>,
  ): Promise<ActionResult<Operator>> {
    try {
      // Generate ID client-side
      const id = crypto.randomUUID()

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          id,
          name: item.name,
          normalized_name: item.normalizedName,
          created_by_id: item.createdById,
        })
        .select()
        .single()

      if (error) {
        return failure(new StorageError(error.message, 'write'))
      }

      return success(this.mapToOperator(data))
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'write',
        ),
      )
    }
  }

  async update(
    id: string,
    item: Partial<Operator>,
  ): Promise<ActionResult<Operator>> {
    try {
      const updateData: Record<string, unknown> = {}

      if (item.name !== undefined) {
        updateData.name = item.name
        updateData.normalized_name = this.normalizeName(item.name)
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return failure(new StorageError(error.message, 'write'))
      }

      return success(this.mapToOperator(data))
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'write',
        ),
      )
    }
  }

  async delete(id: string): Promise<ActionResult<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        return failure(new StorageError(error.message, 'delete'))
      }

      return success(undefined)
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'delete',
        ),
      )
    }
  }

  async exists(id: string): Promise<ActionResult<boolean>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return success(false)
        }
        return failure(new StorageError(error.message, 'read'))
      }

      return success(!!data)
    } catch (error) {
      return failure(
        new StorageError(
          error instanceof Error ? error.message : 'Unknown error',
          'read',
        ),
      )
    }
  }

  /**
   * Map database row to Operator type
   */
  private mapToOperator(row: Record<string, unknown>): Operator {
    return {
      id: row.id as string,
      name: row.name as string,
      normalizedName: row.normalized_name as string,
      createdById: (row.created_by_id as string | null) || null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  }
}
