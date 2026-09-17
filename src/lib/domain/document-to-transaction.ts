import db from '@/lib/db';
import { SupplierService } from './supplier-service';
import { TransactionService } from './transaction-service';
import { logger } from '@/lib/logger';

export class DocumentToTransactionService {
  /**
   * Converts a Stage 7 Validated Document into a Stage 8 Business Transaction.
   */
  static async convertDocument(tenantId: string, documentId: string): Promise<string | null> {
    const document = await db.document.findFirst({
      where: { id: documentId, tenantId, status: 'COMPLETED' }
    });

    if (!document || !document.extractedData) {
      logger.warn({ message: 'Document not ready for conversion or missing data', documentId });
      return null;
    }

    const data = document.extractedData as any;

    if (document.documentType === 'INVOICE') {
      // 1. Resolve Supplier Entity safely
      let supplierId = undefined;
      if (data.supplier?.name) {
        supplierId = await SupplierService.matchOrCreate(tenantId, {
          name: data.supplier.name,
          taxId: data.supplier.taxId,
        });
      }

      // 2. Map fields and create Transaction idempotently
      const invoiceId = await TransactionService.createInvoiceIdempotent(tenantId, {
        supplierId,
        documentId: document.id,
        invoiceNumber: data.invoiceNumber,
        date: data.invoiceDate,
        dueDate: data.dueDate,
        currency: data.currency,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        lineItems: data.lineItems,
      });

      logger.info({ message: 'Document converted to Invoice transaction', documentId, invoiceId });
      return invoiceId;
    }

    throw new Error(`Conversion for document type ${document.documentType} not implemented`);
  }
}
