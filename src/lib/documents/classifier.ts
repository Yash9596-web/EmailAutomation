import { logger } from '@/lib/logger';

export interface ClassificationResult {
  documentType: 'INVOICE' | 'PURCHASE_ORDER' | 'UNKNOWN';
  confidence: number;
}

export class DocumentClassifier {
  /**
   * Safe classification abstraction.
   * If confidence is below threshold, returns UNKNOWN so human review is triggered.
   */
  static async classify(text: string): Promise<ClassificationResult> {
    const textLower = text.toLowerCase();
    
    // Very basic heuristic implementation for foundation
    if (textLower.includes('invoice') || textLower.includes('bill to')) {
      return { documentType: 'INVOICE', confidence: 0.92 };
    }
    
    if (textLower.includes('purchase order') || textLower.includes('po number')) {
      return { documentType: 'PURCHASE_ORDER', confidence: 0.88 };
    }
    
    return { documentType: 'UNKNOWN', confidence: 0.4 };
  }
}
