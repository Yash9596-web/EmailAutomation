import db from '@/lib/db';
import { DocumentStorage } from './storage';
import { eventBus } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';
import { jobWorker } from '@/lib/jobs/job-worker';

export class DocumentIngestionService {
  /**
   * Safe entry point for all new documents.
   */
  static async ingest(params: {
    tenantId: string;
    source: 'EMAIL' | 'UPLOAD' | 'API';
    file: Buffer;
    fileName: string;
    mimeType: string;
    metadata?: Record<string, any>;
  }) {
    const { tenantId, source, file, fileName, mimeType, metadata } = params;

    // 1. File validation
    DocumentStorage.validate({ name: fileName, size: file.length, mimeType });

    // 2. Storage Upload
    const { key, hash } = await DocumentStorage.upload(tenantId, file, mimeType);

    // 3. Database transaction
    const document = await db.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          tenantId,
          title: fileName,
          mimeType,
          storageRef: key,
          source,
          status: 'QUEUED',
          contentHash: hash,
          metadata,
        },
      });

      // 4. Create initial processing job (we can also dispatch an event to handle this)
      await tx.jobRecord.create({
        data: {
          queue: 'document-processing',
          jobType: 'document-pipeline',
          tenantId,
          payload: { documentId: doc.id },
          idempotencyKey: `doc_process_${doc.id}`,
        },
      });

      return doc;
    });

    // 5. Publish event
    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'DocumentReceived',
      aggregateType: 'Document',
      aggregateId: document.id,
      tenantId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { source, hash, fileName },
    });

    logger.info({ message: 'Document ingested', documentId: document.id, tenantId });
    return document;
  }
}
