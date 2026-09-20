import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';
import { OcrProvider } from './ocr';
import { DocumentClassifier } from './classifier';
import { ExtractionProvider } from './extractor';
import { DocumentValidator } from './validator';

export class DocumentPipeline {
  /**
   * Main orchestrator executed by the Job Worker.
   * Runs the entire sequence: OCR -> Classify -> Extract -> Validate -> Review Check
   */
  static async process(documentId: string): Promise<void> {
    const doc = await db.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new Error(`Document ${documentId} not found`);
    if (doc.status !== 'QUEUED' && doc.status !== 'PROCESSING') return;

    await this.updateStatus(documentId, 'PROCESSING');

    try {
      if (!doc.storageRef) throw new Error('Document missing storageRef');

      // 1. Get Text (For MVP, we bypass OCR for emails and read from metadata)
      const docMetadata = doc.metadata as any;
      const textToAnalyze = docMetadata?.rawText || `Mock extracted text from ${doc.storageRef}`;

      // 2. Classification using Gemini
      const classification = await DocumentClassifier.classify(textToAnalyze);
      await db.document.update({
        where: { id: documentId },
        data: { documentType: classification.documentType, status: 'EXTRACTING' }
      });

      // 3. Extraction using Gemini
      const extraction = await ExtractionProvider.extract(classification.documentType, textToAnalyze);
      
      // 4. Validation (Using our strict JSON schema validator)
      const validation = await DocumentValidator.validate(classification.documentType, extraction.data);

      const nextStatus = validation.isValid ? 'COMPLETED' : 'REVIEW_REQUIRED';
      const finalConfidence = Math.min(classification.confidence, extraction.confidence);

      // 5. Save results
      const finalStatus = (finalConfidence < 0.8 || !validation.isValid) ? 'REVIEW_REQUIRED' : nextStatus;
      await db.document.update({
        where: { id: documentId },
        data: {
          extractedData: extraction.data,
          validationResults: validation.errors,
          confidence: extraction.confidence,
        },
      });

      // 5. Confidence & Review Gate
      if (!validation.isValid || extraction.confidence < 0.8) {
        await this.requireReview(documentId, doc.tenantId, validation.errors.join('; ') || 'Extraction confidence too low');
        return;
      }

      // 6. Success -> Workflow Trigger
      await this.completeProcessing(documentId, doc.tenantId);

    } catch (error: any) {
      logger.error({ message: 'Document processing failed', documentId, error: error.message });
      await db.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', processingError: error.message },
      });
      throw error; // Let the job worker handle retries for transient failures
    }
  }

  private static async updateStatus(documentId: string, status: string) {
    await db.document.update({ where: { id: documentId }, data: { status } });
  }

  private static async requireReview(documentId: string, tenantId: string, reason: string) {
    await db.$transaction(async (tx) => {
      await tx.document.update({ where: { id: documentId }, data: { status: 'REVIEW_REQUIRED', processingError: reason } });
      await tx.reviewTask.create({
        data: {
          tenantId,
          documentId,
          status: 'PENDING',
          fieldsRequiringReview: { reason },
        },
      });
    });

    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'DocumentReviewRequired',
      aggregateType: 'Document',
      aggregateId: documentId,
      tenantId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { reason },
    });
  }

  private static async completeProcessing(documentId: string, tenantId: string) {
    await this.updateStatus(documentId, 'COMPLETED');

    // Trigger the workflow engine via event
    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'DocumentCompleted',
      aggregateType: 'Document',
      aggregateId: documentId,
      tenantId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }
}
