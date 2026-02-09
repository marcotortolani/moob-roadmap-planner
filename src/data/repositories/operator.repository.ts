import type { IRepository } from './base.repository'
import type { Operator } from '@/lib/types'
import type { ActionResult } from '@/lib/errors'

export interface IOperatorRepository extends IRepository<Operator> {
  /**
   * Find an operator by its normalized name
   */
  findByNormalizedName(name: string): Promise<ActionResult<Operator | null>>

  /**
   * Get an existing operator or create a new one
   * Uses normalized name for matching (case-insensitive, trimmed)
   */
  getOrCreate(name: string, createdById: string): Promise<ActionResult<Operator>>

  /**
   * Search operators by name (case-insensitive)
   */
  search(term: string): Promise<ActionResult<Operator[]>>
}
