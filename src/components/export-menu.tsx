// src/components/export-menu.tsx

'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { exportToExcel, exportToCSV } from '@/lib/export'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

interface ExportMenuProps {
  products: Product[]
  disabled?: boolean
}

/**
 * Menú para exportar productos a Excel/CSV
 * Sprint 7.3: Export to Excel/CSV
 *
 * Permite:
 * - Exportar a Excel (.xlsx)
 * - Exportar a CSV
 * - Configurar nombre del archivo
 * - Incluir/excluir comentarios y URLs
 */
export function ExportMenu({ products, disabled = false }: ExportMenuProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [exportType, setExportType] = useState<'excel' | 'csv'>('excel')
  const [filename, setFilename] = useState('roadmap-export')
  const [includeComments, setIncludeComments] = useState(true)
  const [includeUrls, setIncludeUrls] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleQuickExport = async (type: 'excel' | 'csv') => {
    setIsExporting(true)

    const exportFn = type === 'excel' ? exportToExcel : exportToCSV

    try {
      const result = await exportFn(products, {
        filename: 'roadmap-export',
        includeComments: true,
        includeUrls: true,
      })

      setIsExporting(false)

      if (result.success) {
        toast.success(
          `${result.count} productos exportados a ${type === 'excel' ? 'Excel' : 'CSV'}`
        )
      } else {
        toast.error(`Error al exportar: ${result.error}`)
      }
    } catch (error) {
      setIsExporting(false)
      toast.error('Error al cargar librería de exportación')
    }
  }

  const handleCustomExport = async () => {
    if (!filename.trim()) {
      toast.error('Por favor ingresa un nombre de archivo')
      return
    }

    setIsExporting(true)

    const exportFn = exportType === 'excel' ? exportToExcel : exportToCSV

    try {
      const result = await exportFn(products, {
        filename: filename.trim(),
        includeComments,
        includeUrls,
      })

      setIsExporting(false)

      if (result.success) {
        toast.success(
          `${result.count} productos exportados a ${exportType === 'excel' ? 'Excel' : 'CSV'}`
        )
        setShowDialog(false)
      } else {
        toast.error(`Error al exportar: ${result.error}`)
      }
    } catch (error) {
      setIsExporting(false)
      toast.error('Error al cargar librería de exportación')
    }
  }

  const openCustomDialog = (type: 'excel' | 'csv') => {
    setExportType(type)
    setShowDialog(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || products.length === 0 || isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar
                {products.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({products.length})
                  </span>
                )}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuLabel>Exportar roadmap</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Quick exports */}
          <DropdownMenuItem
            onClick={() => handleQuickExport('excel')}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exportar a Excel
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleQuickExport('csv')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Exportar a CSV
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Custom exports */}
          <DropdownMenuItem
            onClick={() => openCustomDialog('excel')}
            className="gap-2 text-muted-foreground"
          >
            Personalizar Excel...
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => openCustomDialog('csv')}
            className="gap-2 text-muted-foreground"
          >
            Personalizar CSV...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom export dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Exportar a {exportType === 'excel' ? 'Excel' : 'CSV'}
            </DialogTitle>
            <DialogDescription>
              Personaliza las opciones de exportación para {products.length}{' '}
              productos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Filename */}
            <div className="space-y-2">
              <Label htmlFor="filename">Nombre del archivo</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="roadmap-export"
              />
              <p className="text-xs text-muted-foreground">
                Se agregará automáticamente la fecha y extensión
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 rounded-md border-2 border-border p-3">
              <div className="font-medium text-sm">Incluir en el export:</div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-comments"
                  checked={includeComments}
                  onCheckedChange={(checked) =>
                    setIncludeComments(checked as boolean)
                  }
                />
                <Label
                  htmlFor="include-comments"
                  className="text-sm font-normal cursor-pointer"
                >
                  Comentarios
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-urls"
                  checked={includeUrls}
                  onCheckedChange={(checked) =>
                    setIncludeUrls(checked as boolean)
                  }
                />
                <Label
                  htmlFor="include-urls"
                  className="text-sm font-normal cursor-pointer"
                >
                  URLs (productiva, demo, WP, chatbot)
                </Label>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-md bg-muted/30 p-3 text-sm space-y-1">
              <div className="font-medium">El archivo incluirá:</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                <li>Información básica (nombre, estado, operador, país)</li>
                <li>Fechas de inicio y fin</li>
                <li>Milestones</li>
                <li>URLs personalizadas</li>
                <li>Metadata (creado por, actualizado por, fechas)</li>
                {includeComments && <li>Comentarios</li>}
                {includeUrls && <li>URLs de servicios</li>}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCustomExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
