// ============================================================================
// Workflow Repository — Tenant-scoped workflow data access
// ============================================================================

import { BaseRepository } from './base-repository';
import { PaginationParams, PaginatedResult } from './types';
import { NotFoundError, ValidationError } from '@/lib/errors';

const VALID_WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  Draft: ['Published', 'Archived'],
  Published: ['Paused', 'Archived'],
  Paused: ['Published', 'Archived'],
  Archived: [], // Terminal state
};

export class WorkflowRepository extends BaseRepository {
  async findById(id: string) {
    const workflow = await this.db.workflow.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!workflow) throw new NotFoundError(`Workflow ${id} not found`);
    return workflow;
  }

  async list(pagination?: PaginationParams): Promise<PaginatedResult<any>> {
    const { take, skip, cursor } = this.enforcePagination(pagination);

    const where = { tenantId: this.tenantId };
    const data = await this.db.workflow.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: take + 1,
      skip,
      cursor,
    });

    const hasMore = data.length > take;
    if (hasMore) data.pop();

    return { data, nextCursor: hasMore ? data[data.length - 1]?.id : undefined };
  }

  async create(data: { name: string; description?: string }) {
    return this.db.workflow.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        description: data.description,
      },
    });
  }

  /**
   * Update workflow with state transition validation and optimistic concurrency.
   */
  async update(
    id: string,
    data: { name?: string; description?: string; status?: string },
    expectedVersion?: number
  ) {
    const existing = await this.db.workflow.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!existing) throw new NotFoundError(`Workflow ${id} not found`);

    // Optimistic concurrency check
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new ValidationError(
        `Conflict: workflow was modified (expected version ${expectedVersion}, got ${existing.version})`
      );
    }

    // State transition validation
    if (data.status && data.status !== existing.status) {
      const allowed = VALID_WORKFLOW_TRANSITIONS[existing.status];
      if (!allowed || !allowed.includes(data.status)) {
        throw new ValidationError(
          `Invalid state transition: ${existing.status} → ${data.status}`
        );
      }
    }

    return this.db.workflow.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Create an immutable workflow version.
   */
  async createVersion(workflowId: string, data: { version: number; definition: any }) {
    // Verify workflow belongs to this tenant
    const workflow = await this.db.workflow.findFirst({
      where: { id: workflowId, tenantId: this.tenantId },
    });
    if (!workflow) throw new NotFoundError(`Workflow ${workflowId} not found`);

    return this.db.workflowVersion.create({
      data: {
        workflowId,
        version: data.version,
        definition: data.definition,
      },
    });
  }

  /**
   * Create a workflow run for a specific version.
   */
  async createRun(workflowVersionId: string) {
    // Verify the version belongs to a workflow in this tenant
    const version = await this.db.workflowVersion.findUnique({
      where: { id: workflowVersionId },
      include: { workflow: true },
    });
    if (!version || version.workflow.tenantId !== this.tenantId) {
      throw new NotFoundError(`WorkflowVersion ${workflowVersionId} not found`);
    }

    return this.db.workflowRun.create({
      data: {
        workflowVersionId,
        tenantId: this.tenantId,
      },
    });
  }
}
