'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, User as UserIcon, Plus, Edit, Trash } from 'lucide-react'
import { Skeleton } from './ui/skeleton'

interface HistoryChange {
  id: string
  change_type: 'CREATED' | 'UPDATED' | 'DELETED'
  field_name: string | null
  old_value: string | null
  new_value: string | null
  changed_at: string
  changed_by: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

interface ProductHistoryProps {
  productId: string
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  operator: 'Operador',
  country: 'País',
  language: 'Idioma',
  start_date: 'Fecha de inicio',
  end_date: 'Fecha de fin',
  status: 'Estado',
  productive_url: 'URL Productiva',
  vercel_demo_url: 'URL Demo Vercel',
  wp_content_prod_url: 'URL WP Content Prod',
  wp_content_test_url: 'URL WP Content Test',
  chatbot_url: 'URL Chatbot',
  comments: 'Comentarios',
  card_color: 'Color de tarjeta',
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Programado',
  IN_PROGRESS: 'En Proceso',
  DEMO: 'Demo',
  LIVE: 'Productivo',
}

function formatValue(fieldName: string, value: string | null): string {
  // Distinguish between null (never set) and empty string (explicitly cleared)
  if (value === null) return 'N/A'
  if (value === '') {
    // For URL fields, show a more descriptive message
    if (fieldName.includes('url')) {
      return '(sin URL)'
    }
    return '(vacío)'
  }

  // If it's a status field
  if (fieldName === 'status') {
    return STATUS_LABELS[value] || value
  }

  // If it's a date field
  if (fieldName.includes('date')) {
    try {
      return format(new Date(value), "d 'de' MMMM, yyyy", { locale: es })
    } catch {
      return value
    }
  }

  return value
}

function getChangeIcon(changeType: string) {
  switch (changeType) {
    case 'CREATED':
      return Plus
    case 'UPDATED':
      return Edit
    case 'DELETED':
      return Trash
    default:
      return Clock
  }
}

function getChangeText(change: HistoryChange): string {
  const userName =
    `${change.changed_by.first_name || ''} ${change.changed_by.last_name || ''}`.trim() ||
    'Usuario desconocido'

  switch (change.change_type) {
    case 'CREATED':
      return `${userName} creó el producto`
    case 'UPDATED':
      if (change.field_name) {
        const fieldLabel = FIELD_LABELS[change.field_name] || change.field_name
        const oldVal = formatValue(change.field_name, change.old_value)
        const newVal = formatValue(change.field_name, change.new_value)
        return `${userName} cambió ${fieldLabel} de "${oldVal}" a "${newVal}"`
      }
      return `${userName} actualizó el producto`
    case 'DELETED':
      return `${userName} eliminó el producto`
    default:
      return `${userName} realizó un cambio`
  }
}

export function ProductHistory({ productId }: ProductHistoryProps) {
  const [history, setHistory] = useState<HistoryChange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${productId}/history`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Error al cargar el historial')
        }

        setHistory(result.data || [])
      } catch (err) {
        console.error('Error fetching history:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [productId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Error al cargar el historial: {error}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No hay cambios registrados para este producto.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((change, index) => {
        const ChangeIcon = getChangeIcon(change.change_type)
        const userName =
          `${change.changed_by.first_name || ''} ${change.changed_by.last_name || ''}`.trim() ||
          'Usuario'
        const userInitials =
          `${change.changed_by.first_name?.charAt(0) || ''}${change.changed_by.last_name?.charAt(0) || ''}`.toUpperCase() ||
          'U'

        return (
          <div key={change.id} className="flex gap-3 relative">
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            {/* Avatar */}
            <div className="flex-shrink-0 relative z-10">
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage
                  src={change.changed_by.avatar_url || undefined}
                  alt={userName}
                />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start gap-2">
                <ChangeIcon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {getChangeText(change)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      // IMPORTANT: Database returns timestamp WITHOUT timezone
                      // We need to treat it as UTC and convert to local
                      const dateStr = change.changed_at.endsWith('Z')
                        ? change.changed_at
                        : change.changed_at + 'Z' // Force UTC interpretation
                      const date = parseISO(dateStr)

                      return format(
                        date,
                        "d 'de' MMMM, yyyy 'a las' HH:mm",
                        { locale: es },
                      )
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
