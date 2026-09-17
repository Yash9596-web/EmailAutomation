import { z } from 'zod';

export const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).describe('The unique identifier for the invoice'),
  invoiceDate: z.string().describe('ISO formatted date of the invoice (YYYY-MM-DD)'),
  dueDate: z.string().optional().describe('ISO formatted due date (YYYY-MM-DD)'),
  
  supplier: z.object({
    name: z.string(),
    taxId: z.string().optional(),
    address: z.string().optional(),
  }),
  
  customer: z.object({
    name: z.string(),
    taxId: z.string().optional(),
    address: z.string().optional(),
  }),
  
  currency: z.string().length(3).describe('3-letter ISO currency code (e.g. USD, INR)'),
  
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative(),
  
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    productCode: z.string().optional(),
  })).optional(),
  
  purchaseOrderReference: z.string().optional(),
});

export type InvoiceDocument = z.infer<typeof InvoiceSchema>;
