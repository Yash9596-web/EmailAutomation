import { ActionHandler, ExecutionContext, StepResult } from '@/lib/engine/types';
import { ProviderRegistry } from './provider-registry';
import { IntegrationService } from '@/lib/services/integration-service';

export const ConnectorAction: ActionHandler = {
  type: 'CONNECTOR_ACTION',
  
  validate(config) {
    const errors = [];
    if (!config.integrationId) errors.push('Requires integrationId');
    if (!config.providerId) errors.push('Requires providerId');
    if (!config.action) errors.push('Requires action name');
    
    return { valid: errors.length === 0, errors };
  },

  async execute(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult> {
    const providerId = config.providerId as string;
    const integrationId = config.integrationId as string;
    const actionName = config.action as string;

    // 1. Resolve Provider
    const connector = ProviderRegistry.get(providerId);
    if (!connector || !connector.executeAction) {
      return { status: 'failure', error: `Connector ${providerId} not found or has no actions`, errorCategory: 'CONFIGURATION_ERROR' };
    }

    try {
      // 2. Fetch securely decrypted credentials
      const credentials = await IntegrationService.getDecryptedCredentials(integrationId);
      
      // 3. Optional: Map workflow variables to connector payload
      const actionPayload = config.payload as Record<string, unknown> || {};

      // 4. Execute Action
      const result = await connector.executeAction(actionName, credentials, actionPayload);

      return {
        status: 'success',
        data: result,
      };
    } catch (error: any) {
      // The HTTP client inside the connector normalizes these errors natively
      const errorStr = error.message || 'Unknown provider error';
      
      let category: any = 'PROVIDER_ERROR';
      if (errorStr.includes('AUTHENTICATION_FAILED')) category = 'AUTHENTICATION_FAILED';
      if (errorStr.includes('AUTHORIZATION_FAILED')) category = 'AUTHORIZATION_FAILED';
      if (errorStr.includes('RATE_LIMITED')) category = 'RATE_LIMITED';
      if (errorStr.includes('TIMEOUT')) category = 'TIMEOUT';
      if (errorStr.includes('NETWORK_ERROR')) category = 'NETWORK_ERROR';
      
      return { status: 'failure', error: errorStr, errorCategory: category };
    }
  },
};
