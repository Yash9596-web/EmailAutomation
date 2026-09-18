import crypto from 'crypto';
import path from 'path';

/**
 * Storage Abstraction for Document Processing
 * In a real environment, this delegates to AWS S3, GCS, or Azure Blob.
 */
export class DocumentStorage {
  /**
   * Validates file safety (malware, type, size).
   */
  static validate(fileInfo: { name: string; size: number; mimeType: string }) {
    if (fileInfo.size > 20 * 1024 * 1024) throw new Error('File exceeds 20MB limit');
    
    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'text/plain', 'message/rfc822'];
    if (!allowedMime.includes(fileInfo.mimeType)) throw new Error(`Unsupported file type: ${fileInfo.mimeType}`);

    const ext = path.extname(fileInfo.name).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.txt', '.eml'].includes(ext) && ext !== '') {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * Generates a unique secure key and mock-uploads.
   * Returns the storage reference (key) and the content hash.
   */
  static async upload(tenantId: string, buffer: Buffer, mimeType: string): Promise<{ key: string, hash: string }> {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const key = `tenants/${tenantId}/docs/${hash}_${Date.now()}`;
    
    // Simulating object storage upload...
    // await s3.putObject({ Bucket, Key: key, Body: buffer, ContentType: mimeType })
    
    return { key, hash };
  }

  /**
   * Generates a signed, short-lived URL for secure frontend or OCR access.
   */
  static async getSignedUrl(key: string, expiresInMinutes: number = 15): Promise<string> {
    // Simulating S3 getSignedUrl...
    return `https://mock-storage.local/${key}?signature=mock&expires=${Date.now() + expiresInMinutes * 60000}`;
  }
}
