import { ConnectorContract, CredentialPayload, ProviderMetadata } from '@/lib/integrations/types';
import { logger } from '@/lib/logger';

export const MockEmailProviderMetadata: ProviderMetadata = {
  id: 'mock-email',
  displayName: 'Mock Email Provider',
  category: 'EMAIL',
  authMethod: 'OAUTH2',
  capabilities: ['EMAIL_SEND', 'EMAIL_READ'],
  requiredScopes: ['mail.send', 'mail.read'],
};

export const MockEmailConnector: ConnectorContract = {
  metadata: MockEmailProviderMetadata,

  async getAuthorizationUrl({ state, redirectUri }) {
    // Return a mock auth URL
    return `https://mock-provider.local/oauth/authorize?state=${state}&redirect_uri=${redirectUri}`;
  },

  async exchangeTokens({ code }) {
    if (code === 'invalid') throw new Error('Invalid code');
    return {
      accessToken: 'mock_access_token_123',
      refreshToken: 'mock_refresh_token_456',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  },

  async testConnection(credentials) {
    if (credentials.accessToken === 'mock_access_token_123') {
      return { success: true, message: 'Connected to mock email server' };
    }
    return { success: false, message: 'Invalid token' };
  },

  async executeAction(action, credentials, config) {
    logger.info({ message: `Executing ${action}`, config, provider: 'mock-email' });

    if (action === 'sendEmail') {
      if (!config.to || !config.subject) throw new Error('Missing required fields: to, subject');
      return {
        success: true,
        data: { messageId: 'mock-msg-' + Date.now(), to: config.to, subject: config.subject },
      };
    }

    throw new Error(`Unsupported action: ${action}`);
  },
};
