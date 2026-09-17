// ============================================================================
// Tenant Repository — Top-level entity (not tenant-scoped itself)
// ============================================================================

import db from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { PaginationParams, PaginatedResult, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from './types';

export class TenantRepository {
  private readonly db = db;

  async findById(id: string) {
    const tenant = await this.db.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError(`Tenant ${id} not found`);
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.db.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundError(`Tenant with slug '${slug}' not found`);
    return tenant;
  }

  async create(data: { name: string; slug: string }) {
    return this.db.tenant.create({ data });
  }

  async update(id: string, data: { name?: string; status?: string }) {
    const existing = await this.db.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError(`Tenant ${id} not found`);

    return this.db.tenant.update({
      where: { id },
      data,
    });
  }

  async list(pagination?: PaginationParams): Promise<PaginatedResult<any>> {
    const pageSize = Math.min(
      Math.max(pagination?.pageSize ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );

    const data = await this.db.tenant.findMany({
      take: pageSize + 1,
      skip: pagination?.cursor ? 1 : 0,
      cursor: pagination?.cursor ? { id: pagination.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = data.length > pageSize;
    if (hasMore) data.pop();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
    };
  }
}
