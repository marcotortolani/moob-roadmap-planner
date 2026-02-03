import { useState, useEffect, useCallback } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { addBusinessDays, countBusinessDays } from '@/lib/business-days'
import { getHolidaysFromStorage } from '@/lib/actions'
import type { Holiday, ProductFormData, Product } from '@/lib/types'

export function useBusinessDaysCalculator(
  form: UseFormReturn<ProductFormData>,
  product?: Product,
) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [dateInputMode, setDateInputMode] = useState<'manual' | 'business-days'>(
    'business-days',
  )
  const [businessDaysCount, setBusinessDaysCount] = useState<number>(1)

  // Load holidays
  useEffect(() => {
    const fetchHolidays = () => {
      setHolidays(getHolidaysFromStorage())
    }

    fetchHolidays()
    window.addEventListener('storage', fetchHolidays)

    // Calculate initial business days if product exists
    if (product?.startDate && product?.endDate) {
      const count = countBusinessDays(
        new Date(product.startDate),
        new Date(product.endDate),
        getHolidaysFromStorage(),
      )
      setBusinessDaysCount(count)
    }

    return () => window.removeEventListener('storage', fetchHolidays)
  }, [product])

  // Toggle input mode
  const toggleDateInputMode = useCallback(() => {
    setDateInputMode((mode) =>
      mode === 'manual' ? 'business-days' : 'manual',
    )
  }, [])

  // Update business days count and calculate end date
  const handleBusinessDaysChange = useCallback(
    (count: number) => {
      setBusinessDaysCount(count)

      const startDate = form.watch('startDate')
      if (startDate) {
        const endDate = addBusinessDays(startDate, count - 1, holidays)
        form.setValue('endDate', endDate)
      }
    },
    [form, holidays],
  )

  // Handle start date change in business-days mode
  const handleStartDateChange = useCallback(
    (date: Date | undefined) => {
      form.setValue('startDate', date)

      // Auto-calculate end date when start date changes
      if (date && businessDaysCount > 0) {
        const endDate = addBusinessDays(date, businessDaysCount - 1, holidays)
        form.setValue('endDate', endDate)
      }
    },
    [form, businessDaysCount, holidays],
  )

  return {
    holidays,
    dateInputMode,
    businessDaysCount,
    toggleDateInputMode,
    handleBusinessDaysChange,
    handleStartDateChange,
  }
}
