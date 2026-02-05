'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ProductForm from './product-form'
import { useCan } from '@/lib/rbac/hooks'

/**
 * Floating Action Button for creating new products
 * Only visible to users with create permission
 */
export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const canCreate = useCan('products', 'create')

  // Hide button if user doesn't have create permission (e.g., GUEST role)
  if (!canCreate) {
    return null
  }

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 md:bottom-8 md:right-8"
        onClick={() => setIsOpen(true)}
        aria-label="Crear nuevo producto"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription>
              Completa la información del producto para agregarlo al roadmap.
            </DialogDescription>
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>
    </>
  )
}
