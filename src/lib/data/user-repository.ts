// ============================================================================
// User Repository — Identity management with tenant membership queries
// ============================================================================

import db from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { PaginationParams, PaginatedResult, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from './types';

export class UserRepository {
  private readonly db = db;

  async findById(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; name: string; passwordHash?: string }) {
    return this.db.user.create({ data });
  }

  async update(id: string, data: { name?: string; status?: string; passwordHash?: string }) {
    const existing = await this.db.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError(`User ${id} not found`);

    return this.db.user.update({ where: { id }, data });
  }

  /**
   * List users belonging to a specific tenant via the Membership join.
   * This is tenant-scoped by design.
   */
  async listByTenant(
    tenantId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<any>> {
    const pageSize = Math.min(
      Math.max(pagination?.pageSize ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );

    const memberships = await this.db.membership.findMany({
      where: { tenantId, status: 'Active' },
      include: { user: true },
      take: pageSize + 1,
      skip: pagination?.cursor ? 1 : 0,
      cursor: pagination?.cursor ? { id: pagination.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = memberships.length > pageSize;
    if (hasMore) memberships.pop();

    return {
      data: memberships.map((m) => ({ ...m.user, membershipId: m.id, role: m.roleId })),
      nextCursor: hasMore ? memberships[memberships.length - 1]?.id : undefined,
    };
  }
}
