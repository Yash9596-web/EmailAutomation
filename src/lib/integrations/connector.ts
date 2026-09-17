export interface ConnectorMetadata {
  provider: string;
  category: string; // EMAIL | ERP | CRM | STORAGE | REST | WEBHOOK
  name: string;
  description: string;
  authType: 'OAUTH' | 'API_KEY' | 'BASIC' | 'CUSTOM' | 'NONE';
  capabilities: string[];
}

export interface ConnectorResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isRetryable?: boolean;
}

export abstract class BaseConnector {
  protected integrationId: string;
  protected tenantId: string;

  constructor(integrationId: string, tenantId: string) {
    this.integrationId = integrationId;
    this.tenantId = tenantId;
  }

  abstract getMetadata(): ConnectorMetadata;
  abstract getCapabilities(): string[];

  // Connection Lifecycle
  abstract connect(config: any): Promise<ConnectorResponse>;
  abstract disconnect(): Promise<ConnectorResponse>;
  abstract testConnection(): Promise<ConnectorResponse>;
  abstract healthCheck(): Promise<ConnectorResponse>;

  // Authentication
  abstract authenticate(credentials: any): Promise<ConnectorResponse>;
  abstract refreshAuthentication(): Promise<ConnectorResponse>;

  // Core Execution
  abstract validateConfiguration(config: any): Promise<ConnectorResponse>;
  abstract execute(action: string, payload: any): Promise<ConnectorResponse>;

  // Webhooks
  abstract receiveWebhook(payload: any, signature?: string): Promise<ConnectorResponse>;

  protected createResponse<T>(data: T): ConnectorResponse<T> {
    return { success: true, data };
  }

  protected createError(error: string, isRetryable: boolean = false): ConnectorResponse {
    return { success: false, error, isRetryable };
  }
}
