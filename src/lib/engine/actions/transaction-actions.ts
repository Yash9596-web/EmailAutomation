import { ActionHandler, ExecutionContext, StepResult } from '@/lib/engine/types';
import { InvoiceEngine } from '@/lib/transactions/invoice-engine';
import { PaymentEngine } from '@/lib/transactions/payment-engine';

export const CreateTransactionAction: ActionHandler = {
  type: 'CREATE_TRANSACTION',
  
  validate(config) {
    const errors = [];
    if (!config.transactionType) errors.push('Requires transactionType (e.g. INVOICE, PAYMENT)');
    return { valid: errors.length === 0, errors };
  },

  async execute(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult> {
    const transactionType = config.transactionType as string;

    try {
      if (transactionType === 'INVOICE') {
        const documentId = config.documentId as string || context.input?.documentId as string;
        if (!documentId) return { status: 'failure', error: 'Missing documentId' };
        
        const invoice = await InvoiceEngine.createFromDocument(documentId, context.tenantId);
        return { status: 'success', data: { transactionId: invoice.id, invoiceNumber: invoice.invoiceNumber } };
      }

      if (transactionType === 'PAYMENT_ALLOCATION') {
        const paymentId = config.paymentId as string;
        const allocations = config.allocations as any[];
        await PaymentEngine.allocatePayment(context.tenantId, paymentId, allocations, context.actorId || 'SYSTEM');
        return { status: 'success', data: { allocated: true } };
      }

      return { status: 'failure', error: `Unsupported transaction type: ${transactionType}` };

    } catch (error: any) {
      return { status: 'failure', error: error.message };
    }
  },
};
