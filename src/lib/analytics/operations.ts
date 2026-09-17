import db from '@/lib/db';
import { AuthorizationService } from '@/lib/auth/authorization';

export class OperationsAnalyticsService {
  /**
   * Retrieves operational health summary for a tenant.
   */
  static async getHealthSummary(tenantId: string) {
    if (!tenantId) throw new Error('Tenant context is required for analytics');
    await AuthorizationService.authorize('analytics', 'read');

    const [openExceptions, criticalExceptions, failedWorkflows] = await Promise.all([
      db.exceptionCase.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS', 'ASSIGNED'] } } }),
      db.exceptionCase.count({ where: { tenantId, priority: 'CRITICAL', status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      db.workflowRun.count({ where: { tenantId, status: 'Failed', createdAt: { gte: new Date(Date.now() - 24*60*60*1000) } } })
    ]);

    // Derived operational health score (mock logic for Stage 22)
    const baseScore = 100;
    const penalty = (criticalExceptions * 5) + (failedWorkflows * 2) + (openExceptions * 0.5);
    const healthScore = Math.max(0, baseScore - penalty);

    return {
      openExceptions,
      criticalExceptions,
      failedWorkflows24h: failedWorkflows,
      healthScore,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Evaluates Supplier Performance (Invoice mismatch rate)
   */
  static async getSupplierPerformance(tenantId: string, supplierId: string) {
    if (!tenantId) throw new Error('Tenant context is required for analytics');
    await AuthorizationService.authorize('analytics', 'read');

    const [totalInvoices, mismatchExceptions] = await Promise.all([
      db.invoice.count({ where: { tenantId, supplierId } }),
      db.exceptionCase.count({ 
        where: { 
          tenantId, 
          sourceType: 'TRANSACTION', 
          type: 'invoice_mismatch',
          metadata: { path: ['supplierId'], equals: supplierId } // JSON filtering
        } 
      })
    ]);

    const mismatchRate = totalInvoices > 0 ? (mismatchExceptions / totalInvoices) * 100 : 0;

    return {
      supplierId,
      totalInvoices,
      mismatchExceptions,
      mismatchRate: Number(mismatchRate.toFixed(2)),
      status: mismatchRate > 15 ? 'POOR' : mismatchRate > 5 ? 'FAIR' : 'GOOD'
    };
  }

  /**
   * Identifies highest occurring exceptions
   */
  static async getTopExceptions(tenantId: string) {
    if (!tenantId) throw new Error('Tenant context is required for analytics');
    await AuthorizationService.authorize('analytics', 'read');

    const groups = await db.exceptionCase.groupBy({
      by: ['category', 'type'],
      where: { tenantId, createdAt: { gte: new Date(Date.now() - 7*24*60*60*1000) } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    return groups.map(g => ({
      category: g.category,
      type: g.type,
      count: g._count.id
    }));
  }
}
