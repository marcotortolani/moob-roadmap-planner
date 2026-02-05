/**
 * RBAC Usage Examples
 *
 * This file demonstrates how to use the RBAC system in different scenarios
 */

'use client'

import { Button } from '@/components/ui/button'
import { Trash2, Edit, Plus, Eye } from 'lucide-react'
import { Can, CanAdmin, CanUserOrHigher, CanSwitch } from './can'
import { usePermissions } from '@/lib/rbac/hooks'
import { RoleBadge } from './role-badge'

/**
 * Example 1: Simple action-based permissions
 */
export function ProductActionsExample() {
  return (
    <div className="flex gap-2">
      {/* Show view button to everyone */}
      <Can resource="products" action="view">
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Ver
        </Button>
      </Can>

      {/* Show edit button only to users who can edit */}
      <Can resource="products" action="edit">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </Can>

      {/* Show delete button only to users who can delete (admins) */}
      <Can resource="products" action="delete">
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </Can>
    </div>
  )
}

/**
 * Example 2: Using permission strings
 */
export function CreateProductExample() {
  return (
    <Can permission="products:create">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Producto
      </Button>
    </Can>
  )
}

/**
 * Example 3: Admin-only features
 */
export function AdminPanelExample() {
  return (
    <CanAdmin fallback={<p>No tienes acceso a esta sección</p>}>
      <div className="p-4 border rounded-lg">
        <h2 className="font-bold">Panel de Administración</h2>
        <p>Solo los administradores pueden ver esto</p>
      </div>
    </CanAdmin>
  )
}

/**
 * Example 4: User or Admin (exclude Guests)
 */
export function EditFeaturesExample() {
  return (
    <CanUserOrHigher>
      <div className="space-y-2">
        <p>Puedes editar contenido</p>
        <Button>Editar</Button>
      </div>
    </CanUserOrHigher>
  )
}

/**
 * Example 5: Multiple permissions (any)
 */
export function EditOrDeleteExample() {
  return (
    <Can anyPermission={['products:edit', 'products:delete']}>
      <Button variant="outline">Gestionar Producto</Button>
    </Can>
  )
}

/**
 * Example 6: Multiple permissions (all)
 */
export function FullAccessExample() {
  return (
    <Can allPermissions={['products:view', 'products:edit', 'products:delete']}>
      <p>Tienes acceso completo a productos</p>
    </Can>
  )
}

/**
 * Example 7: Role-based rendering with CanSwitch
 */
export function RoleBasedMessageExample() {
  return (
    <CanSwitch
      admin={<p className="text-red-600">Eres administrador</p>}
      user={<p className="text-blue-600">Eres usuario</p>}
      guest={<p className="text-gray-600">Eres invitado</p>}
      fallback={<p>No autenticado</p>}
    />
  )
}

/**
 * Example 8: Using the usePermissions hook
 */
export function PermissionsHookExample() {
  const perms = usePermissions()

  return (
    <div className="space-y-2">
      <RoleBadge />

      <div className="text-sm">
        <p>Rol: {perms.role}</p>
        <p>¿Es admin?: {perms.isAdmin ? 'Sí' : 'No'}</p>
        <p>¿Puede crear productos?: {perms.canCreateProducts ? 'Sí' : 'No'}</p>
        <p>¿Puede eliminar productos?: {perms.canDeleteProducts ? 'Sí' : 'No'}</p>
        <p>¿Puede gestionar usuarios?: {perms.canManageUsers ? 'Sí' : 'No'}</p>
      </div>

      {/* Render buttons based on permissions */}
      <div className="flex gap-2">
        {perms.canCreateProducts && (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Crear
          </Button>
        )}
        {perms.canEditProducts && (
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        {perms.canDeleteProducts && (
          <Button size="sm" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Example 9: Custom condition
 */
export function CustomConditionExample() {
  return (
    <Can condition={(role) => role === 'ADMIN' || role === 'USER'}>
      <p>Solo admins y usuarios</p>
    </Can>
  )
}

/**
 * Example 10: With fallback
 */
export function FallbackExample() {
  return (
    <Can
      resource="products"
      action="delete"
      fallback={
        <Button variant="outline" disabled>
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar (No autorizado)
        </Button>
      }
    >
      <Button variant="destructive">
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar
      </Button>
    </Can>
  )
}

/**
 * Complete example combining multiple patterns
 */
export function CompleteProductCardExample() {
  const perms = usePermissions()

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold">Mi Producto</h3>
          <p className="text-sm text-muted-foreground">Descripción del producto</p>
        </div>
        <RoleBadge />
      </div>

      {/* Actions based on permissions */}
      <div className="flex gap-2">
        {/* Everyone can view */}
        <Can resource="products" action="view">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalles
          </Button>
        </Can>

        {/* Only users and admins can edit */}
        {perms.canEditProducts && (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}

        {/* Only admins can delete */}
        <CanAdmin>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </CanAdmin>
      </div>

      {/* Role-specific messages */}
      <CanSwitch
        admin={
          <div className="text-sm text-red-600">
            Como admin, puedes editar y eliminar este producto
          </div>
        }
        user={
          <div className="text-sm text-blue-600">
            Como usuario, puedes editar pero no eliminar este producto
          </div>
        }
        guest={
          <div className="text-sm text-gray-600">
            Como invitado, solo puedes ver este producto
          </div>
        }
      />
    </div>
  )
}
