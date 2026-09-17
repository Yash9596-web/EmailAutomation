// ============================================================================
// Shared Data Access Types
// ============================================================================

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

export interface PaginationParams {
  cursor?: string;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  totalCount?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TenantContext {
  tenantId: string;
}

/** Whitelist of sortable fields per entity to prevent arbitrary SQL injection */
export const ALLOWED_SORT_FIELDS: Record<string, string[]> = {
  tenant: ['name', 'slug', 'status', 'createdAt'],
  user: ['email', 'name', 'createdAt'],
  workflow: ['name', 'status', 'createdAt', 'updatedAt'],
  workflowRun: ['status', 'createdAt', 'startedAt', 'completedAt'],
  agent: ['name', 'status', 'createdAt'],
  integration: ['name', 'type', 'status', 'createdAt'],
  auditLog: ['timestamp', 'action', 'resourceType'],
  domainEvent: ['eventType', 'occurredAt'],
  jobRecord: ['queue', 'state', 'priority', 'createdAt'],
  document: ['title', 'status', 'createdAt'],
};
