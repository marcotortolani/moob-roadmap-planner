import { useMemo } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  getDay,
  isWithinInterval,
  isSameDay,
  eachDayOfInterval,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDayCell } from './calendar-day-cell'
import { isBusinessDay, getBusinessDaysInRange } from '@/lib/business-days'
import type { Product, Milestone, Holiday, DragCardType } from '@/lib/types'

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
  canEditProducts: boolean
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
  canEditProducts,
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

  const shortWeekDays = useMemo(() => {
    return weekDays.map((day) => day.slice(0, 3))
  }, [weekDays])

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
      // Use getBusinessDaysInRange to get only business days (excludes weekends AND holidays)
      // This matches the draggable days in the calendar
      const businessDays = getBusinessDaysInRange(
        product.startDate,
        product.endDate,
        holidays,
      )

      // Mark ALL calendar days for this product, not just business days
      // This ensures products show on all days but only business days are draggable
      const allDays = eachDayOfInterval({
        start: product.startDate,
        end: product.endDate,
      })

      allDays.forEach((day) => {
        const key = `${product.id}-${format(day, 'yyyy-MM-dd')}`
        const businessDayIndex = businessDays.findIndex((bd) =>
          isSameDay(bd, day),
        )

        if (businessDayIndex === -1) {
          // Not a business day - mark as middle (not draggable)
          types.set(key, 'middle')
        } else if (businessDays.length === 1) {
          types.set(key, 'single')
        } else if (businessDayIndex === 0) {
          types.set(key, 'first')
        } else if (businessDayIndex === businessDays.length - 1) {
          types.set(key, 'last')
        } else {
          types.set(key, 'middle')
        }
      })
    })
    return types
  }, [products, holidays])

  const getProductsForDay = (day: Date): Product[] => {
    // Normalize all dates to start of day to avoid timezone issues
    const normalizedDay = startOfDay(day)
    return products.filter((p) => {
      const normalizedStart = startOfDay(p.startDate)
      const normalizedEnd = startOfDay(p.endDate)
      return isWithinInterval(normalizedDay, {
        start: normalizedStart,
        end: normalizedEnd,
      })
    })
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
          className="hidden sm:block border-b-3 border-black bg-neo-gray-light p-4 text-center"
          role="columnheader"
        >
          <h3 className="text-xl font-black uppercase">{day}</h3>
        </div>
      ))}

      {shortWeekDays.map((day) => (
        <div
          key={day}
          className="sm:hidden border-b-3 border-black bg-neo-gray-light p-2 text-center"
          role="columnheader"
        >
          <h3 className="text-lg font-black uppercase">{day}</h3>
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
            canEditProducts={canEditProducts}
          />
        )
      })}
    </div>
  )
}
