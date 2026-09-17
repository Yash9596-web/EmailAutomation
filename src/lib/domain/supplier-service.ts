import db from '@/lib/db';
import { logger } from '@/lib/logger';

export class SupplierService {
  /**
   * Safe matching logic utilizing robust identifiers before fuzzy names.
   */
  static async matchOrCreate(tenantId: string, supplierData: { name: string; taxId?: string }): Promise<string> {
    if (!supplierData.name) throw new Error('Supplier name is required');

    // 1. Try exact taxId match if available
    if (supplierData.taxId) {
      const match = await db.supplier.findFirst({
        where: { tenantId, taxId: supplierData.taxId },
      });
      if (match) return match.id;
    }

    // 2. Try exact name match (case-insensitive in Prisma postgres usually or manual LOWER)
    const exactNameMatch = await db.supplier.findFirst({
      where: {
        tenantId,
        name: { equals: supplierData.name, mode: 'insensitive' },
      },
    });

    if (exactNameMatch) return exactNameMatch.id;

    // 3. Fallback: Create new supplier
    logger.info({ message: 'Creating new supplier from extraction', tenantId, name: supplierData.name });
    const newSupplier = await db.supplier.create({
      data: {
        tenantId,
        name: supplierData.name,
        taxId: supplierData.taxId,
        status: 'ACTIVE',
      },
    });

    return newSupplier.id;
  }
}
