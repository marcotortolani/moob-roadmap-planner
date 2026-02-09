import type { IRepository } from './base.repository'
import type { ProductName } from '@/lib/types'
import type { ActionResult } from '@/lib/errors'

export interface IProductNameRepository extends IRepository<ProductName> {
  /**
   * Find a product name by its normalized name
   */
  findByNormalizedName(name: string): Promise<ActionResult<ProductName | null>>

  /**
   * Get an existing product name or create a new one
   * Uses normalized name for matching (case-insensitive, trimmed)
   */
  getOrCreate(
    name: string,
    createdById: string,
    description?: string,
  ): Promise<ActionResult<ProductName>>

  /**
   * Search product names by name (case-insensitive)
   */
  search(term: string): Promise<ActionResult<ProductName[]>>
}
