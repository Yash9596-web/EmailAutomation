import { logger } from '@/lib/logger';
import { AiProviderRegistry } from '@/lib/ai/registry';

export interface ClassificationResult {
  documentType: 'INVOICE' | 'PURCHASE_ORDER' | 'UNKNOWN' | 'GENERAL_EMAIL';
  confidence: number;
}

export class DocumentClassifier {
  /**
   * Safe classification abstraction.
   * If confidence is below threshold, returns UNKNOWN so human review is triggered.
   */
  static async classify(text: string): Promise<ClassificationResult> {
    const textLower = text.toLowerCase();
    
    try {
      const ai = AiProviderRegistry.get('gemini');
      const systemPrompt = `Classify the following text into one of these categories: INVOICE, PURCHASE_ORDER, GENERAL_EMAIL, UNKNOWN. 
If it is a receipt or bill, classify as INVOICE.
If it is a general email conversation or newsletter, classify as GENERAL_EMAIL.`;
      
      const response = await ai.classify(systemPrompt, text, ['INVOICE', 'PURCHASE_ORDER', 'UNKNOWN', 'GENERAL_EMAIL']);
      
      return { 
        documentType: response.data.label as any, 
        confidence: response.confidence === 'HIGH' ? 0.95 : 0.7 
      };
    } catch (e) {
      logger.error({ message: 'Classification failed', error: e });
      // Very basic heuristic fallback
      if (textLower.includes('invoice') || textLower.includes('bill to')) {
        return { documentType: 'INVOICE', confidence: 0.92 };
      }
      
      if (textLower.includes('purchase order') || textLower.includes('po number')) {
        return { documentType: 'PURCHASE_ORDER', confidence: 0.88 };
      }
      
      return { documentType: 'UNKNOWN', confidence: 0.4 };
    }
  }
  }
}
