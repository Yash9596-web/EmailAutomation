import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { ProviderRegistry } from './provider-registry';
import { IntegrationService } from '@/lib/services/integration-service';
import { eventBus } from '@/lib/events/event-bus';

export class SyncEngine {
  /**
   * Pushes an internal business transaction (e.g. Invoice) to an external ERP provider safely.
   */
  static async syncTransactionOutbound(
    tenantId: string, 
    internalResourceType: string, 
    internalId: string, 
    integrationId: string
  ) {
    // 1. Get Integration and verify Capabilities
    const integration = await db.integration.findFirst({ where: { id: integrationId, tenantId } });
    if (!integration) throw new Error('Integration not found');

    const connector = ProviderRegistry.get(integration.name.toLowerCase().replace(' provider', ''));
    // Note: In real scenarios, Integration table might store providerId directly, we map loosely here based on displayName
    const actualConnector = ProviderRegistry.list().find(c => c.metadata.displayName === integration.name) || ProviderRegistry.get('mock-erp');

    if (!actualConnector) throw new Error('Provider connector not registered');

    const credentials = await IntegrationService.getDecryptedCredentials(integrationId);

    if (internalResourceType === 'Invoice') {
      const invoice = await db.invoice.findFirst({ where: { id: internalId, tenantId }, include: { supplier: true, lines: true } });
      if (!invoice) throw new Error('Invoice not found');

      // Check if it already exists/synced
      const existingSync = await db.externalSyncRecord.findFirst({
        where: { tenantId, internalId, internalResourceType }
      });

      if (existingSync && existingSync.status === 'SYNCED') {
        logger.info({ message: 'Transaction already synced', internalId });
        return existingSync;
      }

      // Format payload (Idempotency mapped here)
      const payload = {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        currency: invoice.currency,
        idempotencyKey: `sync_${tenantId}_inv_${invoice.id}`,
      };

      try {
        const response = await actualConnector.executeAction!('createInvoice', credentials, payload);
        
        const externalId = response.data.externalId;

        // Upsert Sync Record
        const syncRecord = await db.$transaction(async (tx) => {
          const record = await tx.externalSyncRecord.upsert({
            where: {
              provider_externalId_tenantId: {
                provider: actualConnector.metadata.id,
                externalId,
                tenantId
              }
            },
            create: {
              tenantId,
              internalId,
              internalResourceType,
              externalId,
              provider: actualConnector.metadata.id,
              status: 'SYNCED',
              lastSyncAt: new Date(),
            },
            update: {
              status: 'SYNCED',
              lastSyncAt: new Date(),
            }
          });

          // Transition internal status to POSTED now that it's in ERP
          await tx.invoice.update({
            where: { id: internalId },
            data: { status: 'POSTED' }
          });

          return record;
        });

        // Emit success event
        await eventBus.publish({
          eventId: crypto.randomUUID(),
          eventType: 'ExternalSyncCompleted',
          aggregateType: 'ExternalSyncRecord',
          aggregateId: syncRecord.id,
          tenantId,
          version: 1,
          timestamp: new Date().toISOString(),
          payload: { internalResourceType, internalId, externalId },
        });

        return syncRecord;

      } catch (error: any) {
        logger.error({ message: 'Sync failed', error: error.message, internalId });
        
        // Record failure
        const failedRecord = await db.externalSyncRecord.create({
          data: {
            tenantId,
            internalId,
            internalResourceType,
            externalId: `failed-${Date.now()}`,
            provider: actualConnector.metadata.id,
            status: 'FAILED',
          }
        });

        throw error;
      }
    }

    throw new Error(`Sync for resource type ${internalResourceType} is not supported`);
  }
}
