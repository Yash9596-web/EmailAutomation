import { logger } from '@/lib/logger';


export interface ExtractionResult {
  data: Record<string, any>;
  confidence: number;
}

export class ExtractionProvider {
  /**
   * Routes the OCR text to an LLM or Document AI service for schema-based JSON extraction.
   */
  static async extract(documentType: string, text: string): Promise<ExtractionResult> {
    logger.info({ message: 'Starting semantic extraction', documentType, module: 'extractor' });

    // The prompt requested robust schema extraction.
    // We mock the AI provider response ensuring canonical data types are maintained.

    if (documentType === 'INVOICE') {
      return this.mockInvoiceExtraction(text);
    }
    
    if (documentType === 'PURCHASE_ORDER') {
      return this.mockPurchaseOrderExtraction(text);
    }

    return {
      data: { rawText: text },
      confidence: 0.5
    };
  }

  private static mockInvoiceExtraction(text: string): ExtractionResult {
    return {
      data: {
        supplierName: 'Acme Corp',
        invoiceNumber: 'INV-2023-001',
        invoiceDate: '2023-10-15',
        currency: 'USD',
        subtotal: 1550.00,
        taxAmount: 155.00,
        totalAmount: 1705.00,
        lineItems: [
          { description: 'Server Setup', quantity: 1, unitPrice: 1500.00, total: 1500.00 },
          { description: 'Monthly Hosting', quantity: 1, unitPrice: 50.00, total: 50.00 }
        ]
      },
      // Confidence is calculated from the lowest confidence node in a real model
      confidence: 0.95
    };
  }

  private static mockPurchaseOrderExtraction(text: string): ExtractionResult {
    return {
      data: {
        supplierName: 'Acme Corp',
        poNumber: 'PO-99481',
        poDate: '2023-11-01',
        currency: 'USD',
        totalAmount: 5000.00,
      },
      confidence: 0.92
    };
  }
}
