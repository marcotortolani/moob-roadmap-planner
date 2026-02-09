'use client'

import React, { useState, useCallback, useMemo, memo } from 'react'
import {
  MapPin,
  Globe,
  MoreVertical,
  Trash2,
  Edit,
  MessageSquare,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import type { Product, Status } from '@/lib/types'
import { STATUS_OPTIONS } from '@/lib/constants'
import { COUNTRIES } from '@/lib/countries'
import { getLanguageName } from '@/lib/languages'
import { useAuth } from '@/context/auth-context'
import { usePermissionChecks } from '@/lib/rbac/hooks'
import { useDeleteProduct } from '@/hooks/queries'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from './ui/sheet'
import ProductForm from './product-form'
import { ProductDetailModal } from './product-detail-modal'

// Memoized InfoLine component
const InfoLine = memo(function InfoLine({
  icon: Icon,
  text,
  flag,
}: {
  icon: React.ElementType
  text: string | null | undefined
  flag?: string | null
}) {
  if (!text) return null
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {flag ? (
        <span className="text-lg">{flag}</span>
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span>{text}</span>
    </div>
  )
})

const getStatusBadgeVariant = (status: Status) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'inProgress' as const
    case 'DEMO':
      return 'demoOk' as const
    case 'LIVE':
      return 'live' as const
    case 'PLANNED':
    default:
      return 'planned' as const
  }
}

export const ProductCard = memo(function ProductCard({
  product,
}: {
  product: Product
}) {
  const { user } = useAuth()
  const { canEditProducts, canDeleteProducts } = usePermissionChecks()
  const deleteProductMutation = useDeleteProduct()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Memoize computed values
  const status = useMemo(
    () => STATUS_OPTIONS.find((s) => s.value === product.status),
    [product.status],
  )

  const country = useMemo(
    () => COUNTRIES.find((c) => c.code === product.country),
    [product.country],
  )

  const formattedStartDate = useMemo(
    () => format(product.startDate, 'd MMM', { locale: es }),
    [product.startDate],
  )

  const formattedEndDate = useMemo(
    () => format(product.endDate, 'd MMM, yyyy', { locale: es }),
    [product.endDate],
  )

  const languageName = useMemo(
    () => getLanguageName(product.language),
    [product.language],
  )

  // Memoize callbacks
  const handleDelete = useCallback(() => {
    deleteProductMutation.mutate(product.id)
  }, [product.id, deleteProductMutation])

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  return (
    <>
      <Card
        className="relative h-full hover:translate-x-[4px] hover:translate-y-[4px] cursor-pointer hover:shadow-[0px_0px_0px_0px_#000000] pl-2 transition-all duration-150 flex flex-col overflow-hidden "
        onClick={handleOpenModal}
      >
        <div
          className=" absolute left-0 top-0 w-4 h-full"
          style={{ backgroundColor: product.cardColor }}
        ></div>
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2 px-6 pr-2">
          <button
            className="flex-1 text-left"
            onClick={handleOpenModal}
            aria-label={`Ver detalles de ${product.name}`}
            type="button"
          >
            <CardTitle className="font-headline text-xl line-clamp-2">
              {product.name}
            </CardTitle>
            <CardDescription>
              {formattedStartDate} - {formattedEndDate}
            </CardDescription>
          </button>
          <div className="flex items-center gap-2">
            {status && (
              <Badge variant={getStatusBadgeVariant(product.status)}>
                {status.label}
              </Badge>
            )}
            {user && (canEditProducts || canDeleteProducts) && (
              <Sheet>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Opciones del producto"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-2 border-black"
                  >
                    {canEditProducts && (
                      <SheetTrigger asChild>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </SheetTrigger>
                    )}
                    {canDeleteProducts && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará
                              permanentemente el producto y todos sus datos
                              asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto border-l-3 border-black">
                  <SheetTitle className="sr-only">Editar producto</SheetTitle>
                  <SheetDescription className="sr-only">
                    Formulario para editar los detalles del producto
                  </SheetDescription>
                  <ProductForm product={product} />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </CardHeader>
        <button
          className="w-full text-left"
          onClick={handleOpenModal}
          aria-label={`Ver más información sobre ${product.name}`}
          type="button"
        >
          <CardContent className="grid gap-4 flex-1 pt-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <InfoLine icon={MapPin} text={product.operator} />
              <InfoLine
                icon={MapPin}
                text={country?.name}
                flag={country?.flag}
              />
              <InfoLine icon={Globe} text={languageName} />
            </div>

            {product.comments && (
              <div className="flex items-start gap-2 text-sm border-2 border-black p-3 mt-auto bg-neo-gray-light">
                <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="flex-1">{product.comments}</p>
              </div>
            )}
          </CardContent>
        </button>
      </Card>
      {isModalOpen && (
        <ProductDetailModal
          product={product}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
})
