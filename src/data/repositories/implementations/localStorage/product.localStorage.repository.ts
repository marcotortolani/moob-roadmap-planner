import type { IProductRepository } from '../../product.repository'
import type { Product, Status, Milestone, CustomUrl } from '@/lib/types'
import type { ActionResult } from '@/lib/errors'
import {
  success,
  failure,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@/lib/errors'
import { ProductSchema } from '@/lib/types'
import { INITIAL_PRODUCTS } from '@/lib/initial-products'

/**
 * LocalStorage implementation of Product Repository
 */
export class LocalStorageProductRepository implements IProductRepository {
  private readonly storageKey = 'products'

  /**
   * Parse date strings from storage to Date objects
   */
  private parseDateFromStorage(dateString: string | null | undefined): Date | undefined {
    if (!dateString) return undefined
    return new Date(dateString)
  }

  /**
   * Get products from localStorage with date parsing
   */
  private getFromStorage(): Product[] {
    if (typeof window === 'undefined') return []

    const data = localStorage.getItem(this.storageKey)
    if (!data) return []

    try {
      const parsedData = JSON.parse(data)

      if (Array.isArray(parsedData)) {
        return parsedData.map((item: any) => {
          const newItem = { ...item }
          if (item.startDate)
            newItem.startDate = this.parseDateFromStorage(item.startDate)!
          if (item.endDate)
            newItem.endDate = this.parseDateFromStorage(item.endDate)!
          if (item.milestones) {
            newItem.milestones = item.milestones.map((m: any) => ({
              ...m,
              startDate: this.parseDateFromStorage(m.startDate)!,
              endDate: this.parseDateFromStorage(m.endDate)!,
            }))
          }
          if (item.createdAt)
            newItem.createdAt = this.parseDateFromStorage(item.createdAt)
          if (item.updatedAt)
            newItem.updatedAt = this.parseDateFromStorage(item.updatedAt)
          return newItem as Product
        })
      }

      return []
    } catch (e) {
      console.error('Failed to parse products from storage', e)
      return []
    }
  }

  /**
   * Save products to localStorage and dispatch storage event
   */
  private saveToStorage(products: Product[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.storageKey, JSON.stringify(products))
    window.dispatchEvent(new Event('storage'))
  }

  /**
   * Initialize storage with initial products if empty
   */
  private initializeIfEmpty(): void {
    const products = this.getFromStorage()
    if (products.length === 0) {
      console.log('Initializing products with initial data')
      this.saveToStorage(INITIAL_PRODUCTS as any)
    }
  }

  async getAll(): Promise<ActionResult<Product[]>> {
    try {
      this.initializeIfEmpty()
      const products = this.getFromStorage()
      return success(products)
    } catch (error) {
      return failure(
        new StorageError('Failed to get products', 'read'),
        'Error al obtener productos',
      )
    }
  }

  async getById(id: string): Promise<ActionResult<Product | null>> {
    try {
      const products = this.getFromStorage()
      const product = products.find((p) => p.id === id)
      return success(product || null)
    } catch (error) {
      return failure(
        new StorageError('Failed to get product by ID', 'read'),
        'Error al obtener producto',
      )
    }
  }

  async create(item: Omit<Product, 'id'>): Promise<ActionResult<Product>> {
    try {
      // Validate data
      const validatedFields = ProductSchema.safeParse(item)
      if (!validatedFields.success) {
        return failure(
          new ValidationError('product', 'Invalid product data'),
          'Datos de producto inválidos',
        )
      }

      const products = this.getFromStorage()
      const newProductId = crypto.randomUUID()
      const now = new Date()

      const { milestones, customUrls, ...productData } = validatedFields.data

      const newMilestones: Milestone[] =
        milestones?.map((m) => ({
          id: crypto.randomUUID(),
          name: m.name,
          startDate: m.startDate,
          endDate: m.endDate,
          status: m.status,
          productId: newProductId,
        })) || []

      const newCustomUrls: CustomUrl[] =
        customUrls?.map((u) => ({
          id: crypto.randomUUID(),
          label: u.label,
          url: u.url,
        })) || []

      const newProduct: Product = {
        id: newProductId,
        ...productData,
        productiveUrl: productData.productiveUrl || null,
        vercelDemoUrl: productData.vercelDemoUrl || null,
        wpContentProdUrl: productData.wpContentProdUrl || null,
        wpContentTestUrl: productData.wpContentTestUrl || null,
        chatbotUrl: productData.chatbotUrl || null,
        comments: productData.comments || null,
        milestones: newMilestones,
        customUrls: newCustomUrls,
        createdBy: (item as any).createdBy,
        createdAt: now,
        updatedBy: null,
        updatedAt: null,
      }

      products.push(newProduct)
      this.saveToStorage(products)

      return success(newProduct)
    } catch (error) {
      return failure(
        new StorageError('Failed to create product', 'write'),
        'Error al crear producto',
      )
    }
  }

  async update(
    id: string,
    item: Partial<Product>,
  ): Promise<ActionResult<Product>> {
    try {
      let products = this.getFromStorage()
      const index = products.findIndex((p) => p.id === id)

      if (index === -1) {
        return failure(
          new NotFoundError('Product', id),
          'Producto no encontrado',
        )
      }

      const now = new Date()
      const { milestones, customUrls, ...productData } = item

      const updatedMilestones: Milestone[] | undefined = milestones?.map(
        (m) => ({
          id: m.id || crypto.randomUUID(),
          name: m.name,
          startDate: m.startDate,
          endDate: m.endDate,
          status: m.status,
          productId: id,
        }),
      )

      const updatedCustomUrls: CustomUrl[] | undefined = customUrls?.map(
        (u) => ({
          id: u.id || crypto.randomUUID(),
          label: u.label,
          url: u.url,
        }),
      )

      products[index] = {
        ...products[index],
        ...productData,
        ...(updatedMilestones && { milestones: updatedMilestones }),
        ...(updatedCustomUrls && { customUrls: updatedCustomUrls }),
        updatedBy: (item as any).updatedBy,
        updatedAt: now,
      }

      this.saveToStorage(products)
      return success(products[index])
    } catch (error) {
      return failure(
        new StorageError('Failed to update product', 'write'),
        'Error al actualizar producto',
      )
    }
  }

  async delete(id: string): Promise<ActionResult<void>> {
    try {
      let products = this.getFromStorage()
      const filtered = products.filter((p) => p.id !== id)

      if (filtered.length === products.length) {
        return failure(
          new NotFoundError('Product', id),
          'Producto no encontrado',
        )
      }

      this.saveToStorage(filtered)
      return success(undefined)
    } catch (error) {
      return failure(
        new StorageError('Failed to delete product', 'delete'),
        'Error al eliminar producto',
      )
    }
  }

  async exists(id: string): Promise<ActionResult<boolean>> {
    try {
      const products = this.getFromStorage()
      const exists = products.some((p) => p.id === id)
      return success(exists)
    } catch (error) {
      return failure(
        new StorageError('Failed to check product existence', 'read'),
        'Error al verificar producto',
      )
    }
  }

  async getByStatus(status: Status): Promise<ActionResult<Product[]>> {
    try {
      const products = this.getFromStorage()
      const filtered = products.filter((p) => p.status === status)
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to get products by status', 'read'),
        'Error al obtener productos por estado',
      )
    }
  }

  async getByDateRange(
    start: Date,
    end: Date,
  ): Promise<ActionResult<Product[]>> {
    try {
      const products = this.getFromStorage()
      const filtered = products.filter(
        (p) => p.startDate >= start && p.endDate <= end,
      )
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to get products by date range', 'read'),
        'Error al obtener productos por rango de fechas',
      )
    }
  }

  async getByOperator(operator: string): Promise<ActionResult<Product[]>> {
    try {
      const products = this.getFromStorage()
      const filtered = products.filter((p) => p.operator === operator)
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to get products by operator', 'read'),
        'Error al obtener productos por operador',
      )
    }
  }

  async getByCountry(country: string): Promise<ActionResult<Product[]>> {
    try {
      const products = this.getFromStorage()
      const filtered = products.filter((p) => p.country === country)
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to get products by country', 'read'),
        'Error al obtener productos por país',
      )
    }
  }

  async search(term: string): Promise<ActionResult<Product[]>> {
    try {
      const products = this.getFromStorage()
      const lowerTerm = term.toLowerCase()
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerTerm) ||
          p.operator.toLowerCase().includes(lowerTerm) ||
          p.country.toLowerCase().includes(lowerTerm) ||
          p.language.toLowerCase().includes(lowerTerm) ||
          p.status.toLowerCase().includes(lowerTerm),
      )
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to search products', 'read'),
        'Error al buscar productos',
      )
    }
  }

  async getByCreator(userId: string): Promise<ActionResult<Product[]>> {
    try {
      const products = this.getFromStorage()
      const filtered = products.filter((p) => p.createdBy.id === userId)
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to get products by creator', 'read'),
        'Error al obtener productos por creador',
      )
    }
  }
}
