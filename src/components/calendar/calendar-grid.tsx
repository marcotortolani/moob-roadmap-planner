import { useMemo } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  getDay,
  isWithinInterval,
  isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDayCell } from './calendar-day-cell'
import { isBusinessDay, getBusinessDaysInRange } from '@/lib/business-days'
import type {
  Product,
  Milestone,
  Holiday,
  DragCardType,
} from '@/lib/types'

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

interface CalendarGridProps {
  daysInMonth: Date[]
  currentMonth: Date
  products: Product[]
  holidays: Holiday[]
  holidayMap: Map<string, Holiday>
  onSelectProduct: (product: Product) => void
  dragState: DragState | null
  previewDates: PreviewDates | null
}

export function CalendarGrid({
  daysInMonth,
  currentMonth,
  products,
  holidays,
  holidayMap,
  onSelectProduct,
  dragState,
  previewDates,
}: CalendarGridProps) {
  const weekDays = useMemo(() => {
    const firstDayOfWeek = startOfWeek(new Date(), {
      locale: es,
      weekStartsOn: 1,
    })
    return Array.from({ length: 5 }).map((_, i) =>
      format(addDays(firstDayOfWeek, i), 'eeee', { locale: es }),
    )
  }, [])

  // Memoize business day checks for performance
  const businessDayMap = useMemo(() => {
    const map = new Map<string, boolean>()
    daysInMonth.forEach((day) => {
      map.set(format(day, 'yyyy-MM-dd'), isBusinessDay(day, holidays))
    })
    return map
  }, [daysInMonth, holidays])

  // Memoize card types for each product-day combination
  const productCardTypes = useMemo(() => {
    const types = new Map<string, DragCardType>()
    products.forEach((product) => {
      const businessDays = getBusinessDaysInRange(
        product.startDate,
        product.endDate,
        holidays,
      )
      businessDays.forEach((day, index) => {
        const key = `${product.id}-${format(day, 'yyyy-MM-dd')}`
        if (businessDays.length === 1) {
          types.set(key, 'single')
        } else if (index === 0) {
          types.set(key, 'first')
        } else if (index === businessDays.length - 1) {
          types.set(key, 'last')
        } else {
          types.set(key, 'middle')
        }
      })
    })
    return types
  }, [products, holidays])

  const getProductsForDay = (day: Date): Product[] => {
    return products.filter((p) =>
      isWithinInterval(day, { start: p.startDate, end: p.endDate }),
    )
  }

  const getMilestoneForDay = (
    day: Date,
    productId: string,
  ): Milestone | undefined => {
    const product = products.find((p) => p.id === productId)
    return product?.milestones.find((m) => isSameDay(m.startDate, day))
  }

  const getProductCardType = (
    product: Product,
    currentDay: Date,
  ): DragCardType => {
    const key = `${product.id}-${format(currentDay, 'yyyy-MM-dd')}`
    return productCardTypes.get(key) || 'middle'
  }

  return (
    <div className="grid grid-cols-5 flex-1" role="grid">
      {weekDays.map((day) => (
        <div
          key={day}
          className="text-center font-medium text-muted-foreground text-xs sm:text-sm capitalize pb-2 border-b"
          role="columnheader"
        >
          {day}
        </div>
      ))}

      {daysInMonth.map((day) => {
        const dayOfWeek = getDay(day)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return null
        }

        const holiday = holidayMap.get(format(day, 'yyyy-MM-dd'))
        const productEvents = !holiday ? getProductsForDay(day) : []

        return (
          <CalendarDayCell
            key={day.toString()}
            day={day}
            currentMonth={currentMonth}
            holiday={holiday}
            productEvents={productEvents}
            getMilestoneForDay={getMilestoneForDay}
            onSelectProduct={onSelectProduct}
            getProductCardType={getProductCardType}
            businessDayMap={businessDayMap}
            dragState={dragState}
            previewDates={previewDates}
            holidays={holidays}
          />
        )
      })}
    </div>
  )
}
