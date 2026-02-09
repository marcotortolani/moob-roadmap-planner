/**
 * React Query Hooks - Central Export Point
 *
 * All data fetching and mutation hooks for the application
 */

// Products
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  productKeys,
  type ProductFilters,
} from './use-products'

// Holidays
export {
  useHolidays,
  useCreateHoliday,
  useDeleteHoliday,
  holidayKeys,
} from './use-holidays'

// Operators
export {
  useOperators,
  useCreateOperator,
  useSearchOperators,
  operatorKeys,
} from './use-operators'

// Product Names
export {
  useProductNames,
  useCreateProductName,
  useSearchProductNames,
  productNameKeys,
} from './use-product-names'
