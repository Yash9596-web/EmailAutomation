// ============================================================================
// Base Repository — Tenant-scoped data access foundation
// ============================================================================

import db from '@/lib/db';
import { ValidationError } from '@/lib/errors';
import {
  PaginationParams,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  ALLOWED_SORT_FIELDS,
} from './types';

export abstract class BaseRepository {
  protected readonly tenantId: string;
  protected readonly db = db;

  constructor(tenantId: string) {
    if (!tenantId) {
      throw new ValidationError('tenantId is required for data access');
    }
    this.tenantId = tenantId;
  }

  /**
   * Clamp pagination params to safe bounds.
   * Returns { take, cursor } ready for Prisma.
   */
  protected enforcePagination(params?: PaginationParams): {
    take: number;
    skip: number;
    cursor: { id: string } | undefined;
  } {
    const pageSize = Math.min(
      Math.max(params?.pageSize ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );

    return {
      take: pageSize,
      // When using cursor pagination, skip 1 to exclude the cursor record itself
      skip: params?.cursor ? 1 : 0,
      cursor: params?.cursor ? { id: params.cursor } : undefined,
    };
  }

  /**
   * Validate that a sort field is allowed for the given entity.
   * Prevents arbitrary column name injection.
   */
  protected validateSortField(entityName: string, field: string): void {
    const allowed = ALLOWED_SORT_FIELDS[entityName];
    if (!allowed || !allowed.includes(field)) {
      throw new ValidationError(
        `Invalid sort field '${field}' for entity '${entityName}'. Allowed: ${(allowed || []).join(', ')}`
      );
    }
  }
}
