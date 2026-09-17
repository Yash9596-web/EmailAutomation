// ============================================================================
// Tenant Types — Aligned with Prisma schema (Stage 2)
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'Active' | 'Suspended';
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  roleId?: string;
  status: 'Active' | 'Suspended' | 'Invited';
}
