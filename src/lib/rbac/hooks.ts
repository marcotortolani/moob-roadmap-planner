'use client'

import { useMemo, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import {
  type Role,
  type Resource,
  type Action,
  type Permission,
  can,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isAdmin,
  isUserOrHigher,
  canManageUsers,
  canDelete,
  hasPermissionGroup,
  getRoleMetadata,
} from './permissions'

/**
 * Get the current user's role
 */
export function useRole(): Role | null {
  const { user } = useAuth()
  return user?.role as Role | null
}

/**
 * Check if current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const role = useRole()
  if (!role) return false
  return hasPermission(role, permission)
}

/**
 * Check if current user can perform an action on a resource
 */
export function useCan(resource: Resource, action: Action): boolean {
  const role = useRole()
  if (!role) return false
  return can(role, resource, action)
}

/**
 * Check if current user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const role = useRole()
  if (!role) return false
  return hasAnyPermission(role, permissions)
}

/**
 * Check if current user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const role = useRole()
  if (!role) return false
  return hasAllPermissions(role, permissions)
}

/**
 * Get all permissions for current user's role
 */
export function usePermissions(): Permission[] {
  const role = useRole()
  if (!role) return []
  return getRolePermissions(role)
}

/**
 * Check if current user is admin
 */
export function useIsAdmin(): boolean {
  const role = useRole()
  if (!role) return false
  return isAdmin(role)
}

/**
 * Check if current user is user or higher (USER or ADMIN)
 */
export function useIsUserOrHigher(): boolean {
  const role = useRole()
  if (!role) return false
  return isUserOrHigher(role)
}

/**
 * Check if current user can manage other users
 */
export function useCanManageUsers(): boolean {
  const role = useRole()
  if (!role) return false
  return canManageUsers(role)
}

/**
 * Check if current user can delete a resource
 */
export function useCanDelete(resource: Resource): boolean {
  const role = useRole()
  if (!role) return false
  return canDelete(role, resource)
}

/**
 * Check if current user has a permission group
 */
export function useHasPermissionGroup(group: Permission[]): boolean {
  const role = useRole()
  if (!role) return false
  return hasPermissionGroup(role, group)
}

/**
 * Get current user's role metadata
 */
export function useRoleMetadata() {
  const role = useRole()
  if (!role) return null
  return getRoleMetadata(role)
}

/**
 * Hook that returns an object with all permission checks for easier usage
 */
export function usePermissionChecks() {
  const role = useRole()

  const canCheck = useCallback(
    (resource: Resource, action: Action) => {
      return role ? can(role, resource, action) : false
    },
    [role]
  )

  return useMemo(
    () => ({
      role,
      isAdmin: role ? isAdmin(role) : false,
      isUser: role === 'USER',
      isGuest: role === 'GUEST',
      isUserOrHigher: role ? isUserOrHigher(role) : false,

      // Products
      canViewProducts: role ? can(role, 'products', 'view') : false,
      canCreateProducts: role ? can(role, 'products', 'create') : false,
      canEditProducts: role ? can(role, 'products', 'edit') : false,
      canDeleteProducts: role ? can(role, 'products', 'delete') : false,

      // Milestones
      canViewMilestones: role ? can(role, 'milestones', 'view') : false,
      canCreateMilestones: role ? can(role, 'milestones', 'create') : false,
      canEditMilestones: role ? can(role, 'milestones', 'edit') : false,
      canDeleteMilestones: role ? can(role, 'milestones', 'delete') : false,

      // Holidays
      canViewHolidays: role ? can(role, 'holidays', 'view') : false,
      canCreateHolidays: role ? can(role, 'holidays', 'create') : false,
      canEditHolidays: role ? can(role, 'holidays', 'edit') : false,
      canDeleteHolidays: role ? can(role, 'holidays', 'delete') : false,

      // Invitations
      canViewInvitations: role ? can(role, 'invitations', 'view') : false,
      canCreateInvitations: role ? can(role, 'invitations', 'create') : false,

      // Users
      canViewUsers: role ? can(role, 'users', 'view') : false,
      canEditUsers: role ? can(role, 'users', 'edit') : false,
      canDeleteUsers: role ? can(role, 'users', 'delete') : false,
      canManageUsers: role ? canManageUsers(role) : false,

      // Dashboard & Profile
      canViewDashboard: role ? can(role, 'dashboard', 'view') : false,
      canViewProfile: role ? can(role, 'profile', 'view') : false,
      canEditProfile: role ? can(role, 'profile', 'edit') : false,

      // Generic check function
      can: canCheck,
    }),
    [role, canCheck]
  )
}
