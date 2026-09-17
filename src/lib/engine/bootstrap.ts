// ============================================================================
// Engine Bootstrap — Registers all built-in actions and triggers
// ============================================================================

import { ActionRegistry } from './action-registry';
import { TriggerRegistry } from './trigger-registry';
import { LogAction, HttpRequestAction, TransformDataAction, SendNotificationAction } from './actions/built-in';
import { ManualTrigger, EventTrigger, ScheduledTrigger } from './triggers/built-in';
import { CreateTransactionAction } from './actions/transaction-actions';
import { ConnectorAction } from '@/lib/integrations/connector-action';
import { ProviderRegistry } from '@/lib/integrations/provider-registry';
import { MockEmailConnector } from '@/lib/integrations/providers/email/mock';
import { MockErpConnector } from '@/lib/integrations/providers/erp/mock-erp';
import { SyncTransactionAction } from './actions/sync-actions';
import { AiDetectAnomalyAction, AiSummarizeAction, AiClassifyAction } from './actions/ai-actions';
import { logger } from '@/lib/logger';

export function bootstrapEngine() {
  // Register built-in actions
  ActionRegistry.register(LogAction);
  ActionRegistry.register(HttpRequestAction);
  ActionRegistry.register(TransformDataAction);
  ActionRegistry.register(SendNotificationAction);
  ActionRegistry.register(ConnectorAction);
  ActionRegistry.register(CreateTransactionAction);
  ActionRegistry.register(SyncTransactionAction);
  ActionRegistry.register(AiDetectAnomalyAction);
  ActionRegistry.register(AiSummarizeAction);
  ActionRegistry.register(AiClassifyAction);

  // Register built-in triggers
  TriggerRegistry.register(ManualTrigger);
  TriggerRegistry.register(EventTrigger);
  TriggerRegistry.register(ScheduledTrigger);

  // Register Integration Providers
  ProviderRegistry.register(MockEmailConnector);
  ProviderRegistry.register(MockErpConnector);

  logger.info({
    message: `Engine bootstrapped: ${ActionRegistry.listTypes().length} actions, ${TriggerRegistry.listTypes().length} triggers`,
    module: 'engine',
  });
}
