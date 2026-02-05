import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DragStartEvent, DragMoveEvent, DragEndEvent } from '@dnd-kit/core'
import type {
  Product,
  Holiday,
  ProductDragData,
  DayCellDropData,
} from '@/lib/types'
import {
  addBusinessDays,
  subtractBusinessDays,
  countBusinessDays,
} from '@/lib/business-days'
import { useUpdateProduct } from '@/hooks/queries'
import type { User } from '@/lib/types'

interface DragState {
  productId: string
  type: 'first' | 'last'
  originalDate: Date
  originalDuration: number
}

interface PreviewDates {
  productId: string
  startDate: Date
  endDate: Date
}

interface UseCalendarDragProps {
  products: Product[]
  holidays: Holiday[]
  user: User | null
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function useCalendarDrag({
  products,
  holidays,
  user,
  onSuccess,
  onError,
}: UseCalendarDragProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [previewDates, setPreviewDates] = useState<PreviewDates | null>(null)
  const updateProductMutation = useUpdateProduct()

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as ProductDragData
      const { productId, type, product } = data

      // Only allow dragging first or last cards
      if (type !== 'first' && type !== 'last') return

      const duration = countBusinessDays(
        product.startDate,
        product.endDate,
        holidays,
      )

      setDragState({
        productId,
        type,
        originalDate: new Date(product.startDate),
        originalDuration: duration,
      })
    },
    [holidays],
  )

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!dragState || !event.over) return

      const dropData = event.over.data.current as DayCellDropData
      const targetDate = dropData?.date

      if (!targetDate || !dropData?.isBusinessDay) return

      // Calculate preview dates based on drag type
      let newStartDate: Date
      let newEndDate: Date

      if (dragState.type === 'first') {
        newStartDate = new Date(targetDate)
        newEndDate = addBusinessDays(
          targetDate,
          dragState.originalDuration - 1,
          holidays,
        )
      } else {
        newEndDate = new Date(targetDate)
        newStartDate = subtractBusinessDays(
          targetDate,
          dragState.originalDuration - 1,
          holidays,
        )
      }

      setPreviewDates({
        productId: dragState.productId,
        startDate: newStartDate,
        endDate: newEndDate,
      })
    },
    [dragState, holidays],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!dragState) return

      const dropData = event.over?.data.current as DayCellDropData
      const targetDate = dropData?.date
      const targetIsBusinessDay = dropData?.isBusinessDay

      // Validation
      if (!targetDate || !targetIsBusinessDay) {
        onError('No se puede soltar en fines de semana o feriados')
        setDragState(null)
        setPreviewDates(null)
        return
      }

      // Calculate final dates
      let newStartDate: Date
      let newEndDate: Date

      if (dragState.type === 'first') {
        newStartDate = new Date(targetDate)
        newEndDate = addBusinessDays(
          targetDate,
          dragState.originalDuration - 1,
          holidays,
        )
      } else {
        newEndDate = new Date(targetDate)
        newStartDate = subtractBusinessDays(
          targetDate,
          dragState.originalDuration - 1,
          holidays,
        )
      }

      // Validate range
      const businessDayCount = countBusinessDays(
        newStartDate,
        newEndDate,
        holidays,
      )
      if (businessDayCount < 1) {
        onError('Debe abarcar al menos un día laboral')
        setDragState(null)
        setPreviewDates(null)
        return
      }

      // Update product
      const product = products.find((p) => p.id === dragState.productId)
      if (!product || !user) {
        setDragState(null)
        setPreviewDates(null)
        return
      }

      try {
        // Use React Query mutation
        await updateProductMutation.mutateAsync({
          id: product.id,
          startDate: newStartDate,
          endDate: newEndDate,
        })

        const businessDaysCount = countBusinessDays(
          newStartDate,
          newEndDate,
          holidays,
        )

        onSuccess(
          `${product.name} - ${businessDaysCount} ${businessDaysCount === 1 ? 'día' : 'días'} laborables\nDesde ${format(newStartDate, 'PP', { locale: es })}\nHasta ${format(newEndDate, 'PP', { locale: es })}`,
        )
      } catch (error) {
        console.error('Error updating product dates:', error)
        onError('Error al actualizar las fechas del producto')
      }

      setDragState(null)
      setPreviewDates(null)
    },
    [dragState, holidays, products, user, onSuccess, onError, updateProductMutation],
  )

  return {
    dragState,
    previewDates,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }
}
