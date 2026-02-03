'use client'

import type {
  Product,
  ProductFormData,
  Holiday,
  HolidayFormData,
  User,
  Milestone,
  CustomUrl,
} from './types'
import { ProductSchema, HolidaySchema } from './types'
import { productRepository, holidayRepository } from '@/data/repositories'
import { isSuccess } from './errors'

/**
 * Legacy response type for backward compatibility
 */
interface LegacyResponse {
  success: boolean
  message: string
}

/**
 * Raw types from localStorage (before date parsing)
 */
interface RawMilestone {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  productId: string
}

interface RawProduct {
  id: string
  name: string
  operator: string
  country: string
  language: string
  startDate: string
  endDate: string
  productiveUrl?: string | null
  vercelDemoUrl?: string | null
  wpContentProdUrl?: string | null
  wpContentTestUrl?: string | null
  chatbotUrl?: string | null
  comments?: string | null
  cardColor: string
  status: string
  milestones?: RawMilestone[]
  customUrls?: CustomUrl[]
  createdBy: User
  createdAt?: string
  updatedBy?: User | null
  updatedAt?: string | null
}

interface RawHoliday {
  id: string
  name: string
  date: string
}

/**
 * Get all products from storage
 * This function maintains backward compatibility with existing code
 * Note: This is a synchronous wrapper around async repository
 */
export const getProductsFromStorage = (): Product[] => {
  if (typeof window === 'undefined') return []

  // Direct localStorage access for synchronous behavior
  // This maintains backward compatibility while using repository internally
  const data = localStorage.getItem('products')
  if (!data) {
    // Initialize with empty and let repository handle initialization
    productRepository.getAll()
    return []
  }

  try {
    const parsedData: unknown = JSON.parse(data)
    if (Array.isArray(parsedData)) {
      return parsedData.map((item: RawProduct): Product => ({
        ...item,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        milestones: item.milestones?.map((m: RawMilestone): Milestone => ({
          ...m,
          startDate: new Date(m.startDate),
          endDate: new Date(m.endDate),
        })) || [],
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
      }))
    }
    return []
  } catch (error) {
    console.error('Failed to parse products from storage', error)
    return []
  }
}

/**
 * Create or update a product
 * @param formData Product form data
 * @param user Current user
 * @param productId Optional product ID for updates
 */
export async function createOrUpdateProduct(
  formData: ProductFormData,
  user: User,
  productId?: string,
): Promise<LegacyResponse> {
  // Validate form data
  const validatedFields = ProductSchema.safeParse(formData)

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors)
    return {
      success: false,
      message: 'Error de validación. Por favor, revise los campos.',
    }
  }

  const { milestones, customUrls, ...productData } = validatedFields.data

  try {
    if (productId) {
      // Update existing product
      const updatedMilestones: Milestone[] =
        milestones?.map((m) => ({
          id: m.id || crypto.randomUUID(),
          name: m.name,
          startDate: m.startDate,
          endDate: m.endDate,
          status: m.status,
          productId: productId,
        })) || []

      const updatedCustomUrls: CustomUrl[] =
        customUrls?.map((u) => ({
          id: u.id || crypto.randomUUID(),
          label: u.label,
          url: u.url,
        })) || []

      const updateData: Partial<Product> = {
        ...productData,
        productiveUrl: productData.productiveUrl || null,
        vercelDemoUrl: productData.vercelDemoUrl || null,
        wpContentProdUrl: productData.wpContentProdUrl || null,
        wpContentTestUrl: productData.wpContentTestUrl || null,
        chatbotUrl: productData.chatbotUrl || null,
        comments: productData.comments || null,
        milestones: updatedMilestones,
        customUrls: updatedCustomUrls,
        updatedBy: user,
      }

      const result = await productRepository.update(productId, updateData)

      if (isSuccess(result)) {
        return {
          success: true,
          message: 'Producto actualizado con éxito.',
        }
      } else {
        return {
          success: false,
          message: result.message,
        }
      }
    } else {
      // Create new product
      const newProductId = crypto.randomUUID()

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

      const newProduct = {
        ...productData,
        productiveUrl: productData.productiveUrl || null,
        vercelDemoUrl: productData.vercelDemoUrl || null,
        wpContentProdUrl: productData.wpContentProdUrl || null,
        wpContentTestUrl: productData.wpContentTestUrl || null,
        chatbotUrl: productData.chatbotUrl || null,
        comments: productData.comments || null,
        milestones: newMilestones,
        customUrls: newCustomUrls,
        createdBy: user,
        createdAt: new Date(),
        updatedBy: null,
        updatedAt: null,
      } as Omit<Product, 'id'>

      const result = await productRepository.create(newProduct)

      if (isSuccess(result)) {
        return {
          success: true,
          message: 'Producto creado con éxito.',
        }
      } else {
        return {
          success: false,
          message: result.message,
        }
      }
    }
  } catch (error) {
    console.error('Error in createOrUpdateProduct:', error)
    return {
      success: false,
      message: 'Ocurrió un error en el servidor.',
    }
  }
}

