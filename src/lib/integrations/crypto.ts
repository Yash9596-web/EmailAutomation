import crypto from 'crypto';

const RAW_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
// Hash the key to guarantee it is exactly 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

export class CryptoService {
  /**
   * Encrypts a string using AES-256-GCM.
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts a string that was encrypted with AES-256-GCM.
   */
  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Safe redaction for logging.
   */
  static redact(value: string | null | undefined): string {
    if (!value) return '';
    if (value.length < 8) return '***';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
}
