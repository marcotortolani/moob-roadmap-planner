'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  startOfMonth,
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProductDetailModal } from './product-detail-modal'
import { HolidayManagementModal } from './holiday-management-modal'
import {
  CalendarHeader,
  CalendarGrid,
  CalendarDragOverlay,
} from './calendar'
import { useCalendarDrag } from '@/hooks/use-calendar-drag'
import { useHolidays } from '@/hooks/queries'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/hooks/use-toast'
import { usePermissionChecks } from '@/lib/rbac/hooks'
import type { Product, Holiday } from '@/lib/types'

export function ProductCalendar({ products }: { products: Product[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()
  const { canEditProducts } = usePermissionChecks()

  // Fetch holidays using React Query
  const { data: holidays = [] } = useHolidays()

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Mobile long-press
        tolerance: 5,
      },
    }),
  )

  // Calculate days to display in calendar
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // Create holiday map for fast lookups
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>()
    holidays.forEach((h) => {
      // Ensure date is valid before formatting
      if (h.date && !isNaN(h.date.getTime())) {
        map.set(format(h.date, 'yyyy-MM-dd'), h)
      }
    })
    return map
  }, [holidays])

  // Month navigation handlers
  const nextMonth = useCallback(() => setCurrentMonth(addMonths(currentMonth, 1)), [currentMonth])
  const prevMonth = useCallback(() => setCurrentMonth(subMonths(currentMonth, 1)), [currentMonth])
  const goToToday = useCallback(() => setCurrentMonth(new Date()), [])

  // Callbacks for drag operations
  const handleDragSuccess = useCallback(
    (message: string) => {
      toast({
        title: 'Producto reprogramado',
        description: message,
      })
    },
    [toast],
  )

  const handleDragError = useCallback(
    (message: string) => {
      toast({
        title: 'Ubicación inválida',
        description: message,
        variant: 'destructive',
      })
    },
    [toast],
  )

  // Use custom drag hook
  const { dragState, previewDates, handleDragStart, handleDragMove, handleDragEnd } =
    useCalendarDrag({
      products,
      holidays,
      user,
      onSuccess: handleDragSuccess,
      onError: handleDragError,
    })

  // Handler for selecting product
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
  }, [])

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight font-headline">
            No tienes productos
          </h3>
          <p className="text-sm text-muted-foreground">
            Crea un producto para verlo en el calendario.
          </p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={canEditProducts ? handleDragStart : undefined}
        onDragMove={canEditProducts ? handleDragMove : undefined}
        onDragEnd={canEditProducts ? handleDragEnd : undefined}
      >
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-2 sm:p-4 flex flex-col h-full">
          <CalendarHeader
            currentMonth={currentMonth}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onToday={goToToday}
            onManageHolidays={() => setIsHolidayModalOpen(true)}
          />

          <CalendarGrid
            daysInMonth={daysInMonth}
            currentMonth={currentMonth}
            products={products}
            holidays={holidays}
            holidayMap={holidayMap}
            onSelectProduct={handleSelectProduct}
            dragState={dragState}
            previewDates={previewDates}
            canEditProducts={canEditProducts}
          />
        </div>

        <DragOverlay>
          <CalendarDragOverlay dragState={dragState} products={products} />
        </DragOverlay>
      </DndContext>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <HolidayManagementModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
      />
    </TooltipProvider>
  )
}
