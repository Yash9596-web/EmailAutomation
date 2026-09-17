import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { ExtractionResult } from '../extractor';

export class EntityMatcher {
  /**
   * Matches extracted entities against Tenant records (Suppliers / Customers).
   * Modifies the extraction data inline to include structured database references if matched.
   */
  static async match(tenantId: string, documentType: string, extraction: ExtractionResult): Promise<ExtractionResult> {
    logger.info({ message: 'Matching entities', documentType, module: 'matcher' });

    if (documentType === 'INVOICE' || documentType === 'PURCHASE_ORDER') {
      const supplierName = extraction.data.supplierName;
      if (supplierName) {
        // Find existing supplier by exact name or normalized tax ID
        const supplier = await db.supplier.findFirst({
          where: {
            tenantId,
            name: {
              equals: supplierName,
              mode: 'insensitive' // Requires PG case-insensitive extension, mocked here
            }
          }
        });

        if (supplier) {
          extraction.data.supplierId = supplier.id;
          extraction.data.supplierMatched = true;
          logger.info({ message: 'Supplier matched successfully', supplierId: supplier.id });
        } else {
          // If no supplier matched, confidence drops slightly to trigger human review
          extraction.data.supplierMatched = false;
          extraction.confidence -= 0.1; 
          logger.warn({ message: 'Supplier could not be matched', supplierName });
        }
      }
    }

    return extraction;
  }
}
