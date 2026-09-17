import { SignJWT, jwtVerify } from 'jose';
import { config } from '@/lib/config';

// Ensure the JWT secret is properly encoded
const secret = new TextEncoder().encode(config.jwtSecret);

export interface TokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  tid?: string; // tenantId (if selected)
}

export class TokenService {
  /**
   * Generates a signed JWT token for session management.
   */
  static async sign(payload: TokenPayload, expiresIn: string = '7d'): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
  }

  /**
   * Verifies and decodes a JWT token.
   */
  static async verify(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload as unknown as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
