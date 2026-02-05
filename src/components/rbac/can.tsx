'use client'

import { ReactNode } from 'react'
import { useRole } from '@/lib/rbac/hooks'
import {
  type Resource,
  type Action,
  type Permission,
  can,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '@/lib/rbac/permissions'

interface CanProps {
  children: ReactNode
  fallback?: ReactNode

  // Option 1: Check by resource and action
  resource?: Resource
  action?: Action

  // Option 2: Check by permission string
  permission?: Permission

  // Option 3: Check multiple permissions (any or all)
  anyPermission?: Permission[]
  allPermissions?: Permission[]

  // Option 4: Check by role
  role?: 'ADMIN' | 'USER' | 'GUEST'
  anyRole?: Array<'ADMIN' | 'USER' | 'GUEST'>

  // Option 5: Custom condition function
  condition?: (role: 'ADMIN' | 'USER' | 'GUEST' | null) => boolean
}

/**
 * Conditional rendering component based on user permissions
 *
 * Usage examples:
 *
 * ```tsx
 * // By resource and action
 * <Can resource="products" action="delete">
 *   <DeleteButton />
 * </Can>
 *
 * // By permission string
 * <Can permission="products:create">
 *   <CreateButton />
 * </Can>
 *
 * // By multiple permissions (any)
 * <Can anyPermission={["products:edit", "products:delete"]}>
 *   <EditOrDeleteButton />
 * </Can>
 *
 * // By multiple permissions (all)
 * <Can allPermissions={["products:view", "products:edit"]}>
 *   <ViewAndEditButton />
 * </Can>
 *
 * // By role
 * <Can role="ADMIN">
 *   <AdminPanel />
 * </Can>
 *
 * // By any role
 * <Can anyRole={["ADMIN", "USER"]}>
 *   <EditButton />
 * </Can>
 *
 * // With fallback
 * <Can resource="products" action="delete" fallback={<ViewOnlyMessage />}>
 *   <DeleteButton />
 * </Can>
 *
 * // With custom condition
 * <Can condition={(role) => role === "ADMIN" || someOtherCondition}>
 *   <SpecialFeature />
 * </Can>
 * ```
 */
export function Can({
  children,
  fallback = null,
  resource,
  action,
  permission,
  anyPermission,
  allPermissions,
  role: requiredRole,
  anyRole,
  condition,
}: CanProps) {
  const userRole = useRole()

  // If no user, deny access
  if (!userRole) {
    return <>{fallback}</>
  }

  let hasAccess = false

  // Check by custom condition
  if (condition) {
    hasAccess = condition(userRole)
  }
  // Check by resource and action
  else if (resource && action) {
    hasAccess = can(userRole, resource, action)
  }
  // Check by permission string
  else if (permission) {
    hasAccess = hasPermission(userRole, permission)
  }
  // Check by any permission
  else if (anyPermission) {
    hasAccess = hasAnyPermission(userRole, anyPermission)
  }
  // Check by all permissions
  else if (allPermissions) {
    hasAccess = hasAllPermissions(userRole, allPermissions)
  }
  // Check by exact role
  else if (requiredRole) {
    hasAccess = userRole === requiredRole
  }
  // Check by any role
  else if (anyRole) {
    hasAccess = anyRole.includes(userRole)
  }
  // No condition specified, deny by default
  else {
    console.warn('Can component: No permission check specified')
    return <>{fallback}</>
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * Shorthand component for admin-only content
 */
export function CanAdmin({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <Can role="ADMIN" fallback={fallback}>
      {children}
    </Can>
  )
}

/**
 * Shorthand component for user or higher (USER or ADMIN)
 */
export function CanUserOrHigher({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <Can anyRole={['ADMIN', 'USER']} fallback={fallback}>
      {children}
    </Can>
  )
}

/**
 * Component that renders different content based on role
 */
export function CanSwitch({
  admin,
  user,
  guest,
  fallback = null,
}: {
  admin?: ReactNode
  user?: ReactNode
  guest?: ReactNode
  fallback?: ReactNode
}) {
  const userRole = useRole()

  if (!userRole) return <>{fallback}</>

  switch (userRole) {
    case 'ADMIN':
      return <>{admin || fallback}</>
    case 'USER':
      return <>{user || fallback}</>
    case 'GUEST':
      return <>{guest || fallback}</>
    default:
      return <>{fallback}</>
  }
}
