// src/components/tools-sheet.tsx

'use client'

import { useState } from 'react'
import { Wrench, Download, Bookmark, CheckSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Product } from '@/lib/types'
import type { FilterPreset } from '@/hooks/use-saved-filters'

interface ToolsSheetProps {
  // Export props
  products: Product[]
  onExportExcel: () => Promise<void>
  onExportCSV: () => Promise<void>

  // Saved filters props
  savedFiltersCount: number
  savedFilters: FilterPreset[]
  onLoadFilter: (preset: FilterPreset) => void
  onDeleteFilter: (presetId: string) => void

  // Selection mode props
  selectionMode: boolean
  onToggleSelectionMode: () => void
}

/**
 * Sheet con herramientas para mobile
 * Sprint 7 - Responsive
 *
 * Mismo estilo que FiltersSheet
 */
export function ToolsSheet({
  products,
  onExportExcel,
  onExportCSV,
  savedFiltersCount,
  savedFilters,
  onLoadFilter,
  onDeleteFilter,
  selectionMode,
  onToggleSelectionMode,
}: ToolsSheetProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: 'excel' | 'csv') => {
    setIsExporting(true)
    try {
      if (type === 'excel') {
        await onExportExcel()
      } else {
        await onExportCSV()
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleToggleSelection = () => {
    onToggleSelectionMode()
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="md:hidden">
          <Wrench className="mr-2 h-4 w-4" />
          Herramientas
        </Button>
      </SheetTrigger>

      <SheetContent className="border-l-3 border-black pl-3 pr-4">
        <SheetHeader>
          <SheetTitle>Herramientas</SheetTitle>
          <SheetDescription>
            Opciones avanzadas para gestionar tus productos
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Export Section */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Exportar</h4>
              <Badge variant="secondary">{products.length}</Badge>
            </div>

            <div className="text-sm text-muted-foreground -mt-2">
              Descarga el roadmap completo en formato Excel o CSV
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => handleExport('excel')}
                disabled={isExporting || products.length === 0}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={() => handleExport('csv')}
                disabled={isExporting || products.length === 0}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>

            <Separator />

            {/* Saved Filters Section */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Filtros guardados</h4>
              {savedFiltersCount > 0 && (
                <Badge variant="secondary">{savedFiltersCount}</Badge>
              )}
            </div>

            {savedFilters.length === 0 ? (
              <div className="text-sm text-muted-foreground -mt-2">
                No hay filtros guardados. Guarda tus filtros favoritos desde el
                botón de filtros.
              </div>
            ) : (
              <div className="space-y-2 -mt-2">
                {savedFilters.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-2 border-2 border-black rounded-sm bg-white hover:bg-gray-50"
                  >
                    <button
                      onClick={() => {
                        onLoadFilter(preset)
                        setOpen(false)
                      }}
                      className="flex-1 text-left text-sm font-medium"
                    >
                      {preset.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteFilter(preset.id)}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Bulk Selection Section */}
            <h4 className="text-lg font-semibold">Selección múltiple</h4>

            <div className="text-sm text-muted-foreground -mt-2">
              Selecciona múltiples productos para cambiar su estado o
              eliminarlos en batch
            </div>

            <div className="flex items-center justify-between p-3 border-2 border-black rounded-sm bg-white">
              <Label
                htmlFor="selection-mode"
                className="text-sm font-medium cursor-pointer"
              >
                Activar selección
              </Label>
              <Switch
                id="selection-mode"
                checked={selectionMode}
                onCheckedChange={handleToggleSelection}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
