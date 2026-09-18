import db from '@/lib/db';
import { IntegrationService } from '@/lib/services/integration-service';
import { GmailConnector } from './providers/email/gmail';
import { DocumentIngestionService } from '@/lib/documents/ingestion';

export class SyncWorker {
  /**
   * Run the background sync process for all active integrations
   */
  static async runSync() {
    console.log('[SyncWorker] Starting background sync...');
    
    // Find all connected Gmail integrations
    const integrations = await db.integration.findMany({
      where: {
        status: 'CONNECTED',
        provider: 'gmail'
      }
    });

    console.log(`[SyncWorker] Found ${integrations.length} active integrations to sync.`);

    let totalEmailsSynced = 0;

    for (const integration of integrations) {
      try {
        console.log(`[SyncWorker] Syncing integration ${integration.id} (Tenant: ${integration.tenantId})`);
        
        // 1. Decrypt token
        const credentials = await IntegrationService.getDecryptedCredentials(integration.id);
        if (!credentials) {
          console.warn(`[SyncWorker] No credentials found for ${integration.id}`);
          continue;
        }

        // 2. Fetch unread emails
        const connector = new GmailConnector();
        const emails = await connector.syncUnreadEmails(credentials);
        
        console.log(`[SyncWorker] Fetched ${emails.length} unread emails.`);

        // 3. Save emails as Documents
        for (const email of emails) {
          // Check if we already ingested this by checking the document metadata for the email ID
          const existing = await db.document.findFirst({
            where: {
              tenantId: integration.tenantId,
              source: 'EMAIL',
              // Note: Prisma JSON filtering can be complex, so we might want to store messageId explicitly later.
              // For Stage 1 demo, we'll just check if a document with this email title exists.
            }
          });

          // Very basic header parsing to extract subject and sender
          const subjectHeader = email.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject');
          const fromHeader = email.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from');
          const title = subjectHeader?.value || 'No Subject';

          // Prevent simple duplicates for the demo
          if (!existing || existing.title !== title) {
            
            // Extract body snippet or actual body
            const bodyStr = email.snippet || 'No content preview';
            
            await DocumentIngestionService.ingest({
              tenantId: integration.tenantId,
              source: 'EMAIL',
              file: Buffer.from(bodyStr),
              fileName: title,
              mimeType: 'text/plain',
              metadata: {
                messageId: email.id,
                from: fromHeader?.value,
                integrationId: integration.id
              }
            });
            totalEmailsSynced++;
          }
        }

        // 4. Update last connected timestamp
        await db.integration.update({
          where: { id: integration.id },
          data: { lastConnectedAt: new Date() }
        });

      } catch (error: any) {
        console.error(`[SyncWorker] Failed to sync integration ${integration.id}:`, error);
        // If it's an auth error, we could optionally mark the integration as DISCONNECTED
        if (error.message.includes('token')) {
          await db.integration.update({
            where: { id: integration.id },
            data: { status: 'ERROR' }
          });
        }
      }
    }

    console.log(`[SyncWorker] Sync complete. Processed ${totalEmailsSynced} new emails.`);
    return { success: true, processedCount: totalEmailsSynced };
  }
}
