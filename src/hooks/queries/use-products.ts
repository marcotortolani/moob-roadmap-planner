'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productRepository } from '@/data/repositories'
import type { Product, ProductFormData } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

/**
 * Query Keys for Products
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

export interface ProductFilters {
  status?: string
  operator?: string
  country?: string
  language?: string
  year?: number
  quarter?: number
}

/**
 * Hook to fetch all products
 * Uses repository pattern - currently configured for localStorage
 */
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      console.log('📦 [useProducts] Fetching from repository...')
      const result = await productRepository.getAll()

      if (result.success && result.data) {
        console.log('📦 [useProducts] Loaded', result.data.length, 'products')
        return result.data
      }

      console.error('📦 [useProducts] Error:', result.error)
      return []
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const result = await productRepository.getById(id)
      if (result.success && result.data) {
        return result.data
      }
      throw new Error(result.error?.message || 'Product not found')
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const result = await productRepository.create(data)
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create product')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast({
        title: 'Producto creado',
        description: 'El producto se ha creado exitosamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const result = await productRepository.update(id, data)
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to update product')
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
      toast({
        title: 'Producto actualizado',
        description: 'Los cambios se han guardado exitosamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await productRepository.delete(id)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast({
        title: 'Producto eliminado',
        description: 'El producto se ha eliminado exitosamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
