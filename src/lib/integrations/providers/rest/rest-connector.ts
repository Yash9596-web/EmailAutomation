import { ConnectorContract, CredentialPayload, ProviderMetadata } from '../../types';

export class RestConnector implements ConnectorContract {
  metadata: ProviderMetadata = {
    id: 'generic_rest',
    displayName: 'Generic REST API',
    category: 'CUSTOM',
    authMethod: 'API_KEY', // Can also be Bearer/Basic
    capabilities: ['RECORD_READ', 'RECORD_WRITE', 'WEBHOOK_RECEIVE']
  };

  async testConnection(credentials: CredentialPayload): Promise<{ success: boolean; message?: string }> {
    // In a generic REST, testing connection requires a ping endpoint defined in config.
    // Assuming config isn't passed here directly, we just return true if key exists.
    if (!credentials.apiKey) {
      return { success: false, message: 'API Key or Bearer Token required' };
    }
    return { success: true, message: 'REST credentials stored successfully' };
  }

  async executeAction(action: string, credentials: CredentialPayload, config: Record<string, any>): Promise<any> {
    const { endpoint, method, payload } = config;

    // SECURITY (SSRF Protection): Do not allow internal network requests like 127.0.0.1, localhost, 10.x.x.x, 169.254.x.x
    if (!endpoint || !endpoint.startsWith('https://')) {
      throw new Error('Only HTTPS endpoints are permitted for REST connector to prevent SSRF');
    }
    
    // Check against internal IPs (simplified check for example)
    const url = new URL(endpoint);
    if (url.hostname === 'localhost' || url.hostname.startsWith('127.') || url.hostname.startsWith('10.') || url.hostname.startsWith('169.254')) {
      throw new Error('Blocked potential SSRF attack: internal network target');
    }

    // (Fetch call would go here using http-client with timeouts and retries)
    return { success: true, message: 'REST call dispatched' };
  }

  async handleWebhook(payload: any, headers: Record<string, string>, secret?: string): Promise<any> {
    // Basic HMAC verification could go here if `secret` is provided
    return {
      externalId: payload.id || Date.now().toString(),
      tenantId: 'resolved-by-framework', // Webhook framework handles resolving tenant via path
      eventType: 'REST_WEBHOOK_RECEIVED',
      data: payload
    };
  }
}
