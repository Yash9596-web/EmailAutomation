import { ConnectorContract, CredentialPayload, ProviderMetadata } from '../../types';

export class GmailConnector implements ConnectorContract {
  metadata: ProviderMetadata = {
    id: 'gmail',
    displayName: 'Google Workspace (Gmail)',
    category: 'EMAIL',
    authMethod: 'OAUTH2',
    capabilities: ['EMAIL_READ', 'EMAIL_SEND', 'EMAIL_SEARCH'],
    requiredScopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  };

  async getAuthorizationUrl({ state, redirectUri }: { state: string; redirectUri: string }): Promise<string> {
    const clientId = process.env.GMAIL_CLIENT_ID || 'missing_client_id';
    const scope = this.metadata.requiredScopes!.join(' ');
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      state,
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeTokens({ code, redirectUri }: { code: string; redirectUri: string }): Promise<CredentialPayload> {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Gmail OAuth credentials not configured on server');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to exchange Google OAuth tokens: ${err}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // might be undefined if not prompted
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  }

  async refreshToken(refreshToken: string): Promise<CredentialPayload> {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Gmail OAuth credentials not configured on server');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to refresh Google OAuth tokens: ${err}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  }

  async testConnection(credentials: CredentialPayload): Promise<{ success: boolean; message?: string }> {
    if (!credentials.accessToken) {
      return { success: false, message: 'Missing access token' };
    }
    
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`
        }
      });
      
      if (!res.ok) {
        return { success: false, message: 'Authentication failed or token expired' };
      }
      
      const profile = await res.json();
      return { success: true, message: `Successfully connected as ${profile.emailAddress}` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async executeAction(action: string, credentials: CredentialPayload, config: Record<string, any>): Promise<any> {
    if (action === 'send_email') {
      // Future implementation: actual Gmail API send
      return { id: 'msg_123', status: 'sent' };
    }
    throw new Error(`Unsupported action: ${action}`);
  }
}
