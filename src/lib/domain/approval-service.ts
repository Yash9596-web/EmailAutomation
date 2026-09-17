import db from '@/lib/db';
import { eventBus } from '@/lib/events/event-bus';
import { TransactionService } from './transaction-service';

export class ApprovalService {
  /**
   * Creates an approval request and shifts the transaction into PENDING_APPROVAL.
   */
  static async requestApproval(tenantId: string, resourceType: string, resourceId: string, requestedBy: string) {
    if (resourceType === 'Invoice') {
      await TransactionService.transitionInvoiceState(tenantId, resourceId, 'PENDING_APPROVAL', requestedBy);
    }

    const request = await db.approvalRequest.create({
      data: {
        tenantId,
        resourceType,
        resourceId,
        requestedBy,
        status: 'PENDING',
      },
    });

    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'ApprovalRequested',
      aggregateType: 'ApprovalRequest',
      aggregateId: request.id,
      tenantId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { resourceType, resourceId },
    });

    return request.id;
  }

  /**
   * Safe approval execution. Enforces segregation of duties.
   */
  static async makeDecision(tenantId: string, approvalId: string, actorId: string, decision: 'APPROVED' | 'REJECTED') {
    const request = await db.approvalRequest.findFirst({ where: { id: approvalId, tenantId } });
    if (!request) throw new Error('Approval request not found');
    if (request.status !== 'PENDING') throw new Error('Approval request is not pending');

    // Segregation of Duties
    if (request.requestedBy === actorId) {
      throw new Error('Requester cannot approve their own transaction');
    }

    await db.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: decision,
          decision,
          assignedTo: actorId,
          completedAt: new Date(),
        },
      });

      if (request.resourceType === 'Invoice') {
        const nextState = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'; // Note: Invoice status 'REJECTED' isn't standard, usually 'CANCELLED'. Let's adapt.
        const invoiceState = decision === 'APPROVED' ? 'APPROVED' : 'CANCELLED';
        
        const invoice = await tx.invoice.findUnique({ where: { id: request.resourceId } });
        if (invoice) {
           await tx.invoice.update({ where: { id: invoice.id }, data: { status: invoiceState } });
        }
      }
    });
  }
}
