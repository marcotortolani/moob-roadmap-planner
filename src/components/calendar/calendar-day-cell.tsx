import { memo } from 'react'
import {
  format,
  isSameMonth,
  isToday,
  isSameDay,
  isWithinInterval,
} from 'date-fns'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CalendarProductCard } from './calendar-product-card'
import type {
  Product,
  Milestone,
  Holiday,
  DragCardType,
  DayCellDropData,
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

interface CalendarDayCellProps {
  day: Date
  currentMonth: Date
  holiday: Holiday | undefined
  productEvents: Product[]
  getMilestoneForDay: (day: Date, productId: string) => Milestone | undefined
  onSelectProduct: (product: Product) => void
  getProductCardType: (product: Product, day: Date) => DragCardType
  businessDayMap: Map<string, boolean>
  dragState: DragState | null
  previewDates: PreviewDates | null
  holidays: Holiday[]
  canEditProducts: boolean
}

export const CalendarDayCell = memo(function CalendarDayCell({
  day,
  currentMonth,
  holiday,
  productEvents,
  getMilestoneForDay,
  onSelectProduct,
  getProductCardType,
  businessDayMap,
  dragState,
  previewDates,
  holidays,
  canEditProducts,
}: CalendarDayCellProps) {
  const dateStr = format(day, 'yyyy-MM-dd')
  const isBusinessDayValue = businessDayMap.get(dateStr) || false

  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dateStr}`,
    data: {
      date: day,
      isHoliday: !!holiday,
      isBusinessDay: isBusinessDayValue,
    } as DayCellDropData,
  })

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        backgroundColor:
          isOver && isBusinessDayValue && !holiday
            ? 'rgba(100, 116, 139, 0.1)'
            : 'rgba(0, 0, 0, 0)',
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative min-h-[100px] sm:min-h-[120px] p-1.5 border-b border-r flex flex-col',
        isToday(day) && 'border-2 border-destructive',
        !isSameMonth(day, currentMonth) && 'bg-muted/30 text-muted-foreground',
        holiday &&
          'bg-orange-100 dark:bg-orange-950/20 text-black dark:text-orange-200',
        !isBusinessDayValue && !holiday && 'bg-neutral-100 dark:bg-neutral-900',
        isOver && !isBusinessDayValue && 'ring-2 ring-destructive',
      )}
      role="gridcell"
      aria-label={`${format(day, 'd')} de ${format(day, 'MMMM yyyy')}${holiday ? ` - Feriado: ${holiday.name}` : ''}`}
    >
      <time
        dateTime={dateStr}
        className={cn(
          'text-xs h-6 w-6 flex items-center justify-center rounded-full',
          isToday(day) && 'bg-primary font-bold text-primary-foreground',
          !isSameMonth(day, currentMonth) && 'text-muted-foreground/60',
        )}
      >
        {format(day, 'd')}
      </time>
      <div className="mt-1 flex-1 overflow-y-auto space-y-1">
        {productEvents.map((productEvent) => {
          const cardType = getProductCardType(productEvent, day)
          const milestoneEvent = getMilestoneForDay(day, productEvent.id)
          const isDraggable =
            canEditProducts &&
            (cardType === 'first' || cardType === 'last' || cardType === 'single')

          // Check if this is being dragged
          const isBeingDragged = dragState?.productId === productEvent.id

          // Check if this is a preview card
          const isPreview =
            previewDates?.productId === productEvent.id &&
            isWithinInterval(day, {
              start: previewDates.startDate,
              end: previewDates.endDate,
            })

          return (
            <CalendarProductCard
              key={productEvent.id}
              product={productEvent}
              day={day}
              cardType={cardType}
              isDraggable={isDraggable}
              milestoneEvent={milestoneEvent}
              onSelectProduct={onSelectProduct}
              isBeingDragged={isBeingDragged}
              isPreview={isPreview && !isBeingDragged}
              holidays={holidays}
            />
          )
        })}
        {holiday && (
          <div className="text-center text-xs p-2" role="status">
            {holiday.name}
          </div>
        )}
      </div>
    </motion.div>
  )
})
