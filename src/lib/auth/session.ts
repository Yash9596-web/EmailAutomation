import db from '@/lib/db';
import { TokenService } from './token';
import { withCache, invalidateCache } from '@/lib/cache';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

export class SessionService {
  private static COOKIE_NAME = 'sid';

  /**
   * Creates a new session in the database and sets the cookie.
   */
  static async createSession(userId: string, tenantId?: string, deviceMetadata?: any): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store opaque session record
    const session = await db.session.create({
      data: {
        userId,
        token: crypto.randomUUID(), // unique session tracking ID
        expiresAt,
        metadata: deviceMetadata
      }
    });

    // Create the JWT containing the session ID
    const token = await TokenService.sign({
      sub: userId,
      sid: session.id,
      tid: tenantId
    });

    // Set secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt
    });
  }

  /**
   * Retrieves and validates the current session from cookies.
   */
  static async getSession(): Promise<{ userId: string; tenantId?: string; sessionId: string } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(this.COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await TokenService.verify(token);
    if (!payload) return null;

    // Verify session exists and is not revoked in DB (cached for 1 minute for performance)
    const session = await withCache(`session:${payload.sid}`, async () => {
      return await db.session.findUnique({
        where: { id: payload.sid }
      });
    }, 60000);

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: payload.sub,
      tenantId: payload.tid,
      sessionId: payload.sid
    };
  }

  /**
   * Invalidates the current session.
   */
  static async destroySession(): Promise<void> {
    const sessionInfo = await this.getSession();
    if (sessionInfo?.sessionId) {
      await db.session.update({
        where: { id: sessionInfo.sessionId },
        data: { isRevoked: true }
      });
      invalidateCache(`session:${sessionInfo.sessionId}`);
    }

    const cookieStore = await cookies();
    cookieStore.delete(this.COOKIE_NAME);
  }

  /**
   * Allows a user to select a tenant, creating a new session scoped to that tenant.
   */
  static async setTenantContext(tenantId: string): Promise<void> {
    const current = await this.getSession();
    if (!current) throw new Error('No active session');

    // Verify user is actually a member of this tenant
    const membership = await db.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: current.userId,
          tenantId: tenantId
        }
      }
    });

    if (!membership || membership.status !== 'Active') {
      throw new Error('User does not have access to this tenant');
    }

    // Re-issue session with tenantId
    await this.createSession(current.userId, tenantId);
    
    // Invalidate the old stateless-only session ID in the DB
    await db.session.update({
        where: { id: current.sessionId },
        data: { isRevoked: true }
    });
    invalidateCache(`session:${current.sessionId}`);
  }
}
