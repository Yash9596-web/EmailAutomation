import db from '@/lib/db';

export class MetricsService {
  /**
   * Generates a snapshot of system health, queue depths, and operational metrics.
   * This respects high-cardinality protection by only grouping on safe static enums.
   */
  static async getDashboardMetrics() {
    // 1. Workflow Executions
    const workflowStats = await db.workflowRun.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // 2. Queue / Job Records
    const jobStats = await db.jobRecord.groupBy({
      by: ['state'],
      _count: { id: true },
    });

    // 3. Integrations / Syncs
    const syncStats = await db.externalSyncRecord.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // 4. AI Usage
    const aiStats = await db.aIUsageRecord.aggregate({
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true, costEstimate: true, latencyMs: true },
      _avg: { latencyMs: true },
    });

    return {
      workflows: workflowStats,
      jobs: jobStats,
      integrations: syncStats,
      ai: {
        totalRequests: aiStats._count.id,
        totalInputTokens: aiStats._sum.inputTokens || 0,
        totalOutputTokens: aiStats._sum.outputTokens || 0,
        totalCostEstimate: aiStats._sum.costEstimate || 0,
        averageLatencyMs: aiStats._avg.latencyMs || 0,
      }
    };
  }
}
