import { GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

interface DragHandleProps {
  isDragging?: boolean;
}

export function DragHandle({ isDragging = false }: DragHandleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-1 top-1 z-20 rounded bg-black/40 backdrop-blur-sm p-0.5 pointer-events-none"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <GripVertical className="h-3.5 w-3.5 text-white" />
    </motion.div>
  );
}
