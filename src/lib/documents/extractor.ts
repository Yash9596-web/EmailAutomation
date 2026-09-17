import { z } from 'zod';
import { logger } from '@/lib/logger';
import { InvoiceSchema } from './schemas/invoice';
import { PurchaseOrderSchema } from './schemas/purchase-order';

export interface ExtractionResult {
  data: any;
  confidence: number;
  schemaVersion: string;
}

export class ExtractionProvider {
  /**
   * Generates structured JSON from raw text using a specific schema.
   * In a real environment, this delegates to an LLM (e.g. OpenAI/Anthropic) using Structured Outputs.
   */
  static async extract(documentType: string, text: string): Promise<ExtractionResult> {
    logger.info({ message: 'Running extraction model', documentType });
    
    // Simulate LLM extraction delay
    await new Promise(r => setTimeout(r, 1500));

    if (documentType === 'INVOICE') {
      const mockInvoice = {
        invoiceNumber: 'INV-1000',
        invoiceDate: '2024-01-01',
        supplier: { name: 'Acme Corp' },
        customer: { name: 'Globex' },
        currency: 'USD',
        subtotal: 450,
        taxAmount: 50,
        totalAmount: 500,
      };
      
      return {
        data: InvoiceSchema.parse(mockInvoice), // Ensures it meets the schema
        confidence: 0.85,
        schemaVersion: '1.0.0',
      };
    }
    
    if (documentType === 'PURCHASE_ORDER') {
      const mockPo = {
        poNumber: 'PO-9999',
        orderDate: '2024-01-01',
        buyer: { name: 'Globex' },
        supplier: { name: 'Acme Corp' },
        currency: 'USD',
        totalAmount: 500,
      };
      
      return {
        data: PurchaseOrderSchema.parse(mockPo),
        confidence: 0.9,
        schemaVersion: '1.0.0',
      };
    }
    
    throw new Error(`Unsupported document type for extraction: ${documentType}`);
  }
}
