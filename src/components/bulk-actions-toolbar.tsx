// src/components/bulk-actions-toolbar.tsx

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Status } from '@/lib/types'
import { useState } from 'react'

interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onDeleteSelected: () => Promise<void>
  onChangeStatus: (status: Status) => Promise<void>
  isVisible: boolean
}

/**
 * Toolbar flotante para acciones en batch
 * Sprint 7.1: Bulk Operations
 *
 * Aparece cuando hay productos seleccionados
 */
export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onDeleteSelected,
  onChangeStatus,
  isVisible,
}: BulkActionsToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDeleteSelected()
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    setIsChangingStatus(true)
    try {
      await onChangeStatus(status as Status)
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="border-3 border-black shadow-neo-lg bg-white rounded-lg p-4 flex items-center gap-4 min-w-[400px]">
              {/* Selected count */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {selectedCount}
                </div>
                <span className="text-sm font-medium">seleccionados</span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Change status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <Select
                  disabled={isChangingStatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Cambiar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Programado</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Proceso</SelectItem>
                    <SelectItem value="DEMO_OK">Demo</SelectItem>
                    <SelectItem value="LIVE">Productivo</SelectItem>
                  </SelectContent>
                </Select>
                {isChangingStatus && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Delete button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="h-8"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </>
                )}
              </Button>

              {/* Clear selection button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedCount} productos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los productos seleccionados
              serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
