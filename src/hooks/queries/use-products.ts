'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { parseISO, startOfDay } from 'date-fns'
import type { Product } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'

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
 * Fetch all products with optional filters
 *
 * NOTE: This is optimized for LIST view - doesn't fetch creator/updater info
 * to reduce JOINs and improve performance. For full product details with user info,
 * use fetchProduct(id) or useProduct(id) hook.
 */
async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      milestones(*),
      customUrls:custom_urls(*)
    `)
    .order('start_date', { ascending: false })

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.operator) {
    query = query.eq('operator', filters.operator)
  }
  if (filters?.country) {
    query = query.eq('country', filters.country)
  }
  if (filters?.language) {
    query = query.eq('language', filters.language)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    throw new Error(error.message)
  }

  // Transform to match Product type
  return (data || []).map((product) => ({
    ...product,
    // Parse dates and normalize to start of day to avoid timezone issues
    startDate: startOfDay(parseISO(product.start_date)),
    endDate: startOfDay(parseISO(product.end_date)),
    cardColor: product.card_color || generateRandomColor(),
    milestones: product.milestones?.map((m: any) => ({
      ...m,
      startDate: startOfDay(parseISO(m.start_date)),
      endDate: startOfDay(parseISO(m.end_date)),
    })) || [],
    customUrls: product.customUrls || [],
  })) as Product[]
}

/**
 * Hook to fetch all products with optional filters.
 *
 * Waits for auth to initialize before firing to prevent a race condition
 * where the Supabase browser client hasn't restored its session yet,
 * causing RLS to return 0 rows and React Query to cache an empty result.
 */
export function useProducts(filters?: ProductFilters) {
  const { loading: authLoading } = useAuth()

  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !authLoading,
  })
}

/**
 * Fetch a single product by ID
 */
async function fetchProduct(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      milestones(*),
      customUrls:custom_urls(*),
      createdBy:created_by_id(id, email, first_name, last_name, avatar_url),
      updatedBy:updated_by_id(id, email, first_name, last_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Product not found')
  }

  // Transform to match Product type
  return {
    ...data,
    // Parse dates and normalize to start of day to avoid timezone issues
    startDate: startOfDay(parseISO(data.start_date)),
    endDate: startOfDay(parseISO(data.end_date)),
    cardColor: data.card_color || generateRandomColor(),
    milestones: data.milestones?.map((m: any) => ({
      ...m,
      startDate: startOfDay(parseISO(m.start_date)),
      endDate: startOfDay(parseISO(m.end_date)),
    })) || [],
    customUrls: data.customUrls || [],
  } as Product
}

/**
 * Hook to fetch a single product by ID.
 * Uses list cache as initialData to avoid redundant fetch when product
 * is already available from the list query.
 */
export function useProduct(id: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    initialData: () => {
      // Check all list query caches for this product
      const listQueries = queryClient.getQueriesData<Product[]>({
        queryKey: productKeys.lists(),
      })
      for (const [, data] of listQueries) {
        const product = data?.find((p) => p.id === id)
        if (product) return product
      }
      return undefined
    },
    // Mark initialData as potentially stale so detail query still fetches
    // fresh data with user relations in background
    initialDataUpdatedAt: 0,
  })
}

/**
 * Generate a random vibrant color for product cards
 */
function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B195', // Peach
    '#C06C84', // Mauve
    '#6C5B7B', // Plum
    '#355C7D', // Navy
    '#99B898', // Sage
    '#E84A5F', // Pink
    '#2A363B', // Dark Gray
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Create a new product
 */
async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  // Generate ID (Prisma uses cuid, but UUID is compatible)
  const newId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Generate random color if not provided
  const cardColor = product.cardColor || generateRandomColor()

  // 1. Insert the product
  const { data, error } = await supabase
    .from('products')
    .insert({
      id: newId,
      name: product.name,
      operator: product.operator,
      country: product.country,
      language: product.language,
      start_date: product.startDate.toISOString(),
      end_date: product.endDate.toISOString(),
      productive_url: product.productiveUrl,
      vercel_demo_url: product.vercelDemoUrl,
      wp_content_prod_url: product.wpContentProdUrl,
      wp_content_test_url: product.wpContentTestUrl,
      chatbot_url: product.chatbotUrl,
      comments: product.comments,
      card_color: cardColor,
      status: product.status,
      created_by_id: product.createdById,
      updated_by_id: product.updatedById,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    throw new Error(error.message)
  }

  // 2. Insert milestones if any
  if (product.milestones && product.milestones.length > 0) {
    const milestonesToInsert = product.milestones.map((m) => ({
      id: crypto.randomUUID(),
      name: m.name,
      start_date: m.startDate.toISOString(),
      end_date: m.endDate.toISOString(),
      status: m.status,
      product_id: newId,
      created_at: now,
      updated_at: now,
    }))

    const { error: milestonesError } = await supabase
      .from('milestones')
      .insert(milestonesToInsert)

    if (milestonesError) {
      console.error('Error creating milestones:', milestonesError)
      // Don't throw - product was created successfully
    }
  }

  // 3. Insert custom URLs if any
  if (product.customUrls && product.customUrls.length > 0) {
    const urlsToInsert = product.customUrls.map((url) => ({
      id: crypto.randomUUID(),
      label: url.label,
      url: url.url,
      product_id: newId,
    }))

    const { error: urlsError } = await supabase
      .from('custom_urls')
      .insert(urlsToInsert)

    if (urlsError) {
      console.error('Error creating custom URLs:', urlsError)
      // Don't throw - product was created successfully
    }
  }

  return fetchProduct(data.id)
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: async (newProduct) => {
      // Invalidate triggers automatic refetch of active queries
      await queryClient.invalidateQueries({ queryKey: productKeys.all })

      toast({
        title: 'Éxito',
        description: 'Producto creado exitosamente',
      })
    },
    onError: (error: Error) => {
      console.error('Error creating product:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el producto',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing product
 */
async function updateProduct({ id, ...updates }: Partial<Product> & { id: string }): Promise<Product> {
  const updateData: any = {}

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.operator !== undefined) updateData.operator = updates.operator
  if (updates.country !== undefined) updateData.country = updates.country
  if (updates.language !== undefined) updateData.language = updates.language
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString()
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString()
  if (updates.productiveUrl !== undefined) updateData.productive_url = updates.productiveUrl
  if (updates.vercelDemoUrl !== undefined) updateData.vercel_demo_url = updates.vercelDemoUrl
  if (updates.wpContentProdUrl !== undefined) updateData.wp_content_prod_url = updates.wpContentProdUrl
  if (updates.wpContentTestUrl !== undefined) updateData.wp_content_test_url = updates.wpContentTestUrl
  if (updates.chatbotUrl !== undefined) updateData.chatbot_url = updates.chatbotUrl
  if (updates.comments !== undefined) updateData.comments = updates.comments
  if (updates.cardColor !== undefined) updateData.card_color = updates.cardColor
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.updatedById !== undefined) updateData.updated_by_id = updates.updatedById

  // Always update the updated_at timestamp
  const now = new Date().toISOString()
  updateData.updated_at = now

  // 1. Update the product
  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
    throw new Error(error.message)
  }

  // 2. Update milestones if provided
  if (updates.milestones !== undefined) {
    // Delete existing milestones
    await supabase.from('milestones').delete().eq('product_id', id)

    // Insert new milestones
    if (updates.milestones.length > 0) {
      const milestonesToInsert = updates.milestones.map((m) => ({
        id: m.id || crypto.randomUUID(),
        name: m.name,
        start_date: m.startDate.toISOString(),
        end_date: m.endDate.toISOString(),
        status: m.status,
        product_id: id,
        created_at: now,
        updated_at: now,
      }))

      const { error: milestonesError } = await supabase
        .from('milestones')
        .insert(milestonesToInsert)

      if (milestonesError) {
        console.error('Error updating milestones:', milestonesError)
      }
    }
  }

  // 3. Update custom URLs if provided
  if (updates.customUrls !== undefined) {
    // Delete existing custom URLs
    await supabase.from('custom_urls').delete().eq('product_id', id)

    // Insert new custom URLs
    if (updates.customUrls.length > 0) {
      const urlsToInsert = updates.customUrls.map((url) => ({
        id: url.id || crypto.randomUUID(),
        label: url.label,
        url: url.url,
        product_id: id,
      }))

      const { error: urlsError } = await supabase
        .from('custom_urls')
        .insert(urlsToInsert)

      if (urlsError) {
        console.error('Error updating custom URLs:', urlsError)
      }
    }
  }

  return fetchProduct(id)
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: async (data) => {
      // Update specific product in cache immediately
      queryClient.setQueryData(productKeys.detail(data.id), data)
      // Invalidate triggers automatic refetch of active queries
      await queryClient.invalidateQueries({ queryKey: productKeys.all })

      toast({
        title: 'Éxito',
        description: 'Producto actualizado exitosamente',
      })
    },
    onError: (error: Error) => {
      console.error('Error updating product:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el producto',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a product
 */
async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    throw new Error(error.message)
  }
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast({
        title: 'Éxito',
        description: 'Producto eliminado exitosamente',
      })
    },
    onError: (error: Error) => {
      console.error('Error deleting product:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el producto',
        variant: 'destructive',
      })
    },
  })
}
