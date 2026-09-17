import { z } from 'zod';

export const paginationSchema = z.object({
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
  skip: z.coerce.number().int().min(0).optional().default(0),
  cursor: z.string().optional(),
});
