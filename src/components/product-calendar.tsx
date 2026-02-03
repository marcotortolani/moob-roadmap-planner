'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  startOfMonth,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  isWithinInterval,
  getDay,
  startOfWeek,
  addDays,
  endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ExternalLink,
} from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type {
  Product,
  Milestone,
  Holiday,
  ProductFormData,
  DragCardType,
  ProductDragData,
  DayCellDropData,
} from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProductDetailModal } from './product-detail-modal'
import {
  getHolidaysFromStorage,
  saveHolidaysToStorage,
  createOrUpdateProduct,
} from '@/lib/actions'
import { INITIAL_HOLIDAYS } from '@/lib/holidays'
import { HolidayManagementModal } from './holiday-management-modal'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { DragHandle } from './drag-handle'
import {
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  countBusinessDays,
  getBusinessDaysInRange,
} from '@/lib/business-days'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/hooks/use-toast'

const parseHolidayDate = (dateString: string): Date => {
  const date = new Date(dateString)
  const userTimezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() + userTimezoneOffset)
}

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

export function ProductCalendar({ products }: { products: Product[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [previewDates, setPreviewDates] = useState<PreviewDates | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()

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

  useEffect(() => {
    const fetchHolidays = () => {
      let storedHolidays = getHolidaysFromStorage()
      if (storedHolidays.length === 0) {
        // When initializing from JSON, parse dates correctly
        storedHolidays = INITIAL_HOLIDAYS.map((h) => ({
          ...h,
          date: parseHolidayDate(h.date),
          id: crypto.randomUUID(),
        }))
        saveHolidaysToStorage(storedHolidays)
      }
      setHolidays(storedHolidays)
    }

    fetchHolidays()
    window.addEventListener('storage', fetchHolidays)
    return () => window.removeEventListener('storage', fetchHolidays)
  }, [])

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const weekDays = useMemo(() => {
    const firstDayOfWeek = startOfWeek(new Date(), {
      locale: es,
      weekStartsOn: 1,
    })
    return Array.from({ length: 5 }).map((_, i) =>
      format(addDays(firstDayOfWeek, i), 'eeee', { locale: es }),
    )
  }, [])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

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

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
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
  }

  const handleDragMove = (event: DragMoveEvent) => {
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
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!dragState) return

    const dropData = event.over?.data.current as DayCellDropData
    const targetDate = dropData?.date
    const targetIsBusinessDay = dropData?.isBusinessDay

    // Validation
    if (!targetDate || !targetIsBusinessDay) {
      toast({
        title: 'Ubicación inválida',
        description: 'No se puede soltar en fines de semana o feriados',
        variant: 'destructive',
      })
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
      toast({
        title: 'Rango inválido',
        description: 'Debe abarcar al menos un día laboral',
        variant: 'destructive',
      })
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

    const updatedProduct: ProductFormData = {
      ...product,
      startDate: newStartDate,
      endDate: newEndDate,
      // Map null fields to empty strings for Zod validation
      productiveUrl: product.productiveUrl || '',
      vercelDemoUrl: product.vercelDemoUrl || '',
      wpContentProdUrl: product.wpContentProdUrl || '',
      wpContentTestUrl: product.wpContentTestUrl || '',
      chatbotUrl: product.chatbotUrl || '',
      comments: product.comments || '',
    }

    const result = await createOrUpdateProduct(updatedProduct, user, product.id)

    if (result.success) {
      const businessDaysCount = countBusinessDays(
        newStartDate,
        newEndDate,
        holidays,
      )

      toast({
        title: 'Producto reprogramado',
        description: `${product.name} - ${businessDaysCount} ${businessDaysCount === 1 ? 'día' : 'días'} laborables\nDesde ${format(newStartDate, 'PP', { locale: es })}\nHasta ${format(newEndDate, 'PP', { locale: es })}`,
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: result.message,
      })
    }

    setDragState(null)
    setPreviewDates(null)
  }

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
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-2 sm:p-4 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-headline text-lg sm:text-xl font-semibold capitalize text-center w-40">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToToday}
                className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHolidayModalOpen(true)}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Gestionar Feriados</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-5 flex-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-medium text-muted-foreground text-xs sm:text-sm capitalize pb-2 border-b"
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
                <DayCell
                  key={day.toString()}
                  day={day}
                  currentMonth={currentMonth}
                  holiday={holiday}
                  productEvents={productEvents}
                  getMilestoneForDay={getMilestoneForDay}
                  setSelectedProduct={setSelectedProduct}
                  getProductCardType={getProductCardType}
                  businessDayMap={businessDayMap}
                  dragState={dragState}
                  previewDates={previewDates}
                  holidays={holidays}
                />
              )
            })}
          </div>
        </div>

        <DragOverlay>
          {dragState &&
            (() => {
              const product = products.find((p) => p.id === dragState.productId)
              if (!product) return null

              const duration = dragState.originalDuration

              return (
                <motion.div
                  initial={{ scale: 1, rotate: 0 }}
                  animate={{ scale: 1.08, rotate: 2 }}
                  className="rounded-sm px-2 py-1.5 text-xs text-white shadow-2xl border-2 border-white/20"
                  style={{ backgroundColor: product.cardColor }}
                >
                  <p className="font-bold">{product.name}</p>
                  <p className="opacity-80">
                    {product.operator} / {product.country}
                  </p>
                  <p className="text-[10px] mt-1 opacity-70">
                    {duration} {duration === 1 ? 'día' : 'días'} laborables
                  </p>
                </motion.div>
              )
            })()}
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

