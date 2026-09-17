// ============================================================================
// RBAC — Permission checking utilities (Stage 2)
// ============================================================================

import { Role } from './types';

/**
 * Check if a set of roles grants a specific action on a specific resource.
 * Supports wildcard '*' for both action and resource.
 */
export function hasPermission(
  userRoles: Role[],
  action: string,
  resource: string
): boolean {
  for (const role of userRoles) {
    for (const permission of role.permissions) {
      if (
        (permission.action === '*' || permission.action === action) &&
        (permission.resource === '*' || permission.resource === resource)
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if any of the given roles is a system-level role.
 */
export function hasSystemRole(userRoles: Role[]): boolean {
  return userRoles.some((role) => role.isSystem);
}

/**
 * Get all unique permissions across all roles.
 */
export function collectPermissions(
  userRoles: Role[]
): Array<{ action: string; resource: string }> {
  const seen = new Set<string>();
  const result: Array<{ action: string; resource: string }> = [];

  for (const role of userRoles) {
    for (const permission of role.permissions) {
      const key = `${permission.action}:${permission.resource}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ action: permission.action, resource: permission.resource });
      }
    }
  }

  return result;
}
