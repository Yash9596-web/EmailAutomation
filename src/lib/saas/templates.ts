import db from '@/lib/db';
import { logger } from '@/lib/logger';

export class OnboardingTemplates {
  /**
   * Provisions a default Low-Stock Procurement Automation for a new Tenant.
   */
  static async provisionFirstValueWorkflow(tenantId: string, userId: string) {
    try {
      const existing = await db.workflow.findFirst({
        where: { tenantId, name: 'Default Low Stock Alert' }
      });

      if (existing) return; // Idempotency check

      await db.workflow.create({
        data: {
          tenantId,
          name: 'Default Low Stock Alert',
          description: 'Triggers when inventory drops below reorder point.',
          status: 'Published'
        }
      });
      logger.info({ message: 'Provisioned default workflow template', tenantId });
    } catch (error) {
      logger.error({ message: 'Failed to provision onboarding template', error });
    }
  }
}
