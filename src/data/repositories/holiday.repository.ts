import type { IRepository } from './base.repository'
import type { Holiday } from '@/lib/types'
import type { ActionResult } from '@/lib/errors'

/**
 * Holiday repository interface with specialized queries
 */
export interface IHolidayRepository extends IRepository<Holiday> {
  /**
   * Get holidays within date range
   * @param start Start date
   * @param end End date
   */
  getByDateRange(start: Date, end: Date): Promise<ActionResult<Holiday[]>>

  /**
   * Get holiday by specific date
   * @param date Date to check
   */
  getByDate(date: Date): Promise<ActionResult<Holiday | null>>

  /**
   * Get all holidays for a specific year
   * @param year Year to filter by
   */
  getByYear(year: number): Promise<ActionResult<Holiday[]>>

  /**
   * Check if a date is a holiday
   * @param date Date to check
   */
  isHoliday(date: Date): Promise<ActionResult<boolean>>

  /**
   * Bulk create holidays
   * @param holidays Array of holiday data
   */
  bulkCreate(
    holidays: Omit<Holiday, 'id'>[],
  ): Promise<ActionResult<Holiday[]>>
}
