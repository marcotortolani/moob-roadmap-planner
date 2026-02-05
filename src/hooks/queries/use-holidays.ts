'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { holidayRepository } from '@/data/repositories'
import type { Holiday } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

/**
 * Query Keys for Holidays
 */
export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: (year?: number) => [...holidayKeys.lists(), year] as const,
}

/**
 * Hook to fetch all holidays
 * Uses repository pattern - currently configured for localStorage
 */
export function useHolidays(year?: number) {
  return useQuery({
    queryKey: holidayKeys.list(year),
    queryFn: async () => {
      console.log('🎉 [useHolidays] Fetching from repository...')
      const result = await holidayRepository.getAll()

      if (result.success && result.data) {
        console.log('🎉 [useHolidays] Loaded', result.data.length, 'holidays')

        // Filter by year if provided
        if (year) {
          const filtered = result.data.filter((holiday) => {
            const holidayYear = new Date(holiday.date).getFullYear()
            return holidayYear === year
          })
          console.log('🎉 [useHolidays] Filtered to', filtered.length, 'holidays for year', year)
          return filtered
        }

        return result.data
      }

      console.error('🎉 [useHolidays] Error:', result.error)
      return []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (holidays don't change often)
  })
}

/**
 * Hook to create a new holiday
 */
export function useCreateHoliday() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (holiday: Omit<Holiday, 'id'>) => {
      const result = await holidayRepository.create(holiday)
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create holiday')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      toast({
        title: 'Éxito',
        description: 'Festivo agregado exitosamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al agregar el festivo',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to delete a holiday
 */
export function useDeleteHoliday() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await holidayRepository.delete(id)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete holiday')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      toast({
        title: 'Éxito',
        description: 'Festivo eliminado exitosamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el festivo',
        variant: 'destructive',
      })
    },
  })
}
