import { ConnectorContract, ProviderMetadata } from '@/lib/integrations/types';
import { logger } from '@/lib/logger';

export const MockErpProviderMetadata: ProviderMetadata = {
  id: 'mock-erp',
  displayName: 'Mock ERP Provider',
  category: 'ERP',
  authMethod: 'API_KEY',
  capabilities: ['INVOICE_READ', 'INVOICE_WRITE'],
};

export const MockErpConnector: ConnectorContract = {
  metadata: MockErpProviderMetadata,

  async testConnection(credentials) {
    if (credentials.apiKey === 'valid-erp-key') {
      return { success: true, message: 'Connected to Mock ERP' };
    }
    return { success: false, message: 'Invalid ERP API Key' };
  },

  async executeAction(action, credentials, config) {
    logger.info({ message: `Executing ERP ${action}`, config, provider: 'mock-erp' });

    if (action === 'createInvoice') {
      const { invoiceNumber, totalAmount } = config;
      // Simulate external ID generation and success response
      const externalId = `erp-inv-${invoiceNumber}-${Date.now()}`;
      return {
        success: true,
        data: {
          externalId,
          status: 'posted',
          totalAmount,
        },
      };
    }

    if (action === 'getInvoice') {
      const { externalId } = config;
      return {
        success: true,
        data: {
          externalId,
          status: 'posted',
        }
      }
    }

    throw new Error(`Unsupported action: ${action}`);
  },
};
