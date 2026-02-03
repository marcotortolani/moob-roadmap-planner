// Interfaces
export type { IRepository } from './base.repository'
export type { IProductRepository } from './product.repository'
export type { IHolidayRepository } from './holiday.repository'

// Factory and instances
export {
  RepositoryFactory,
  productRepository,
  holidayRepository,
  type RepositoryType,
} from './repository.factory'

// LocalStorage implementations
export {
  LocalStorageProductRepository,
  LocalStorageHolidayRepository,
} from './implementations/localStorage'
