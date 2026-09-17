import { eventBus } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';
import { jobQueue } from '@/lib/jobs/job-queue';

export function setupEventConsumers() {
  // 1. Workflow Execution Requested Consumer
  eventBus.subscribe('WorkflowExecutionRequested', async (event) => {
    const consumerName = 'WorkflowExecutionJobScheduler';

    // Idempotency Check
    const processed = await eventBus.isProcessed(event.eventId, consumerName);
    if (processed) return;

    try {
      const payload = event.payload as { workflowId: string; versionId: string; metadata?: any; idempotencyKey?: string };
      
      // Enqueue job to execute the workflow
      await jobQueue.enqueue(
        'workflow-execution',
        { runId: event.aggregateId, ...payload },
        {
          tenantId: event.tenantId,
          idempotencyKey: payload.idempotencyKey || `run-${event.aggregateId}`,
        }
      );

      // Mark as processed
      await eventBus.markProcessed(event.eventId, consumerName);

    } catch (error) {
      logger.error(
        { message: 'Consumer failed', module: 'events', consumer: consumerName, eventId: event.eventId },
        error instanceof Error ? error : new Error(String(error))
      );
      // Let it fail so we can potentially retry the event later
    }
  });

  // 2. Add more consumers here as needed (Audit log archival, Webhook firing, Notifications, etc.)
  
  logger.info({ message: 'Event consumers registered', module: 'events' });
}
