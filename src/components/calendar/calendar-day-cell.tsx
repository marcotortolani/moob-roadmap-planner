import { memo, useState } from 'react'
import {
  format,
  isSameMonth,
  isToday,
  isSameDay,
  isWithinInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CalendarProductCard } from './calendar-product-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  dayHolidays: Holiday[]
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
  dayHolidays,
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
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
  const dateStr = format(day, 'yyyy-MM-dd')
  const isBusinessDayValue = businessDayMap.get(dateStr) || false
  const hasHolidays = dayHolidays.length > 0

  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dateStr}`,
    data: {
      date: day,
      isHoliday: hasHolidays,
      isBusinessDay: isBusinessDayValue,
    } as DayCellDropData,
  })

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        backgroundColor:
          isOver && isBusinessDayValue && !hasHolidays
            ? 'rgba(100, 116, 139, 0.1)'
            : 'rgba(0, 0, 0, 0)',
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        'border-2 border-black relative min-h-[100px] sm:min-h-[120px] p-1.5 flex flex-col',
        isToday(day) && 'border-4 border-destructive',
        !isSameMonth(day, currentMonth) && 'bg-muted/30 text-muted-foreground',
        hasHolidays && 'bg-holiday-stripes text-black dark:text-orange-200',
        !isBusinessDayValue && !hasHolidays && 'bg-neutral-100 dark:bg-neutral-900',
        isOver && !isBusinessDayValue && 'ring-2 ring-destructive',
      )}
      role="gridcell"
      aria-label={`${format(day, 'd')} de ${format(day, 'MMMM yyyy')}${hasHolidays ? ` - Feriados: ${dayHolidays.map((h) => h.name).join(', ')}` : ''}`}
    >
      <time
        dateTime={dateStr}
        className={cn(
          'text-xs h-6 w-6 flex items-center justify-center rounded-full',
          isToday(day) && 'bg-primary font-bold text-primary-foreground',
          !isSameMonth(day, currentMonth) && 'text-muted-foreground/60',
          hasHolidays && !isToday(day) && 'bg-neutral-300 dark:bg-white text-black',
        )}
      >
        {format(day, 'd')}
      </time>
      <div className="mt-1 flex-1 overflow-y-auto space-y-1 pb-2 pr-2">
        {productEvents.map((productEvent) => {
          const cardType = getProductCardType(productEvent, day)
          const milestoneEvent = getMilestoneForDay(day, productEvent.id)
          const isDraggable =
            canEditProducts &&
            productEvent.status !== 'LIVE' &&
            (cardType === 'first' ||
              cardType === 'last' ||
              cardType === 'single')

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
      </div>
      {hasHolidays && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4 px-1 gap-1">
          {dayHolidays.map((holiday) => (
            <div
              key={holiday.id}
              onClick={() => setIsHolidayModalOpen(true)}
              className="text-[10px] sm:text-xs p-1.5 sm:p-2 bg-neutral-300 dark:bg-white rounded-full px-2 sm:px-3 text-black pointer-events-auto max-w-[95%] line-clamp-1 text-center leading-tight cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors"
              role="button"
              aria-label={`Ver detalles del feriado: ${holiday.name}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsHolidayModalOpen(true)
                }
              }}
            >
              {holiday.name}
            </div>
          ))}
        </div>
      )}

      {/* Holiday Detail Modal */}
      {hasHolidays && (
        <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center">
                {dayHolidays.length === 1
                  ? dayHolidays[0].name
                  : 'Días No Laborables'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center pt-2">
              <div className="text-lg font-medium text-foreground">
                {format(day, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
              <div className="flex flex-col items-center gap-2">
                {dayHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="inline-block px-4 py-2 bg-orange-100 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium"
                  >
                    {holiday.name}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  )
})