/**
 * Delete a product
 * @param productId Product ID to delete
 */
export async function deleteProduct(
  productId: string,
): Promise<LegacyResponse> {
  if (!productId) {
    return { success: false, message: 'ID de producto no proporcionado.' }
  }

  try {
    const result = await productRepository.delete(productId)

    if (isSuccess(result)) {
      return { success: true, message: 'Producto eliminado con éxito.' }
    } else {
      return { success: false, message: result.message }
    }
  } catch (error) {
    console.error('Error in deleteProduct:', error)
    return { success: false, message: 'Error al eliminar el producto.' }
  }
}

/**
 * Get all holidays from storage
 * This function maintains backward compatibility with existing code
 * Note: This is a synchronous wrapper for backward compatibility
 */
export const getHolidaysFromStorage = (): Holiday[] => {
  if (typeof window === 'undefined') return []

  // Direct localStorage access for synchronous behavior
  const data = localStorage.getItem('holidays')
  if (!data) return []

  try {
    const parsedData: unknown = JSON.parse(data)
    if (Array.isArray(parsedData)) {
      return parsedData.map((item: RawHoliday): Holiday => ({
        ...item,
        date: new Date(item.date),
      }))
    }
    return []
  } catch (error) {
    console.error('Failed to parse holidays from storage', error)
    return []
  }
}

/**
 * Save holidays to storage
 * This function maintains backward compatibility
 * @deprecated Use holidayRepository directly instead
 */
export const saveHolidaysToStorage = (holidays: Holiday[]): void => {
  if (typeof window === 'undefined') return

  // Trigger storage event for backward compatibility
  localStorage.setItem('holidays', JSON.stringify(holidays))
  window.dispatchEvent(new Event('storage'))
}

/**
 * Create or update a holiday
 * @param formData Holiday form data
 * @param holidayId Optional holiday ID for updates
 */
export async function createOrUpdateHoliday(
  formData: HolidayFormData,
  holidayId?: string,
): Promise<LegacyResponse> {
  // Validate form data
  const validatedFields = HolidaySchema.safeParse(formData)

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors)
    return {
      success: false,
      message: 'Error de validación. Por favor, revise los campos.',
    }
  }

  try {
    if (holidayId) {
      // Update existing holiday
      const result = await holidayRepository.update(
        holidayId,
        validatedFields.data,
      )

      if (isSuccess(result)) {
        return {
          success: true,
          message: 'Feriado actualizado con éxito.',
        }
      } else {
        return {
          success: false,
          message: result.message,
        }
      }
    } else {
      // Create new holiday
      const result = await holidayRepository.create(validatedFields.data)

      if (isSuccess(result)) {
        return {
          success: true,
          message: 'Feriado creado con éxito.',
        }
      } else {
        return {
          success: false,
          message: result.message,
        }
      }
    }
  } catch (error) {
    console.error('Error in createOrUpdateHoliday:', error)
    return {
      success: false,
      message: 'Ocurrió un error en el servidor.',
    }
  }
}

/**
 * Delete a holiday
 * @param holidayId Holiday ID to delete
 */
export async function deleteHoliday(
  holidayId: string,
): Promise<LegacyResponse> {
  if (!holidayId) {
    return { success: false, message: 'ID de feriado no proporcionado.' }
  }

  try {
    const result = await holidayRepository.delete(holidayId)

    if (isSuccess(result)) {
      return { success: true, message: 'Feriado eliminado con éxito.' }
    } else {
      return { success: false, message: result.message }
    }
  } catch (error) {
    console.error('Error in deleteHoliday:', error)
    return { success: false, message: 'Error al eliminar el feriado.' }
  }
}
