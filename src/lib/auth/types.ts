// ============================================================================
// Auth Types — Aligned with Prisma schema (Stage 2)
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  status: string;
}

export interface Permission {
  id: string;
  roleId: string;
  action: string;
  resource: string;
}

export interface Role {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
}
