// ============================================================================
// Audit Service — upgraded from Stage 1 log-only to database-backed
// ============================================================================

import { getRequestId, getTenantContext } from './request-context';
import { logger } from './logger';
import { AuditRepository } from './data/audit-repository';

export interface AuditEvent {
  id: string;
  tenantId?: string;
  actorType: 'USER' | 'SYSTEM' | 'AGENT';
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

export class AuditService {
  /**
   * Log an audit event. Persists to database when tenantId is available,
   * always logs to structured output for observability.
   */
  async log(
    event: Omit<AuditEvent, 'id' | 'timestamp' | 'requestId'>
  ): Promise<void> {
    const requestId = await getRequestId();
    const tenantId = event.tenantId || await getTenantContext();

    // Always emit structured log for observability pipelines
    logger.info({
      message: 'Audit Event',
      module: 'audit',
      audit: { ...event, requestId, tenantId },
    });

    // Persist to database if we have a tenant context
    if (tenantId) {
      try {
        const repo = new AuditRepository(tenantId);
        await repo.create({
          ...event,
          requestId,
        });
      } catch (error) {
        // Audit persistence failure must not crash the calling operation.
        // Log the failure but don't propagate.
        logger.error(
          { message: 'Failed to persist audit event', module: 'audit' },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }
}

export const auditService = new AuditService();
