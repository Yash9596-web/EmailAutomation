import { ConnectorContract } from './types';
import { logger } from '@/lib/logger';
import { GmailConnector } from './providers/email/gmail';
import { Microsoft365Connector } from './providers/email/microsoft365';
import { ErpConnectorFoundation } from './providers/erp/erp-foundation';
import { RestConnector } from './providers/rest/rest-connector';
import { SftpConnector } from './providers/storage/sftp';

class ProviderRegistryImpl {
  private connectors = new Map<string, ConnectorContract>();

  constructor() {
    this.register(new GmailConnector());
    this.register(new Microsoft365Connector());
    this.register(new ErpConnectorFoundation());
    this.register(new RestConnector());
    this.register(new SftpConnector());
  }

  register(connector: ConnectorContract): void {
    const id = connector.metadata.id;
    if (this.connectors.has(id)) {
      logger.warn({ message: `Overwriting connector for provider: ${id}`, module: 'integration' });
    }
    this.connectors.set(id, connector);
    logger.info({ message: `Connector registered: ${id}`, module: 'integration' });
  }

  get(providerId: string): ConnectorContract | undefined {
    return this.connectors.get(providerId);
  }

  list(): ConnectorContract[] {
    return Array.from(this.connectors.values());
  }

  has(providerId: string): boolean {
    return this.connectors.has(providerId);
  }
}

export const ProviderRegistry = new ProviderRegistryImpl();
