export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class DocumentValidator {
  /**
   * Cross-field validation and business rules.
   */
  static validate(documentType: string, data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (documentType === 'INVOICE') {
      const { subtotal, taxAmount = 0, discountAmount = 0, totalAmount, dueDate, invoiceDate } = data;
      
      // Totals check
      const calculatedTotal = subtotal + taxAmount - discountAmount;
      if (Math.abs(calculatedTotal - totalAmount) > 0.1) {
        errors.push(`Total amount (${totalAmount}) does not match calculated subtotal + tax - discount (${calculatedTotal})`);
      }

      // Dates check
      if (dueDate && invoiceDate && new Date(dueDate) < new Date(invoiceDate)) {
        errors.push('Due date cannot be before invoice date');
      }
    }

    if (documentType === 'PURCHASE_ORDER') {
      const { deliveryDate, orderDate, totalAmount } = data;
      if (deliveryDate && orderDate && new Date(deliveryDate) < new Date(orderDate)) {
        errors.push('Delivery date cannot be before order date');
      }
      if (totalAmount <= 0) {
        errors.push('Total amount must be greater than zero');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
