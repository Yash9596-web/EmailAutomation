import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentEngine } from '../src/lib/transactions/payment-engine';
import { InvoiceEngine } from '../src/lib/transactions/invoice-engine';
import db from '../src/lib/db';
import Decimal from 'decimal.js';

// Mock DB
vi.mock('../src/lib/db', () => ({
  default: {
    $transaction: vi.fn(async (cb) => cb(db)),
    payment: {
      findUnique: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    paymentAllocation: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    invoiceLine: {
      createMany: vi.fn(),
    },
    document: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    }
  }
}));

describe('Payment Engine - Financial Allocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent over-allocating a payment across invoices', async () => {
    (db.payment.findUnique as any).mockResolvedValue({
      id: 'pay_123',
      tenantId: 'tenant_1',
      amount: new Decimal('100.00'), // $100 Payment
      status: 'COMPLETED',
      allocations: [
        { amount: new Decimal('60.00') } // Already allocated $60
      ]
    });

    // Try allocating $50 (which exceeds the remaining $40)
    await expect(PaymentEngine.allocatePayment('tenant_1', 'pay_123', [
      { invoiceId: 'inv_1', amount: 50.00 }
    ], 'user_1')).rejects.toThrow(/Payment over-allocation detected/);
  });

  it('should prevent paying more than an invoice total balance', async () => {
    (db.payment.findUnique as any).mockResolvedValue({
      id: 'pay_123',
      tenantId: 'tenant_1',
      amount: new Decimal('1000.00'),
      status: 'COMPLETED',
      allocations: []
    });

    (db.invoice.findUnique as any).mockResolvedValue({
      id: 'inv_1',
      totalAmount: new Decimal('500.00'),
    });

    // Invoice has already been paid $450 from another payment
    (db.paymentAllocation.findMany as any).mockResolvedValue([
      { amount: new Decimal('450.00') }
    ]);

    // Try allocating $100 (which exceeds the remaining $50)
    await expect(PaymentEngine.allocatePayment('tenant_1', 'pay_123', [
      { invoiceId: 'inv_1', amount: 100.00 }
    ], 'user_1')).rejects.toThrow(/exceeds remaining balance/);
  });

  it('should successfully allocate exact precision and mark PAID', async () => {
    (db.payment.findUnique as any).mockResolvedValue({
      id: 'pay_123',
      tenantId: 'tenant_1',
      amount: new Decimal('100.00'),
      status: 'COMPLETED',
      allocations: []
    });

    (db.invoice.findUnique as any).mockResolvedValue({
      id: 'inv_1',
      totalAmount: new Decimal('100.00'),
    });

    (db.paymentAllocation.findMany as any).mockResolvedValue([]);

    await PaymentEngine.allocatePayment('tenant_1', 'pay_123', [
      { invoiceId: 'inv_1', amount: 100.00 }
    ], 'user_1');

    expect(db.paymentAllocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paymentId: 'pay_123',
        invoiceId: 'inv_1',
        amount: new Decimal(100.00)
      })
    });

    expect(db.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv_1' },
      data: { status: 'PAID' }
    });
  });
});

describe('Invoice Engine - Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent invalid state transitions', async () => {
    (db.invoice.findUnique as any).mockResolvedValue({
      id: 'inv_1',
      status: 'ISSUED' // Can't go back to DRAFT
    });

    await expect(InvoiceEngine.transitionState('inv_1', 'tenant_1', 'DRAFT', 'user_1'))
      .rejects.toThrow(/Invalid state transition/);
  });

  it('should detect duplicate invoice number concurrently', async () => {
    (db.document.findUnique as any).mockResolvedValue({
      id: 'doc_1',
      status: 'COMPLETED',
      documentType: 'INVOICE',
      extractedData: {
        invoiceNumber: 'INV-001',
        totalAmount: 100,
        supplierId: 'sup_1'
      }
    });

    (db.invoice.findFirst as any).mockResolvedValue({ id: 'existing_inv' });

    await expect(InvoiceEngine.createFromDocument('doc_1', 'tenant_1'))
      .rejects.toThrow(/Duplicate invoice number/);
  });
});
