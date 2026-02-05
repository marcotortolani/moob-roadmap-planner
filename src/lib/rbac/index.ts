/**
 * RBAC (Role-Based Access Control) Module
 *
 * Export all RBAC functionality from a single entry point
 */

// Permissions
export {
  type Role,
  type Resource,
  type Action,
  type Permission,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_METADATA,
  hasPermission,
  can,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAll,
  canAny,
  hasPermissionGroup,
  isAdmin,
  isUserOrHigher,
  canManageUsers,
  canDelete,
  getRoleMetadata,
  compareRoles,
  hasHigherOrEqualRole,
} from './permissions'

// Hooks
export {
  useRole,
  usePermission,
  useCan,
  useHasAnyPermission,
  useHasAllPermissions,
  usePermissions as useAllPermissions,
  useIsAdmin,
  useIsUserOrHigher,
  useCanManageUsers,
  useCanDelete,
  useHasPermissionGroup,
  useRoleMetadata,
  usePermissions,
} from './hooks'

// Components (re-export from components folder)
export { Can, CanAdmin, CanUserOrHigher, CanSwitch } from '@/components/rbac/can'