interface DayCellProps {
  day: Date
  currentMonth: Date
  holiday: Holiday | undefined
  productEvents: Product[]
  getMilestoneForDay: (day: Date, productId: string) => Milestone | undefined
  setSelectedProduct: (product: Product | null) => void
  getProductCardType: (product: Product, day: Date) => DragCardType
  businessDayMap: Map<string, boolean>
  dragState: DragState | null
  previewDates: PreviewDates | null
  holidays: Holiday[]
}

function DayCell({
  day,
  currentMonth,
  holiday,
  productEvents,
  getMilestoneForDay,
  setSelectedProduct,
  getProductCardType,
  businessDayMap,
  dragState,
  previewDates,
  holidays,
}: DayCellProps) {
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
            : 'transparent',
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
            cardType === 'first' || cardType === 'last' || cardType === 'single'

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
            <ProductCard
              key={productEvent.id}
              product={productEvent}
              day={day}
              cardType={cardType}
              isDraggable={isDraggable}
              milestoneEvent={milestoneEvent}
              setSelectedProduct={setSelectedProduct}
              isBeingDragged={isBeingDragged}
              isPreview={isPreview && !isBeingDragged}
              holidays={holidays}
            />
          )
        })}
        {holiday && (
          <div className="text-center text-xs p-2">{holiday.name}</div>
        )}
      </div>
    </motion.div>
  )
}

interface ProductCardProps {
  product: Product
  day: Date
  cardType: DragCardType
  isDraggable: boolean
  milestoneEvent: Milestone | undefined
  setSelectedProduct: (product: Product | null) => void
  isBeingDragged: boolean
  isPreview: boolean
  holidays: Holiday[]
}

function ProductCard({
  product,
  day,
  cardType,
  isDraggable,
  milestoneEvent,
  setSelectedProduct,
  isBeingDragged,
  isPreview,
  holidays,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const dragId = `${product.id}-${format(day, 'yyyy-MM-dd')}-${cardType}`

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: {
      productId: product.id,
      type: cardType,
      date: day,
      product,
    } as ProductDragData,
    disabled: !isDraggable,
  })

  const businessDaysCount = useMemo(
    () => countBusinessDays(product.startDate, product.endDate, holidays),
    [product.startDate, product.endDate, holidays],
  )

  if (isPreview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        className="border-2 border-dashed rounded-sm px-1.5 py-1 text-xs"
        style={{
          borderColor: product.cardColor,
          backgroundColor: `${product.cardColor}20`,
        }}
      >
        <p className="font-bold" style={{ color: product.cardColor }}>
          Vista previa
        </p>
      </motion.div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          ref={setNodeRef}
          {...(isDraggable ? listeners : {})}
          {...(isDraggable ? attributes : {})}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isDragging || isBeingDragged ? 0.5 : 1,
            scale: isDragging || isBeingDragged ? 0.95 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'group relative w-full rounded-sm px-1.5 py-1 text-xs text-white truncate transition-all duration-200 hover:opacity-80',
            isDraggable
              ? 'cursor-grab active:cursor-grabbing'
              : ' cursor-pointer',
          )}
          style={{ backgroundColor: product.cardColor }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            // Prevent opening modal when dragging
            if (!isDragging) {
              setSelectedProduct(product)
            }
          }}
        >
          {!isDraggable && (
            <ExternalLink className="absolute top-1 right-1 h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <AnimatePresence>
            {isDraggable && isHovered && !isDragging && (
              <DragHandle isDragging={isDragging} />
            )}
          </AnimatePresence>
          <p className="font-bold group-hover:text-neutral-800">
            {product.name}
          </p>
          <p className="opacity-80 group-hover:text-neutral-800">
            {product.operator} / {product.country}
          </p>
          {milestoneEvent && (
            <p className="font-semibold italic pt-1 group-hover:text-neutral-800">
              {milestoneEvent.name}
            </p>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {product.operator} / {product.country}
        </p>
        {milestoneEvent && (
          <p className="text-sm text-blue-400 pt-1">
            Hito: {milestoneEvent.name}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Duración: {businessDaysCount}{' '}
          {businessDaysCount === 1 ? 'día laborable' : 'días laborables'}
        </p>

        {isDraggable && (
          <p className="text-xs text-yellow-400 mt-1">
            Arrastra para reprogramar
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
