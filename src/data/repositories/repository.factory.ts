import type { IProductRepository } from './product.repository'
import type { IHolidayRepository } from './holiday.repository'
import {
  LocalStorageProductRepository,
  LocalStorageHolidayRepository,
} from './implementations/localStorage'

/**
 * Repository implementation type
 */
export type RepositoryType = 'localStorage' | 'supabase'

/**
 * Factory class to create repository instances
 */
export class RepositoryFactory {
  private static type: RepositoryType = 'localStorage'

  /**
   * Set the repository implementation type
   * This will be used in Fase 2 to switch to Supabase
   */
  static setType(type: RepositoryType): void {
    this.type = type
  }

  /**
   * Get current repository type
   */
  static getType(): RepositoryType {
    return this.type
  }

  /**
   * Create a Product Repository instance
   */
  static createProductRepository(): IProductRepository {
    switch (this.type) {
      case 'localStorage':
        return new LocalStorageProductRepository()
      case 'supabase':
        // TODO: Implement in Fase 2
        throw new Error('Supabase repository not implemented yet')
      default:
        throw new Error(`Unknown repository type: ${this.type}`)
    }
  }

  /**
   * Create a Holiday Repository instance
   */
  static createHolidayRepository(): IHolidayRepository {
    switch (this.type) {
      case 'localStorage':
        return new LocalStorageHolidayRepository()
      case 'supabase':
        // TODO: Implement in Fase 2
        throw new Error('Supabase repository not implemented yet')
      default:
        throw new Error(`Unknown repository type: ${this.type}`)
    }
  }
}

/**
 * Singleton instances for convenience
 * These can be used throughout the app without creating new instances
 */
export const productRepository = RepositoryFactory.createProductRepository()
export const holidayRepository = RepositoryFactory.createHolidayRepository()
