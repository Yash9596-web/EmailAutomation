import { ActionHandler, ExecutionContext, StepResult } from '@/lib/engine/types';
import { SyncEngine } from '@/lib/integrations/sync-engine';

export const SyncTransactionAction: ActionHandler = {
  type: 'SYNC_EXTERNAL_SYSTEM',
  
  validate(config) {
    const errors = [];
    if (!config.internalResourceType) errors.push('Requires internalResourceType');
    if (!config.internalId) errors.push('Requires internalId');
    if (!config.integrationId) errors.push('Requires integrationId');
    return { valid: errors.length === 0, errors };
  },

  async execute(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult> {
    const internalResourceType = config.internalResourceType as string;
    const internalId = config.internalId as string;
    const integrationId = config.integrationId as string;

    try {
      const syncRecord = await SyncEngine.syncTransactionOutbound(
        context.tenantId,
        internalResourceType,
        internalId,
        integrationId
      );

      return {
        status: 'success',
        data: { syncRecordId: syncRecord.id, status: syncRecord.status, externalId: syncRecord.externalId },
      };
    } catch (error: any) {
      // The SyncEngine throws specific normalizations or raw errors. We catch and report as failure.
      return { status: 'failure', error: error.message };
    }
  },
};
