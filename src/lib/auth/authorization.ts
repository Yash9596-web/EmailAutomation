import db from '@/lib/db';
import { AuthenticationError, ForbiddenError } from '@/lib/errors';
import { SessionService } from './session';
import { hasPermission, hasSystemRole } from './rbac';
import { withCache } from '@/lib/cache';

export class AuthorizationService {
  /**
   * Resolves the current user, tenant, and effective roles for the request.
   * Throws if unauthenticated or if the user is suspended.
   */
  static async resolveContext() {
    const session = await SessionService.getSession();
    if (!session) {
      throw new AuthenticationError('Authentication required');
    }

    const { user, membership, tenant, roles } = await withCache(`auth_context:${session.userId}:${session.tenantId || 'none'}`, async () => {
      const user = await db.user.findUnique({
        where: { id: session.userId }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AuthenticationError('Account is disabled or suspended');
      }

      if (!session.tenantId) {
        return { user, tenant: null, membership: null, roles: [] };
      }

      const membership = await db.membership.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: session.tenantId
          }
        },
        include: {
          tenant: true,
          role: {
            include: { permissions: true }
          }
        }
      });

      if (!membership || membership.status !== 'Active') {
        throw new ForbiddenError('Tenant access denied or suspended');
      }

      if (membership.tenant.status !== 'Active') {
        throw new ForbiddenError('Tenant account is suspended');
      }

      return {
        user,
        tenant: membership.tenant,
        membership,
        roles: membership.role ? [membership.role] : []
      };
    }, 60000); // cache for 1 minute

    return { user, tenant, membership, roles };
  }

  /**
   * Main authorization gate. Ensures the current session has the required permission.
   */
  static async authorize(action: string, resource: string): Promise<void> {
    const context = await this.resolveContext();

    if (!context.tenant) {
      throw new ForbiddenError('Tenant context required for this action');
    }

    const allowed = hasPermission(context.roles as any, action, resource) || hasSystemRole(context.roles as any);
    
    if (!allowed) {
      throw new ForbiddenError(`Missing required permission: ${resource}.${action}`);
    }
  }
}
