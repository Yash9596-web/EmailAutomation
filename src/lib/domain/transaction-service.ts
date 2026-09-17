import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';

export class TransactionService {
  /**
   * Controlled state transitions for Invoices.
   * DRAFT -> RECEIVED -> VALIDATED -> PENDING_APPROVAL -> APPROVED -> POSTED
   */
  static async transitionInvoiceState(
    tenantId: string, 
    invoiceId: string, 
    newState: string, 
    actorId: string
  ): Promise<void> {
    const invoice = await db.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new Error('Invoice not found');

    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['RECEIVED'],
      'RECEIVED': ['VALIDATED', 'CANCELLED'],
      'VALIDATED': ['PENDING_APPROVAL', 'APPROVED'],
      'PENDING_APPROVAL': ['APPROVED', 'REJECTED'],
      'APPROVED': ['POSTED'],
    };

    const allowedNext = validTransitions[invoice.status] || [];
    if (!allowedNext.includes(newState)) {
      throw new Error(`Invalid state transition from ${invoice.status} to ${newState}`);
    }

    // High-risk barrier check: Cannot bypass PENDING_APPROVAL if total > 10,000
    if (newState === 'APPROVED' && invoice.status === 'VALIDATED') {
      const threshold = 10000;
      if (Number(invoice.totalAmount) >= threshold) {
        throw new Error(`Invoice exceeds threshold ($${threshold}) and requires explicit approval.`);
      }
    }

    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: newState },
    });

    // Publish state change
    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: `Invoice${newState.charAt(0).toUpperCase() + newState.slice(1).toLowerCase()}`,
      aggregateType: 'Invoice',
      aggregateId: invoiceId,
      tenantId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { previousState: invoice.status, actorId },
    });

    logger.info({ message: 'Invoice state transitioned', invoiceId, oldState: invoice.status, newState });
  }

  /**
   * Idempotent Invoice Creation with Duplicate Detection.
   */
  static async createInvoiceIdempotent(tenantId: string, data: any): Promise<string> {
    // 1. Duplicate check: Supplier + Invoice Number
    const existing = await db.invoice.findFirst({
      where: { 
        tenantId, 
        supplierId: data.supplierId, 
        invoiceNumber: data.invoiceNumber 
      }
    });

    if (existing) {
      logger.warn({ message: 'Duplicate invoice detected, returning existing', invoiceId: existing.id });
      return existing.id;
    }

    // 2. Transactionally create
    const invoice = await db.$transaction(async (tx) => {
      return tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber: data.invoiceNumber,
          supplierId: data.supplierId,
          documentId: data.documentId,
          date: data.date ? new Date(data.date) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          currency: data.currency || 'USD',
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          status: 'RECEIVED',
          lines: {
            create: data.lineItems?.map((line: any) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              totalAmount: line.totalPrice,
            })) || [],
          }
        }
      });
    });

    return invoice.id;
  }
}
