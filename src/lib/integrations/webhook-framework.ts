import { ConnectorContract } from './types';
import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';

export class WebhookFramework {
  /**
   * Main entry point for ingesting provider webhooks.
   */
  static async ingest(
    providerId: string,
    payload: any,
    headers: Record<string, string>,
    connector: ConnectorContract
  ) {
    // 1. Authenticate/Verify Signature (handled by connector logic)
    // 2. Normalize Event
    let normalizedEvent;
    try {
      normalizedEvent = await connector.handleWebhook!(payload, headers);
    } catch (error: any) {
      logger.error({ message: 'Webhook validation failed', providerId, error: error.message });
      throw new Error(`Webhook validation failed: ${error.message}`);
    }

    if (!normalizedEvent) return; // Ignored event (e.g. ping/verification challenge)

    const { externalId, tenantId, eventType, data } = normalizedEvent;

    // 3. Replay Protection & Idempotency
    const idempotencyKey = `webhook-${providerId}-${externalId}`;
    
    // Save record to DB transactionally (prevent replay)
    try {
      await db.$transaction(async (tx) => {
        // Idempotency check
        const existing = await tx.idempotencyRecord.findFirst({ where: { key: idempotencyKey, tenantId } });
        if (existing) {
          logger.info({ message: 'Webhook duplicated (ignored)', providerId, externalId });
          return; // Already processed
        }

        await tx.idempotencyRecord.create({
          data: {
            key: idempotencyKey,
            tenantId,
            operation: 'webhook_ingest',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Retain for 7 days
          },
        });

        // 4. Dispatch Domain Event for the Engine to trigger workflows
        await eventBus.publish({
          eventId: crypto.randomUUID(),
          eventType: 'ExternalWebhookReceived',
          aggregateType: 'Integration',
          aggregateId: providerId,
          tenantId,
          version: 1,
          timestamp: new Date().toISOString(),
          payload: { providerId, eventType, data },
        });
      });
    } catch (error: any) {
      logger.error({ message: 'Webhook processing error', providerId, error: error.message });
      throw error;
    }
  }
}
