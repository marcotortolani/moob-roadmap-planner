import { memo, useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DragHandle } from '@/components/drag-handle'
import { countBusinessDays } from '@/lib/business-days'
import type {
  Product,
  Milestone,
  Holiday,
  DragCardType,
  ProductDragData,
} from '@/lib/types'

interface CalendarProductCardProps {
  product: Product
  day: Date
  cardType: DragCardType
  isDraggable: boolean
  milestoneEvent: Milestone | undefined
  onSelectProduct: (product: Product) => void
  isBeingDragged: boolean
  isPreview: boolean
  holidays: Holiday[]
}

export const CalendarProductCard = memo(function CalendarProductCard({
  product,
  day,
  cardType,
  isDraggable,
  milestoneEvent,
  onSelectProduct,
  isBeingDragged,
  isPreview,
  holidays,
}: CalendarProductCardProps) {
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

  const handleClick = useCallback(() => {
    if (!isDragging) {
      onSelectProduct(product)
    }
  }, [isDragging, onSelectProduct, product])

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
        aria-label="Vista previa del producto"
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
            'border-2 border-black shadow-neo-sm p-1 mb-1 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all group relative w-full text-xs text-white truncate',
            isDraggable
              ? 'cursor-grab active:cursor-grabbing'
              : ' cursor-pointer',
          )}
          style={{ backgroundColor: product.cardColor }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={`${product.name} - ${product.operator}/${product.country}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClick()
            }
          }}
        >
          {!isDraggable && (
            <ExternalLink
              className="absolute top-1 right-1 h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
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

        {product.status === 'LIVE' ? (
          <p className="text-xs text-green-500 mt-1 font-semibold">
            ✓ Producto en productivo - Haz clic para ver detalles
          </p>
        ) : isDraggable ? (
          <p className="text-xs text-yellow-600 mt-1">
            Arrastra para reprogramar
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            Haz clic para ver detalles
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
})
