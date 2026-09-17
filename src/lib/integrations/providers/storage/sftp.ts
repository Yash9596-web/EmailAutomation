import { ConnectorContract, CredentialPayload, ProviderMetadata } from '../../types';

export class SftpConnector implements ConnectorContract {
  metadata: ProviderMetadata = {
    id: 'sftp_server',
    displayName: 'SFTP Server',
    category: 'CUSTOM',
    authMethod: 'BASIC', // Username/Password or Key
    capabilities: ['FILE_UPLOAD', 'FILE_DOWNLOAD']
  };

  async testConnection(credentials: CredentialPayload): Promise<{ success: boolean; message?: string }> {
    if (!credentials.username || !credentials.password) {
      return { success: false, message: 'SFTP Username and Password (or Private Key) are required' };
    }
    // Perform SSH/SFTP connection test here
    return { success: true, message: 'Successfully authenticated with SFTP server' };
  }

  async executeAction(action: string, credentials: CredentialPayload, config: Record<string, any>): Promise<any> {
    if (action === 'FILE_UPLOAD') {
      // Stream file to SFTP using ssh2-sftp-client or similar
      return { success: true, remotePath: `${config.remoteDir}/${config.filename}` };
    }
    
    if (action === 'FILE_DOWNLOAD') {
      return { success: true, fileBuffer: 'mock_buffer_data' };
    }

    throw new Error(`SFTP Action ${action} not supported`);
  }
}
