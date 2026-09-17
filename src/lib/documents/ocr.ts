import { logger } from '@/lib/logger';
import { DocumentStorage } from './storage';

export interface OcrResult {
  text: string;
  provider: string;
  confidence: number;
}

export class OcrProvider {
  /**
   * Generic OCR abstraction.
   * In a real environment, this delegates to AWS Textract, Google Cloud Vision, etc.
   */
  static async extractText(storageRef: string): Promise<OcrResult> {
    const url = await DocumentStorage.getSignedUrl(storageRef);
    logger.info({ message: 'Calling OCR provider', storageRef });
    
    // Simulating OCR delay and result
    await new Promise(r => setTimeout(r, 1000));
    
    return {
      text: `Mock Extracted Text from ${storageRef}. Contains invoice details like Amount $500 and Date 2024-01-01.`,
      provider: 'mock-ocr-engine',
      confidence: 0.95,
    };
  }
}
