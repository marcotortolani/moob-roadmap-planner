'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { parseISO, startOfDay, addDays, differenceInDays } from 'date-fns'
import type { Holiday, HolidayFormData } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'

/**
 * Query Keys for Holidays
 */
export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: (year?: number) => [...holidayKeys.lists(), year] as const,
}

/**
 * Fetch all holidays, optionally filtered by year
 */
async function fetchHolidays(year?: number): Promise<Holiday[]> {
  let query = supabase
    .from('holidays')
    .select('*')
    .order('date', { ascending: true })

  // Filter by year if provided
  if (year) {
    const startOfYear = new Date(year, 0, 1).toISOString()
    const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString()
    query = query.gte('date', startOfYear).lte('date', endOfYear)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching holidays:', error)
    throw new Error(error.message)
  }

  // Transform to match Holiday type
  return (data || []).map((holiday) => ({
    ...holiday,
    // Parse dates and normalize to start of day to avoid timezone issues
    date: startOfDay(parseISO(holiday.date)),
  })) as Holiday[]
}

/**
 * Hook to fetch all holidays.
 * Waits for auth to initialize (same reason as useProducts).
 *
 * ✅ SPRINT 6.2: Optimized staleTime for holiday data (1 hour)
 * Holidays are nearly static - they rarely change once created.
 * Long staleTime reduces unnecessary refetches.
 */
export function useHolidays(year?: number) {
  const { loading: authLoading } = useAuth()

  return useQuery({
    queryKey: holidayKeys.list(year),
    queryFn: () => fetchHolidays(year),
    staleTime: 60 * 60 * 1000, // 1 hour (Sprint 6.2 - was 5 minutes)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache
    enabled: !authLoading,
  })
}

/**
 * Create a new holiday (or range of holidays if endDate is provided)
 */
async function createHoliday(
  holidayData: HolidayFormData,
): Promise<Holiday | Holiday[]> {
  // If endDate is provided, create multiple holidays (one per day in range)
  if (holidayData.endDate) {
    const startDate = startOfDay(holidayData.date)
    const endDate = startOfDay(holidayData.endDate)
    const daysDiff = differenceInDays(endDate, startDate)

    // Generate all dates in the range
    const holidaysToInsert = []
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = addDays(startDate, i)
      holidaysToInsert.push({
        id: crypto.randomUUID(),
        date: currentDate.toISOString(),
        name: holidayData.name,
      })
    }

    // Insert all holidays at once
    const { data, error } = await supabase
      .from('holidays')
      .insert(holidaysToInsert)
      .select()

    if (error) {
      console.error('Error creating holidays:', error)
      throw new Error(error.message)
    }

    // Return array of created holidays
    return (data || []).map((h) => ({
      ...h,
      date: startOfDay(parseISO(h.date)),
    })) as Holiday[]
  }

  // Single holiday creation (original behavior)
  const newId = crypto.randomUUID()

  const { data, error } = await supabase
    .from('holidays')
    .insert({
      id: newId,
      date: holidayData.date.toISOString(),
      name: holidayData.name,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating holiday:', error)
    throw new Error(error.message)
  }

  return {
    ...data,
    date: startOfDay(parseISO(data.date)),
  } as Holiday
}

/**
 * Hook to create a new holiday (or range of holidays)
 */
export function useCreateHoliday() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createHoliday,
    onSuccess: (data) => {
      // Invalidate all holiday queries
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })

      // Show different message for single vs multiple holidays
      const isMultiple = Array.isArray(data)
      toast({
        title: 'Éxito',
        description: isMultiple
          ? `${data.length} días no laborables agregados exitosamente`
          : 'Festivo agregado exitosamente',
      })
    },
    onError: (error: Error) => {
      console.error('Error creating holiday:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error al agregar el festivo',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a holiday
 */
async function deleteHoliday(id: string): Promise<void> {
  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting holiday:', error)
    throw new Error(error.message)
  }
}

/**
 * Hook to delete a holiday
 */
export function useDeleteHoliday() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      // Invalidate all holiday queries
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      toast({
        title: 'Éxito',
        description: 'Festivo eliminado exitosamente',
      })
    },
    onError: (error: Error) => {
      console.error('Error deleting holiday:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el festivo',
        variant: 'destructive',
      })
    },
  })
}
