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
      id,
      name,
      operator,
      country,
      language,
      status,
      start_date,
      end_date,
      card_color,
      productive_url,
      vercel_demo_url,
      wp_content_prod_url,
      wp_content_test_url,
      chatbot_url,
      created_at,
      updated_at,
      created_by_id,
      updated_by_id,
      milestones(id, name, start_date, end_date, status, product_id),
      customUrls:custom_urls(id, label, url, product_id)
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

  // Transform to match Product type (camelCase)
  return (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    operator: product.operator,
    country: product.country,
    language: product.language,
    status: product.status,
    startDate: startOfDay(parseISO(product.start_date)),
    endDate: startOfDay(parseISO(product.end_date)),
    cardColor: product.card_color || generateRandomColor(),
    // Map URL fields from snake_case to camelCase
    productiveUrl: product.productive_url || null,
    vercelDemoUrl: product.vercel_demo_url || null,
    wpContentProdUrl: product.wp_content_prod_url || null,
    wpContentTestUrl: product.wp_content_test_url || null,
    chatbotUrl: product.chatbot_url || null,
    comments: product.comments || null,
    milestones: product.milestones?.map((m: { id: string; name: string; start_date: string; end_date: string; status: string; product_id: string }) => ({
      ...m,
      startDate: startOfDay(parseISO(m.start_date)),
      endDate: startOfDay(parseISO(m.end_date)),
    })) || [],
    customUrls: product.customUrls || [],
    createdById: product.created_by_id,
    updatedById: product.updated_by_id,
    createdAt: new Date(product.created_at),
    updatedAt: new Date(product.updated_at),
  })) as Product[]
}

/**
 * Hook to fetch all products with optional filters.
 *
 * Waits for auth to initialize before firing to prevent a race condition
 * where the Supabase browser client hasn't restored its session yet,
 * causing RLS to return 0 rows and React Query to cache an empty result.
 *
 * ✅ SPRINT 6.2: Optimized staleTime for product data (2 minutes)
 * Products change frequently, so keep staleTime relatively short.
 * Optimistic updates handle real-time mutations anyway.
 */
