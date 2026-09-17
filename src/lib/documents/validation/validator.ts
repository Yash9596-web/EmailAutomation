import Decimal from 'decimal.js';
import { logger } from '@/lib/logger';
import db from '@/lib/db';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class DocumentValidator {
  /**
   * Validates business logic of extracted fields.
   * e.g. checking that Subtotal + Tax == Total using safe Decimal arithmetic.
   */
  static async validate(tenantId: string, documentType: string, data: Record<string, any>): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    if (documentType === 'INVOICE') {
      // 1. Mandatory Fields
      if (!data.invoiceNumber) result.errors.push('Missing Invoice Number');
      if (!data.totalAmount) result.errors.push('Missing Total Amount');

      // 1.5 Duplicate Detection
      if (data.supplierId && data.invoiceNumber) {
        const duplicate = await db.invoice.findFirst({
          where: { tenantId, supplierId: data.supplierId, invoiceNumber: data.invoiceNumber }
        });
        if (duplicate) {
          result.errors.push(`Duplicate Invoice Detected: ${data.invoiceNumber} for this supplier already exists`);
        }
      }

      // 2. Financial Arithmetic Check
      if (data.subtotal !== undefined && data.taxAmount !== undefined && data.totalAmount !== undefined) {
        try {
          // Never use floating-point for financial totals
          const sub = new Decimal(data.subtotal || 0);
          const tax = new Decimal(data.taxAmount || 0);
          const discount = new Decimal(data.discountAmount || 0);
          const expectedTotal = sub.plus(tax).minus(discount);

          const actualTotal = new Decimal(data.totalAmount || 0);

          if (!expectedTotal.equals(actualTotal)) {
            result.errors.push(`Financial mismatch: Expected total ${expectedTotal.toString()} but extracted ${actualTotal.toString()}`);
          }
        } catch (e: any) {
          result.errors.push('Invalid financial numbers format');
        }
      }

      // 3. Line Items Check
      if (data.lineItems && Array.isArray(data.lineItems)) {
        let calculatedSubtotal = new Decimal(0);
        data.lineItems.forEach((line: any, idx: number) => {
          if (line.quantity && line.unitPrice) {
            const lineTotal = new Decimal(line.quantity).times(new Decimal(line.unitPrice));
            calculatedSubtotal = calculatedSubtotal.plus(lineTotal);
          }
        });

        if (data.subtotal && !calculatedSubtotal.equals(new Decimal(data.subtotal))) {
          result.warnings.push('Line items total does not match extracted subtotal');
        }
      }
    }

    if (result.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }
}
