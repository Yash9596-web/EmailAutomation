import { z } from 'zod';

export const PurchaseOrderSchema = z.object({
  poNumber: z.string().min(1).describe('The unique identifier for the purchase order'),
  orderDate: z.string().describe('ISO formatted date (YYYY-MM-DD)'),
  deliveryDate: z.string().optional().describe('Expected delivery date (YYYY-MM-DD)'),
  
  buyer: z.object({
    name: z.string(),
    address: z.string().optional(),
  }),
  
  supplier: z.object({
    name: z.string(),
    address: z.string().optional(),
  }),
  
  currency: z.string().length(3).describe('3-letter ISO currency code'),
  
  totalAmount: z.number().nonnegative(),
  
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    productCode: z.string().optional(),
  })).optional(),
});

export type PurchaseOrderDocument = z.infer<typeof PurchaseOrderSchema>;
