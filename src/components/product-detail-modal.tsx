// src/components/product-detail-modal.tsx

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Product, User, Status } from '@/lib/types'
import { STATUS_OPTIONS, MILESTONE_STATUS_OPTIONS } from '@/lib/constants'
import { COUNTRIES } from '@/lib/countries'
import { getLanguageName } from '@/lib/languages'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Smartphone,
  Globe,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle,
  Circle,
  Clock,
  Copy,
  Edit,
  FilePlus,
  Trash2,
} from 'lucide-react'
import { Button } from './ui/button'
import { useToast } from '@/hooks/use-toast'

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from './ui/sheet'
import ProductForm from './product-form'

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { usePermissionChecks } from '@/lib/rbac/hooks'
import { useDeleteProduct, useUpdateProduct } from '@/hooks/queries'
import { ProductHistory } from './product-history'

const getMilestoneStatusInfo = (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
  const statusOption = MILESTONE_STATUS_OPTIONS.find((s) => s.value === status)
  switch (status) {
    case 'COMPLETED':
      return {
        Icon: CheckCircle,
        color: 'text-green-500',
        label: statusOption?.label || 'Completado',
      }
    case 'IN_PROGRESS':
      return {
        Icon: Circle,
        color: 'text-blue-500',
        label: statusOption?.label || 'En progreso',
      }
    case 'PENDING':
    default:
      return {
        Icon: Clock,
        color: 'text-gray-500',
        label: statusOption?.label || 'Programado',
      }
  }
}

function InfoSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  isLink = false,
  flag,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
  isLink?: boolean
  flag?: string | null
}) {
  const { toast } = useToast()
  if (!value) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    toast({
      title: 'Copiado!',
      description: 'El enlace ha sido copiado al portapapeles.',
    })
  }

  return (
    <div className="flex items-start gap-3 text-sm group">
      <div className="w-4 flex-shrink-0 mt-1 flex items-center text-muted-foreground">
        {flag ? (
          <span className="text-lg">{flag}</span>
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        {isLink ? (
          <div className="flex items-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {value}
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground break-words">{value}</p>
        )}
      </div>
    </div>
  )
}

function AuditInfoItem({
  icon: Icon,
  label,
  user,
  date,
}: {
  icon: React.ElementType
  label: string
  user?: User | null
  date?: Date | null
}) {
  if (!user || !date) return null
  return (
    <div className="flex items-start gap-3 text-sm group">
      <div className="w-4 flex-shrink-0 mt-1 flex items-center text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{user.name}</span>
          <span>•</span>
          <span>
            {format(date, "d MMM, yyyy 'a las' HH:mm", { locale: es })}
          </span>
        </div>
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
  },
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: {
  product: Product
  isOpen: boolean
  onClose: () => void
}) {
  const { canEditProducts, canDeleteProducts } = usePermissionChecks()
  const deleteProductMutation = useDeleteProduct()
  const updateProductMutation = useUpdateProduct()
  const { toast } = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const status = STATUS_OPTIONS.find((s) => s.value === product.status)
  const country = COUNTRIES.find((c) => c.code === product.country)

  const handleDelete = async () => {
    try {
      await deleteProductMutation.mutateAsync(product.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleStatusChange = async (newStatus: Status) => {
    try {
      await updateProductMutation.mutateAsync({
        ...product,
        status: newStatus,
      })
      toast({
        title: 'Estado actualizado',
        description: `El estado del producto ha sido cambiado a ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del producto',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="2xl:max-w-5xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <motion.div
          className="p-6"
          style={{ borderLeft: `18px solid ${product.cardColor}` }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <div className=" flex items-start justify-between">
              <div className="">
                <DialogTitle className="text-left font-medium text-xl md:text-2xl font-headline text-foreground">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="text-left font-light">
                  Detalles completos del producto
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {canEditProducts ? (
                  <Select
                    value={product.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger
                      className="w-auto h-auto text-xs md:text-sm border-2 border-black px-3 md:py-1.5 lg:py-2 md:mr-4 lg:mr-6 xl:mr-8 2xl:mr-10 font-bold uppercase"
                      style={{
                        borderRadius: '4px',
                        backgroundColor:
                          product.status === 'PLANNED'
                            ? '#6B7280'
                            : product.status === 'IN_PROGRESS'
                              ? '#FF2E63'
                              : product.status === 'DEMO'
                                ? '#FFD700'
                                : product.status === 'LIVE'
                                  ? '#2EBD59'
                                  : '#6B7280',
                        color:
                          product.status === 'DEMO' ? '#000000' : '#FFFFFF',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className=" text-black"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  status && (
                    <Badge
                      variant={
                        product.status === 'PLANNED'
                          ? 'planned'
                          : product.status === 'IN_PROGRESS'
                            ? 'inProgress'
                            : product.status === 'DEMO'
                              ? 'demoOk'
                              : product.status === 'LIVE'
                                ? 'live'
                                : 'planned'
                      }
                      className="text-xs md:text-sm md:mr-4 lg:mr-6 xl:mr-8"
                    >
                      {status.label}
                    </Badge>
                  )
                )}
                {canEditProducts && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                      <SheetTitle className="sr-only">
                        Editar producto
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Formulario para editar los detalles del producto
                      </SheetDescription>
                      <ProductForm product={product} />
                    </SheetContent>
                  </Sheet>
                )}
                {canDeleteProducts && (
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <motion.div
            className="grid gap-6 py-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={itemVariants}>
              <InfoSection title="Información General">
                <div className="border-2 border-black p-4 bg-neo-gray-light space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem
                      icon={Smartphone}
                      label="Operador"
                      value={product.operator}
                    />
                    <InfoItem
                      icon={Globe}
                      label="País"
                      value={country?.name}
                      flag={country?.flag}
                    />
                    <InfoItem
                      icon={Globe}
                      label="Idioma"
                      value={getLanguageName(product.language)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem
                      icon={Calendar}
                      label="Fecha de Inicio"
                      value={format(product.startDate, "d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Fecha de Fin"
                      value={format(product.endDate, "d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    />
                  </div>
                </div>
              </InfoSection>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Separator className="bg-black" style={{ height: '2px' }} />
            </motion.div>

            {product.milestones && product.milestones.length > 0 && (
              <>
                <motion.div variants={itemVariants}>
                  <InfoSection title="Hitos Clave">
                    <div className="space-y-4">
                      {product.milestones.map((milestone) => {
                        const statusInfo = getMilestoneStatusInfo(
                          milestone.status,
                        )
                        return (
                          <div
                            key={milestone.id}
                            className="flex items-start gap-4 border-2 border-black p-3 bg-neo-gray-light"
                          >
                            <statusInfo.Icon
                              className={`h-6 w-6 mt-1 flex-shrink-0 ${statusInfo.color}`}
                            />
                            <div className="flex-1">
                              <p className="font-semibold">{milestone.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(milestone.startDate, 'dd MMM', {
                                  locale: es,
                                })}{' '}
                                -{' '}
                                {format(milestone.endDate, 'dd MMM yyyy', {
                                  locale: es,
                                })}
                              </p>
                            </div>
                            <Badge variant="default">{statusInfo.label}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </InfoSection>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Separator className="bg-black" style={{ height: '2px' }} />
                </motion.div>
              </>
            )}

            <motion.div variants={itemVariants}>
              <InfoSection title="URLs">
                <div className="border-2 border-black p-4 bg-neo-gray-light">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem
                      icon={LinkIcon}
                      label="URL Productiva"
                      value={product.productiveUrl}
                      isLink
                    />
                    <InfoItem
                      icon={LinkIcon}
                      label="URL Demo Vercel"
                      value={product.vercelDemoUrl}
                      isLink
                    />
                    <InfoItem
                      icon={LinkIcon}
                      label="URL Content Prod (WP)"
                      value={product.wpContentProdUrl}
                      isLink
                    />
                    <InfoItem
                      icon={LinkIcon}
                      label="URL Content Test (WP)"
                      value={product.wpContentTestUrl}
                      isLink
                    />
                    <InfoItem
                      icon={LinkIcon}
                      label="URL Chatbot"
                      value={product.chatbotUrl}
                      isLink
                    />
                    {product.customUrls?.map((customUrl) => (
                      <InfoItem
                        key={customUrl.id}
                        icon={FilePlus}
                        label={customUrl.label}
                        value={customUrl.url}
                        isLink
                      />
                    ))}
                  </div>
                </div>
              </InfoSection>
            </motion.div>

            {(product.createdBy || product.updatedBy) && (
              <motion.div variants={itemVariants}>
                <Separator className="bg-black" style={{ height: '2px' }} />
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <InfoSection title="Historial de Cambios">
                <ProductHistory productId={product.id} />
              </InfoSection>
            </motion.div>

            {product.comments && (
              <>
                <motion.div variants={itemVariants}>
                  <Separator className="bg-black" style={{ height: '2px' }} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <InfoSection title="Comentarios">
                    <div className="flex items-start gap-3 text-sm text-muted-foreground p-4 border-2 border-black bg-neo-gray-light">
                      <MessageSquare className="h-4 w-4 flex-shrink-0 mt-1" />
                      <p className="flex-1 whitespace-pre-wrap">
                        {product.comments}
                      </p>
                    </div>
                  </InfoSection>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              producto &quot;{product.name}&quot; y todos sus hitos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending
                ? 'Eliminando...'
                : 'Eliminar Producto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
