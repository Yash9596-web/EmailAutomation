export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupEventConsumers } = await import('@/lib/services/event-consumer');
    const { jobWorker } = await import('@/lib/jobs/job-worker');
    const { ExecutionEngine } = await import('@/lib/engine/execution-engine');
    const { bootstrapEngine } = await import('@/lib/engine/bootstrap');
    const { bootstrapAi } = await import('@/lib/ai/bootstrap');
    const { logger } = await import('@/lib/logger');

    // Bootstrap action/trigger registries
    bootstrapEngine();
    bootstrapAi();

    // Setup event consumers
    setupEventConsumers();

    // Register job handlers
    jobWorker.registerHandler('workflow-execution', async (payload, context) => {
      logger.info({ message: 'Starting workflow execution', module: 'engine', runId: payload.runId });
      await ExecutionEngine.execute(payload.runId);
    });

    jobWorker.registerHandler('document-processing', async (payload, context) => {
      const { DocumentPipeline } = await import('@/lib/documents/pipeline');
      logger.info({ message: 'Starting document processing', module: 'documents', documentId: payload.documentId });
      await DocumentPipeline.process(payload.documentId);
    });

    jobWorker.registerHandler('webhook-delivery', async (payload, context) => {
      const { OutboundWebhookService } = await import('@/lib/integrations/webhooks/outbound-webhook');
      logger.info({ message: 'Starting outbound webhook delivery', module: 'integrations', webhookId: payload.webhookId });
      await OutboundWebhookService.deliverWebhook(payload.webhookId, payload.eventType, payload.data);
    });

    jobWorker.start();
  }
}
