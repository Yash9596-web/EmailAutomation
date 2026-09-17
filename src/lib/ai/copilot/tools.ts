import { OperationsAnalyticsService } from '@/lib/analytics/operations';
import db from '@/lib/db';
import { z } from 'zod';

export interface CopilotTool {
  name: string;
  description: string;
  schema: z.ZodType<any>;
  execute: (tenantId: string, args: any) => Promise<any>;
}

export const CopilotToolsRegistry: Record<string, CopilotTool> = {
  get_health_summary: {
    name: 'get_health_summary',
    description: 'Retrieves the current operational health summary, including open exceptions, failed workflows, and an overall health score.',
    schema: z.object({}),
    execute: async (tenantId) => {
      return await OperationsAnalyticsService.getHealthSummary(tenantId);
    }
  },

  get_supplier_performance: {
    name: 'get_supplier_performance',
    description: 'Retrieves performance metrics for a specific supplier, including invoice mismatch rates.',
    schema: z.object({
      supplierId: z.string().describe('The UUID of the supplier')
    }),
    execute: async (tenantId, args) => {
      return await OperationsAnalyticsService.getSupplierPerformance(tenantId, args.supplierId);
    }
  },

  get_top_exceptions: {
    name: 'get_top_exceptions',
    description: 'Retrieves the most frequent exception types and categories from the last 7 days.',
    schema: z.object({}),
    execute: async (tenantId) => {
      return await OperationsAnalyticsService.getTopExceptions(tenantId);
    }
  },

  get_exception_details: {
    name: 'get_exception_details',
    description: 'Retrieves the detailed record of a specific exception case, including priority, status, and SLA deadline.',
    schema: z.object({
      exceptionNumber: z.string().describe('The formatted exception number (e.g. EXC-1024)')
    }),
    execute: async (tenantId, args) => {
      const exc = await db.exceptionCase.findUnique({
        where: { tenantId_exceptionNumber: { tenantId, exceptionNumber: args.exceptionNumber } },
        include: { history: { take: 5, orderBy: { createdAt: 'desc' } } }
      });
      if (!exc) return { error: `Exception ${args.exceptionNumber} not found.` };
      
      return {
        exceptionNumber: exc.exceptionNumber,
        title: exc.title,
        status: exc.status,
        priority: exc.priority,
        category: exc.category,
        dueAt: exc.dueAt,
        history: exc.history.map(h => ({ action: h.action, actor: h.actorType, time: h.createdAt }))
      };
    }
  }
};
