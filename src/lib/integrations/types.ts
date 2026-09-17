export type Capability = 
  | 'EMAIL_SEND' 
  | 'EMAIL_READ' 
  | 'EMAIL_SEARCH' 
  | 'FILE_UPLOAD' 
  | 'FILE_DOWNLOAD'
  | 'RECORD_CREATE' 
  | 'RECORD_UPDATE' 
  | 'RECORD_READ'
  | 'WEBHOOK_RECEIVE'
  | 'INVOICE_READ'
  | 'INVOICE_WRITE'
  | 'PO_READ'
  | 'PO_WRITE' | 'CUSTOMER_READ' | 'CUSTOMER_CREATE' | 'INVOICE_CREATE' | 'INVOICE_UPDATE' | 'PAYMENT_READ' | 'PAYMENT_CREATE' | 'RECORD_WRITE';

export type AuthMethod = 'OAUTH2' | 'API_KEY' | 'BASIC' | 'NONE';

export interface ProviderMetadata {
  id: string; // e.g. 'gmail', 'stripe'
  displayName: string;
  category: 'EMAIL' | 'CRM' | 'ERP' | 'PAYMENT' | 'MESSAGING' | 'CUSTOM';
  authMethod: AuthMethod;
  capabilities: Capability[];
  requiredScopes?: string[];
}

export interface ConnectorContract {
  metadata: ProviderMetadata;
  
  // Auth & Connection
  getAuthorizationUrl?(params: { state: string; redirectUri: string; tenantId: string }): Promise<string>;
  exchangeTokens?(params: { code: string; redirectUri: string }): Promise<CredentialPayload>;
  refreshToken?(token: string): Promise<CredentialPayload>;
  testConnection(credentials: CredentialPayload): Promise<{ success: boolean; message?: string }>;
  
  // Actions
  executeAction?(action: string, credentials: CredentialPayload, config: Record<string, any>): Promise<any>;
  
  // Webhooks
  handleWebhook?(payload: any, headers: Record<string, string>, secret?: string): Promise<any>;
}

export interface CredentialPayload {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  apiKey?: string;
  [key: string]: any; // Catch-all for provider-specific encrypted metadata
}

export interface ConnectionHealth {
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR' | 'REAUTH_REQUIRED';
  lastChecked: string;
  errorCategory?: string;
}
