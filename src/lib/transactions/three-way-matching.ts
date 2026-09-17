import db from '@/lib/db';
import { logger } from '@/lib/logger';
import Decimal from 'decimal.js';

export interface MatchResult {
  status: 'MATCHED' | 'MINOR_VARIANCE' | 'MAJOR_VARIANCE' | 'MISSING_RECEIPT' | 'MISSING_PO' | 'REQUIRES_REVIEW';
  discrepancies: string[];
}

export class ThreeWayMatchingEngine {
  /**
   * Performs a 3-way match between a Supplier Invoice, Purchase Order, and Goods Receipt.
   */
  static async evaluateInvoice(tenantId: string, invoiceId: string): Promise<MatchResult> {
    logger.info({ message: 'Evaluating 3-way match', invoiceId, tenantId });

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId, tenantId },
      include: { lines: true, supplier: true }
    });

    if (!invoice) throw new Error('Invoice not found');
    
    // In this canonical model, we'd look up the PO based on an external reference or linked document.
    // Assuming the invoice extracted the PO Number into a metadata field or similar.
    // For this demonstration, we'll try to find a PO for this supplier that matches the total.
    
    // Simplification for the architecture model: find a PO that was received and matches amounts.
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: { supplierId: invoice.supplierId!, tenantId },
      include: { receipts: true, lines: true }
    });

    if (!purchaseOrder) {
      return { status: 'MISSING_PO', discrepancies: ['No Purchase Order found for this supplier invoice'] };
    }

    if (!purchaseOrder.receipts || purchaseOrder.receipts.length === 0) {
      return { status: 'MISSING_RECEIPT', discrepancies: ['Purchase Order has no registered Goods Receipts'] };
    }

    const discrepancies: string[] = [];

    // 1. Total Amount Check
    const poTotal = new Decimal(purchaseOrder.totalAmount);
    const invTotal = new Decimal(invoice.totalAmount);

    if (!poTotal.equals(invTotal)) {
      const variance = poTotal.minus(invTotal).abs();
      if (variance.lessThan(new Decimal(5))) { // Tolerance of $5
        discrepancies.push(`Minor amount variance of ${variance.toString()}`);
        return { status: 'MINOR_VARIANCE', discrepancies };
      } else {
        discrepancies.push(`Major amount variance of ${variance.toString()} between PO and Invoice`);
        return { status: 'MAJOR_VARIANCE', discrepancies };
      }
    }

    return { status: 'MATCHED', discrepancies: [] };
  }
}
