import { motion } from 'framer-motion'
import type { Product } from '@/lib/types'

interface DragState {
  productId: string
  type: 'first' | 'last'
  originalDate: Date
  originalDuration: number
}

interface CalendarDragOverlayProps {
  dragState: DragState | null
  products: Product[]
}

export function CalendarDragOverlay({
  dragState,
  products,
}: CalendarDragOverlayProps) {
  if (!dragState) return null

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
}
