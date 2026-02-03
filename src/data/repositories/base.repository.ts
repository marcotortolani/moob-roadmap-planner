import type { ActionResult } from '@/lib/errors'

/**
 * Base repository interface with common CRUD operations
 * @template T The entity type this repository manages
 */
export interface IRepository<T> {
  /**
   * Get all entities
   */
  getAll(): Promise<ActionResult<T[]>>

  /**
   * Get entity by ID
   * @param id Entity identifier
   */
  getById(id: string): Promise<ActionResult<T | null>>

  /**
   * Create new entity
   * @param item Entity data without ID
   */
  create(item: Omit<T, 'id'>): Promise<ActionResult<T>>

  /**
   * Update existing entity
   * @param id Entity identifier
   * @param item Partial entity data to update
   */
  update(id: string, item: Partial<T>): Promise<ActionResult<T>>

  /**
   * Delete entity by ID
   * @param id Entity identifier
   */
  delete(id: string): Promise<ActionResult<void>>

  /**
   * Check if entity exists
   * @param id Entity identifier
   */
  exists(id: string): Promise<ActionResult<boolean>>
}