export function useProducts(filters?: ProductFilters) {
  const { loading: authLoading } = useAuth()

  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (Sprint 6.2 - was 30 seconds)
    gcTime: 10 * 60 * 1000, // 10 minutes cache
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

  // Transform to match Product type (camelCase)
  return {
    id: data.id,
    name: data.name,
    operator: data.operator,
    country: data.country,
    language: data.language,
    status: data.status,
    startDate: startOfDay(parseISO(data.start_date)),
    endDate: startOfDay(parseISO(data.end_date)),
    cardColor: data.card_color || generateRandomColor(),
    // Map URL fields from snake_case to camelCase
    productiveUrl: data.productive_url || null,
    vercelDemoUrl: data.vercel_demo_url || null,
    wpContentProdUrl: data.wp_content_prod_url || null,
    wpContentTestUrl: data.wp_content_test_url || null,
    chatbotUrl: data.chatbot_url || null,
    comments: data.comments || null,
    milestones: data.milestones?.map((m: { id: string; name: string; start_date: string; end_date: string; status: string; product_id: string }) => ({
      ...m,
      startDate: startOfDay(parseISO(m.start_date)),
      endDate: startOfDay(parseISO(m.end_date)),
    })) || [],
    customUrls: data.customUrls || [],
    createdById: data.created_by_id,
    updatedById: data.updated_by_id,
    createdBy: data.createdBy ? {
      id: data.createdBy.id,
      name: `${data.createdBy.first_name || ''} ${data.createdBy.last_name || ''}`.trim(),
      email: data.createdBy.email,
      avatarUrl: data.createdBy.avatar_url,
    } : undefined,
    updatedBy: data.updatedBy ? {
      id: data.updatedBy.id,
      name: `${data.updatedBy.first_name || ''} ${data.updatedBy.last_name || ''}`.trim(),
      email: data.updatedBy.email,
      avatarUrl: data.updatedBy.avatar_url,
    } : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
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
      // Normalize URL fields: empty strings → null
      productive_url: product.productiveUrl || null,
      vercel_demo_url: product.vercelDemoUrl || null,
      wp_content_prod_url: product.wpContentProdUrl || null,
      wp_content_test_url: product.wpContentTestUrl || null,
      chatbot_url: product.chatbotUrl || null,
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
 * Hook to create a new product with optimistic updates (Sprint 5.1)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createProduct,
    onMutate: async (newProduct) => {
      // ✅ OPTIMISTIC: Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: productKeys.all })

      // Snapshot the previous value for rollback
      const previousProducts = queryClient.getQueryData(productKeys.all)

      // Optimistically create temporary product with temp ID
      const tempProduct: Product = {
        ...newProduct,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product

      // Optimistically update the cache
      queryClient.setQueriesData<Product[]>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return [tempProduct]
          return [tempProduct, ...old]
        }
      )

      return { previousProducts }
    },
    onSuccess: async (newProduct) => {
      // Invalidate triggers automatic refetch to sync with server
      await queryClient.invalidateQueries({ queryKey: productKeys.all })

      toast({
        title: '✓ Producto creado',
        description: 'El producto se ha creado exitosamente',
        variant: 'success',
      })
    },
    onError: (error: Error, newProduct, context) => {
      // ❌ Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.all, context.previousProducts)
      }

      console.error('Error creating product:', error)
      toast({
        title: '✕ Error al crear',
        description: error.message || 'No se pudo crear el producto. Intenta nuevamente.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

/**
 * Update an existing product
 */
async function updateProduct({ id, ...updates }: Partial<Product> & { id: string }): Promise<Product> {
  const updateData: Record<string, unknown> = {}

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.operator !== undefined) updateData.operator = updates.operator
  if (updates.country !== undefined) updateData.country = updates.country
  if (updates.language !== undefined) updateData.language = updates.language
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString()
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString()
  // Normalize URL fields: empty strings → null
  if (updates.productiveUrl !== undefined) updateData.productive_url = updates.productiveUrl || null
  if (updates.vercelDemoUrl !== undefined) updateData.vercel_demo_url = updates.vercelDemoUrl || null
  if (updates.wpContentProdUrl !== undefined) updateData.wp_content_prod_url = updates.wpContentProdUrl || null
  if (updates.wpContentTestUrl !== undefined) updateData.wp_content_test_url = updates.wpContentTestUrl || null
  if (updates.chatbotUrl !== undefined) updateData.chatbot_url = updates.chatbotUrl || null
  if (updates.comments !== undefined) updateData.comments = updates.comments
  if (updates.cardColor !== undefined) updateData.card_color = updates.cardColor
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.updatedById !== undefined) updateData.updated_by_id = updates.updatedById

  // Always update the updated_at timestamp
  const now = new Date().toISOString()
  updateData.updated_at = now

  // Skip session check - RLS will handle permissions
  // (getSession() was causing intermittent hangs)

  const updatePromise = supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  // Add 10 second timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('UPDATE timeout after 10 seconds')), 10000)
  )

  let updatedData, error
  try {
    const result = await Promise.race([updatePromise, timeoutPromise]) as any
    updatedData = result.data
    error = result.error
  } catch (timeoutError) {
    console.error('⏱️ Timeout updating product:', timeoutError)
    throw timeoutError
  }

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
 * Hook to update an existing product with optimistic updates (Sprint 5.1)
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: updateProduct,
    onMutate: async (updatedProduct) => {
      // ✅ OPTIMISTIC: Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.all })

      // Snapshot the previous value for rollback AND status tracking
      const previousProducts = queryClient.getQueryData(productKeys.all)
      const previousProduct = queryClient.getQueryData<Product>(productKeys.detail(updatedProduct.id))

      // Save the previous status BEFORE optimistic update (for email detection)
      // Try detail cache first, then list cache
      let previousStatus = previousProduct?.status

      if (!previousStatus) {
        // If not in detail cache, try to find in lists cache
        const listQueries = queryClient.getQueriesData<Product[]>({
          queryKey: productKeys.lists(),
        })
        for (const [, data] of listQueries) {
          const product = data?.find((p) => p.id === updatedProduct.id)
          if (product) {
            previousStatus = product.status
            break
          }
        }
      }

      // Optimistically update the cache
      queryClient.setQueriesData<Product[]>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return old
          return old.map((p) =>
            p.id === updatedProduct.id
              ? { ...p, ...updatedProduct, updatedAt: new Date() }
              : p
          )
        }
      )

      // Also update detail cache if exists
      if (previousProduct) {
        queryClient.setQueryData(
          productKeys.detail(updatedProduct.id),
          { ...previousProduct, ...updatedProduct, updatedAt: new Date() }
        )
      }

      return { previousProducts, previousProduct, previousStatus }
    },
    onSuccess: async (data, variables, context) => {
      // Update specific product in cache with server response
      queryClient.setQueryData(productKeys.detail(data.id), data)

      // Detect if status changed to LIVE using the PREVIOUS status from onMutate
      const statusChangedToLive =
        variables.status === 'LIVE' &&
        context?.previousStatus !== 'LIVE'

      if (statusChangedToLive) {
        // Send product LIVE notification via API route (fire-and-forget)
        fetch('/api/emails/send-product-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: data.name,
            productUrl: data.productiveUrl,
            operator: data.operator,
            country: data.country,
            language: data.language,
          }),
        }).catch(error => {
          console.error('Failed to send product LIVE emails:', error)
          // Don't throw - product update was successful
        })
      }

      toast({
        title: '✓ Producto actualizado',
        description: 'Los cambios se han guardado exitosamente',
        variant: 'success',
      })
    },
    onError: (error: Error, updatedProduct, context) => {
      // ❌ Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.all, context.previousProducts)
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(
          productKeys.detail(updatedProduct.id),
          context.previousProduct
        )
      }

      console.error('Error updating product:', error)
      toast({
        title: '✕ Error al actualizar',
        description: error.message || 'No se pudo actualizar el producto. Intenta nuevamente.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      // Always refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: productKeys.all })
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
 * Hook to delete a product with optimistic updates (Sprint 5.1)
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteProduct,
    onMutate: async (productId) => {
      // ✅ OPTIMISTIC: Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.all })

      // Snapshot the previous value for rollback
      const previousProducts = queryClient.getQueryData(productKeys.all)

      // Optimistically remove the product from cache
      queryClient.setQueriesData<Product[]>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return old
          return old.filter((p) => p.id !== productId)
        }
      )

      // Also remove from detail cache
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) })

      return { previousProducts }
    },
    onSuccess: () => {
      toast({
        title: '✓ Producto eliminado',
        description: 'El producto se ha eliminado exitosamente',
        variant: 'success',
      })
    },
    onError: (error: Error, productId, context) => {
      // ❌ Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.all, context.previousProducts)
      }

      console.error('Error deleting product:', error)
      toast({
        title: '✕ Error al eliminar',
        description: error.message || 'No se pudo eliminar el producto. Intenta nuevamente.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      // Always refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}
