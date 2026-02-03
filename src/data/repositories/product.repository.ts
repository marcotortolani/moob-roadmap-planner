import type { IRepository } from './base.repository'
import type { Product, Status } from '@/lib/types'
import type { ActionResult } from '@/lib/errors'

/**
 * Product repository interface with specialized queries
 */
export interface IProductRepository extends IRepository<Product> {
  /**
   * Get products by status
   * @param status Product status to filter by
   */
  getByStatus(status: Status): Promise<ActionResult<Product[]>>

  /**
   * Get products within date range
   * @param start Start date
   * @param end End date
   */
  getByDateRange(start: Date, end: Date): Promise<ActionResult<Product[]>>

  /**
   * Get products by operator
   * @param operator Operator name
   */
  getByOperator(operator: string): Promise<ActionResult<Product[]>>

  /**
   * Get products by country
   * @param country Country name
   */
  getByCountry(country: string): Promise<ActionResult<Product[]>>

  /**
   * Search products by term (name, operator, country, language, status)
   * @param term Search term
   */
  search(term: string): Promise<ActionResult<Product[]>>

  /**
   * Get products created by user
   * @param userId User identifier
   */
  getByCreator(userId: string): Promise<ActionResult<Product[]>>
}
