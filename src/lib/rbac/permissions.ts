/**
 * RBAC (Role-Based Access Control) System
 *
 * Define permissions for each role in the application
 */

// ============ TYPES ============

export type Role = 'ADMIN' | 'USER' | 'GUEST' | 'BLOCKED'

export type Resource =
  | 'products'
  | 'milestones'
  | 'holidays'
  | 'invitations'
  | 'users'
  | 'dashboard'
  | 'profile'

export type Action =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'manage' // Special: all actions

export type Permission = `${Resource}:${Action}`

// ============ PERMISSION DEFINITIONS ============

/**
 * Permissions matrix by role
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Admin: Full access to everything
  ADMIN: [
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'milestones:view',
    'milestones:create',
    'milestones:edit',
    'milestones:delete',
    'holidays:view',
    'holidays:create',
    'holidays:edit',
    'holidays:delete',
    'invitations:view',
    'invitations:create',
    'invitations:edit',
    'invitations:delete',
    'users:view',
    'users:edit',
    'users:delete',
    'dashboard:view',
    'profile:view',
    'profile:edit',
  ],

  // User: Can view and edit, but not delete (except own profile)
  USER: [
    'products:view',
    'products:create',
    'products:edit',
    'milestones:view',
    'milestones:create',
    'milestones:edit',
    'holidays:view',
    'holidays:create',
    'holidays:edit',
    'dashboard:view',
    'profile:view',
    'profile:edit',
  ],

  // Guest: Read-only access
  GUEST: [
    'products:view',
    'milestones:view',
    'holidays:view',
    'dashboard:view',
    'profile:view',
    'profile:edit', // Can edit own profile
  ],

  // Blocked: No access (empty permissions)
  BLOCKED: [],
}

// ============ UTILITY FUNCTIONS ============

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes(permission)
}

/**
 * Check if a role has permission for a resource and action
 */
export function can(role: Role, resource: Resource, action: Action): boolean {
  const permission: Permission = `${resource}:${action}`
  return hasPermission(role, permission)
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if a role can perform multiple actions on a resource
 */
export function canAll(role: Role, resource: Resource, actions: Action[]): boolean {
  return actions.every(action => can(role, resource, action))
}

/**
 * Check if a role can perform any action on a resource
 */
export function canAny(role: Role, resource: Resource, actions: Action[]): boolean {
  return actions.some(action => can(role, resource, action))
}

// ============ PERMISSION GROUPS ============

/**
 * Common permission groups for easier checks
 */
export const PERMISSION_GROUPS = {
  // Full CRUD on products
  PRODUCTS_FULL: [
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
  ] as Permission[],

  // Edit products (view + edit)
  PRODUCTS_EDIT: [
    'products:view',
    'products:create',
    'products:edit',
  ] as Permission[],

  // View only
  PRODUCTS_VIEW: ['products:view'] as Permission[],

  // Admin features
  ADMIN_FEATURES: [
    'invitations:view',
    'invitations:create',
    'users:view',
  ] as Permission[],
}

/**
 * Check if a role has a permission group
 */
export function hasPermissionGroup(role: Role, group: Permission[]): boolean {
  return hasAllPermissions(role, group)
}

// ============ ROLE UTILITIES ============

/**
 * Check if a role is admin
 */
export function isAdmin(role: Role): boolean {
  return role === 'ADMIN'
}

/**
 * Check if a role is user or higher
 */
export function isUserOrHigher(role: Role): boolean {
  return role === 'ADMIN' || role === 'USER'
}

/**
 * Check if a role can manage users (admin only)
 */
export function canManageUsers(role: Role): boolean {
  return isAdmin(role)
}

/**
 * Check if a role can delete resources (admin only)
 */
export function canDelete(role: Role, resource: Resource): boolean {
  return can(role, resource, 'delete')
}

// ============ ROLE METADATA ============

export const ROLE_METADATA = {
  ADMIN: {
    label: 'Administrador',
    description: 'Acceso completo a todas las funcionalidades',
    color: 'red',
    priority: 3,
  },
  USER: {
    label: 'Usuario',
    description: 'Puede crear y editar productos',
    color: 'blue',
    priority: 2,
  },
  GUEST: {
    label: 'Invitado',
    description: 'Solo puede ver productos',
    color: 'gray',
    priority: 1,
  },
  BLOCKED: {
    label: 'Bloqueado',
    description: 'Sin acceso a la aplicación',
    color: 'orange',
    priority: 0,
  },
} as const

/**
 * Get role metadata
 */
export function getRoleMetadata(role: Role) {
  return ROLE_METADATA[role]
}

/**
 * Compare role priority (higher number = more permissions)
 */
export function compareRoles(role1: Role, role2: Role): number {
  return ROLE_METADATA[role1].priority - ROLE_METADATA[role2].priority
}

/**
 * Check if role1 has higher or equal priority than role2
 */
export function hasHigherOrEqualRole(role1: Role, role2: Role): boolean {
  return compareRoles(role1, role2) >= 0
}
