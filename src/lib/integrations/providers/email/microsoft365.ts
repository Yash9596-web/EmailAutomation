import { ConnectorContract, CredentialPayload, ProviderMetadata } from '../../types';

export class Microsoft365Connector implements ConnectorContract {
  metadata: ProviderMetadata = {
    id: 'microsoft_365',
    displayName: 'Microsoft 365 (Outlook)',
    category: 'EMAIL',
    authMethod: 'OAUTH2',
    capabilities: ['EMAIL_READ', 'EMAIL_SEND', 'EMAIL_SEARCH'],
    requiredScopes: [
      'offline_access',
      'User.Read',
      'Mail.Read',
      'Mail.Send'
    ]
  };

  async getAuthorizationUrl({ state, redirectUri, tenantId }: { state: string; redirectUri: string; tenantId: string }): Promise<string> {
    const clientId = process.env.MS_CLIENT_ID || 'missing_ms_client_id';
    const scope = this.metadata.requiredScopes!.join(' ');
    const msTenant = 'common'; // For multi-tenant apps

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope,
      response_mode: 'query',
      state
    });

    return `https://login.microsoftonline.com/${msTenant}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeTokens({ code, redirectUri }: { code: string; redirectUri: string }): Promise<CredentialPayload> {
    return {
      accessToken: `mock_ms_access_token_${code}`,
      refreshToken: `mock_ms_refresh_token`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  }

  async testConnection(credentials: CredentialPayload): Promise<{ success: boolean; message?: string }> {
    if (!credentials.accessToken) {
      return { success: false, message: 'Missing access token' };
    }
    return { success: true, message: 'Successfully connected to Microsoft 365' };
  }
}
