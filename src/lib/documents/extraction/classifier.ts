import { logger } from '@/lib/logger';

export interface ClassificationResult {
  documentType: string;
  confidence: number;
}

export class DocumentClassifier {
  /**
   * Classifies the document type based on OCR text, filenames, or AI categorization.
   */
  static async classify(text: string): Promise<ClassificationResult> {
    logger.info({ message: 'Classifying document', module: 'classifier' });

    const normalized = text.toLowerCase();
    
    // Basic heuristics (in production, combine with LLM classification)
    if (normalized.includes('invoice') || normalized.includes('bill to') || normalized.includes('amount due')) {
      return { documentType: 'INVOICE', confidence: 0.95 };
    }
    
    if (normalized.includes('purchase order') || normalized.includes('po number')) {
      return { documentType: 'PURCHASE_ORDER', confidence: 0.92 };
    }
    
    if (normalized.includes('quote') || normalized.includes('quotation')) {
      return { documentType: 'QUOTATION', confidence: 0.90 };
    }

    if (normalized.includes('delivery') || normalized.includes('shipping') || normalized.includes('packing slip')) {
      return { documentType: 'DELIVERY_NOTE', confidence: 0.85 };
    }
    
    if (normalized.includes('receipt')) {
      return { documentType: 'RECEIPT', confidence: 0.88 };
    }
    
    if (normalized.includes('contract') || normalized.includes('agreement')) {
      return { documentType: 'CONTRACT', confidence: 0.94 };
    }

    return { documentType: 'UNKNOWN', confidence: 0.1 };
  }
}
