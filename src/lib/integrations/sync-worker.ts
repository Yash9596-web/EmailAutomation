import db from '@/lib/db';
import { IntegrationService } from '@/lib/services/integration-service';
import { GmailConnector } from './providers/email/gmail';
import { DocumentIngestionService } from '@/lib/documents/ingestion';
import { CryptoService } from '@/lib/integrations/crypto';

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
        let credentials = await IntegrationService.getDecryptedCredentials(integration.id);
        if (!credentials) {
          console.warn(`[SyncWorker] No credentials found for ${integration.id}`);
          continue;
        }

        const connector = new GmailConnector();

        // 2. Check for token expiration (refresh if expired)
        if (credentials.expiresAt && new Date(credentials.expiresAt) < new Date()) {
          console.log(`[SyncWorker] Token expired for ${integration.id}. Refreshing...`);
          if (credentials.refreshToken) {
            credentials = await connector.refreshToken(credentials.refreshToken);
            
            // Save the new token to DB
            const encryptedToken = CryptoService.encrypt(JSON.stringify(credentials));
            await db.integrationCredential.create({
              data: {
                integrationId: integration.id,
                encryptedToken
              }
            });
            console.log(`[SyncWorker] Successfully refreshed token for ${integration.id}`);
          } else {
            console.error(`[SyncWorker] Token expired and no refresh token available for ${integration.id}`);
            continue;
          }
        }

        // 3. Fetch unread emails
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
              fileName: `${title}.eml`,
              mimeType: 'message/rfc822',
              metadata: {
                messageId: email.id,
                from: fromHeader?.value,
                integrationId: integration.id,
                rawText: bodyStr
              }
            });
            totalEmailsSynced++;
            
            // Mark as read so we don't fetch it again on the next sync
            await connector.markAsRead(credentials, email.id);
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
        if (error.message.includes('token') || error.message.includes('Auth') || error.message.includes('auth')) {
          await db.integration.update({
            where: { id: integration.id },
            data: { status: 'ERROR' }
          });
        }
      }
    }

    // --- Vercel Serverless Hack for MVP ---
    // Since we don't have a background JobWorker constantly polling in serverless,
    // we manually process the queued documents right after syncing emails!
    console.log('[SyncWorker] Processing queued documents with Document AI Pipeline...');
    try {
      // Must import DocumentPipeline dynamically or at top.
      const { DocumentPipeline } = await import('@/lib/documents/pipeline');
      const { bootstrapAi } = await import('@/lib/ai/bootstrap');
      
      bootstrapAi(); // Ensure Gemini is registered in the serverless environment
      
      const queuedDocs = await db.document.findMany({
        where: { status: 'QUEUED', source: 'EMAIL' },
        take: 3 // process up to 3 at a time to prevent Vercel 10s timeouts
      });
      
      console.log(`[SyncWorker] Found ${queuedDocs.length} queued documents to process.`);
      for (const doc of queuedDocs) {
        console.log(`[SyncWorker] Processing document ${doc.id}...`);
        await DocumentPipeline.process(doc.id);
      }
    } catch (err) {
      console.error('[SyncWorker] Error processing documents:', err);
    }

    console.log(`[SyncWorker] Sync complete. Processed ${totalEmailsSynced} new emails.`);
    return { success: true, processedCount: totalEmailsSynced };
  }
}
