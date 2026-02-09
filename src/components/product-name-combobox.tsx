'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProductNames, useCreateProductName } from '@/hooks/queries'

interface ProductNameComboboxProps {
  value: string
  onChange: (value: string) => void
}

export function ProductNameCombobox({
  value,
  onChange,
}: ProductNameComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const { data: productNames = [], isLoading } = useProductNames()
  const createProductName = useCreateProductName()

  // Filter product names based on search
  const filteredProductNames = React.useMemo(() => {
    if (!searchValue) return productNames

    const search = searchValue.toLowerCase().trim()
    return productNames.filter((pn) => pn.name.toLowerCase().includes(search))
  }, [productNames, searchValue])

  // Check if search value matches any existing product name (case-insensitive)
  const exactMatch = React.useMemo(() => {
    const search = searchValue.trim().toLowerCase()
    return productNames.find((pn) => pn.normalizedName === search)
  }, [productNames, searchValue])

  const showCreateOption = searchValue.trim().length > 0 && !exactMatch

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchValue('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus input when opening
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleSelect = (productName: string) => {
    onChange(productName)
    setSearchValue('')
    setIsOpen(false)
  }

  const handleCreateNew = async () => {
    if (!searchValue.trim()) return

    try {
      const newProductName = await createProductName.mutateAsync({
        name: searchValue.trim(),
      })
      onChange(newProductName.name)
      setSearchValue('')
      setIsOpen(false)
    } catch (error) {
      // Error is handled by the mutation hook (toast)
      console.error('Failed to create product name:', error)
    }
  }

  const selectedProductName = productNames.find((pn) => pn.name === value)

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between border-2 border-black bg-background px-3 py-2 text-sm shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'ring-2 ring-ring ring-offset-2',
        )}
        disabled={isLoading}
      >
        {selectedProductName ? (
          <span>{selectedProductName.name}</span>
        ) : (
          <span className="text-muted-foreground">
            Seleccionar nombre de producto...
          </span>
        )}
        {isLoading ? (
          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000] max-h-[300px] overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="flex items-center border-b-2 border-black px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar o crear nombre de producto..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showCreateOption) {
                  e.preventDefault()
                  handleCreateNew()
                }
              }}
              className="flex h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="ml-2 hover:opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1">
            {createProductName.isPending ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm">Creando nombre...</span>
              </div>
            ) : (
              <>
                {/* Create new option */}
                {showCreateOption && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors border-b-2 border-black"
                  >
                    <Plus className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      Crear nuevo:
                    </span>
                    <span>{searchValue.trim()}</span>
                  </button>
                )}

                {/* Existing product names */}
                {filteredProductNames.length > 0 ? (
                  filteredProductNames.map((productName) => (
                    <button
                      key={productName.id}
                      type="button"
                      onClick={() => handleSelect(productName.name)}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <span>{productName.name}</span>
                      {productName.name === value && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))
                ) : searchValue && !showCreateOption ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Nombre ya existe con diferente capitalización
                  </div>
                ) : (
                  !showCreateOption && (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No hay nombres de producto disponibles
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
