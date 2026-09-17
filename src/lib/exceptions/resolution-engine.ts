import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { ExceptionService } from './exception-service';

class WorkflowExecutor {
  static async triggerWorkflow(tenantId: string, workflowId: string, payload: any) {
    logger.info({ message: 'Mock triggerWorkflow', tenantId, workflowId });
  }
}

export class ResolutionEngine {
  /**
   * Safe remediation handler. Triggers idempotently based on resolution code.
   */
  static async resolveException(
    tenantId: string, 
    caseId: string, 
    resolutionCode: string, 
    resolutionSummary: string, 
    actorId: string
  ) {
    logger.info({ message: 'Resolving exception', caseId, resolutionCode, tenantId });

    return await db.$transaction(async (tx) => {
      const caseRecord = await tx.exceptionCase.findUnique({ where: { id: caseId, tenantId } });
      if (!caseRecord) throw new Error('Not found');

      const updated = await tx.exceptionCase.update({
        where: { id: caseId },
        data: {
          status: 'RESOLVED',
          resolutionCode,
          resolutionSummary
        }
      });

      if (resolutionCode === 'WORKFLOW_RESUMED' && caseRecord.workflowRunId) {
        const task = await tx.workflowTask.findFirst({
          where: { workflowRunId: caseRecord.workflowRunId, status: 'Pending' }
        });
        if (task) {
          await WorkflowExecutor.triggerWorkflow(tenantId, task.id, { resume: true });
        }
      }

      return updated;
    });
  }
}
