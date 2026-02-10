// src/components/saved-filters-menu.tsx

'use client'

import { useState } from 'react'
import { Save, Bookmark, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSavedFilters, FilterPreset } from '@/hooks/use-saved-filters'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface SavedFiltersMenuProps {
  currentFilters: FilterPreset['filters']
  onLoadFilters: (filters: FilterPreset['filters']) => void
  disabled?: boolean
}

/**
 * Menú para gestionar filtros guardados
 * Sprint 7.2: Saved Filters
 *
 * Permite:
 * - Guardar preset actual
 * - Cargar preset guardado
 * - Renombrar preset
 * - Eliminar preset
 */
export function SavedFiltersMenu({
  currentFilters,
  onLoadFilters,
  disabled = false,
}: SavedFiltersMenuProps) {
  const { presets, savePreset, deletePreset, renamePreset } = useSavedFilters()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Por favor ingresa un nombre para el filtro')
      return
    }

    const existingPreset = presets.find((p) => p.name === newPresetName.trim())
    if (existingPreset) {
      toast.error('Ya existe un filtro con ese nombre')
      return
    }

    savePreset(newPresetName.trim(), currentFilters)
    toast.success(`Filtro "${newPresetName}" guardado`)
    setNewPresetName('')
    setShowSaveDialog(false)
  }

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadFilters(preset.filters)
    toast.success(`Filtro "${preset.name}" aplicado`)
  }

  const handleDeletePreset = (preset: FilterPreset, e: React.MouseEvent) => {
    e.stopPropagation()
    deletePreset(preset.id)
    toast.success(`Filtro "${preset.name}" eliminado`)
  }

  const handleStartEdit = (preset: FilterPreset, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(preset.id)
    setEditingName(preset.name)
  }

  const handleSaveEdit = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editingName.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    renamePreset(presetId, editingName.trim())
    toast.success('Filtro renombrado')
    setEditingId(null)
    setEditingName('')
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditingName('')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Filtros guardados
            {presets.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({presets.length})
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel>Filtros guardados</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Save current filters */}
          <DropdownMenuItem
            onClick={() => setShowSaveDialog(true)}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar filtros actuales
          </DropdownMenuItem>

          {presets.length > 0 && <DropdownMenuSeparator />}

          {/* List of saved presets */}
          <div className="max-h-[300px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {presets.map((preset) => (
                <motion.div
                  key={preset.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {editingId === preset.id ? (
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(preset.id, e as any)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit(e as any)
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => handleSaveEdit(preset.id, e)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleLoadPreset(preset)}
                      className="flex items-center justify-between gap-2 group"
                    >
                      <span className="flex-1 truncate">{preset.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => handleStartEdit(preset, e)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => handleDeletePreset(preset, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {presets.length === 0 && (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No hay filtros guardados
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar filtros actuales</DialogTitle>
            <DialogDescription>
              Dale un nombre a este conjunto de filtros para poder reutilizarlo
              después.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Nombre del filtro</Label>
              <Input
                id="preset-name"
                placeholder="Ej: Productos Live en España"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePreset()
                  }
                }}
                autoFocus
              />
            </div>

            {/* Preview of current filters */}
            <div className="rounded-md border-2 border-border p-3 space-y-1 text-sm bg-muted/30">
              <div className="font-medium mb-2">Filtros actuales:</div>
              {currentFilters.searchTerm && (
                <div>• Búsqueda: "{currentFilters.searchTerm}"</div>
              )}
              {currentFilters.statusFilter && currentFilters.statusFilter !== 'all' && (
                <div>• Estado: {currentFilters.statusFilter}</div>
              )}
              {currentFilters.operatorFilter && currentFilters.operatorFilter !== 'all' && (
                <div>• Operador: {currentFilters.operatorFilter}</div>
              )}
              {currentFilters.countryFilter && currentFilters.countryFilter !== 'all' && (
                <div>• País: {currentFilters.countryFilter}</div>
              )}
              {currentFilters.yearFilter && currentFilters.yearFilter !== 'all' && (
                <div>• Año: {currentFilters.yearFilter}</div>
              )}
              {currentFilters.quarterFilter && currentFilters.quarterFilter !== 'all' && (
                <div>• Quarter: Q{currentFilters.quarterFilter}</div>
              )}
              {!Object.values(currentFilters).some(v => v && v !== 'all') && (
                <div className="text-muted-foreground">Sin filtros activos</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePreset}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
