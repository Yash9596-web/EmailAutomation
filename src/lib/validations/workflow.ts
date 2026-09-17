import { z } from 'zod';

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['Draft', 'Published', 'Paused', 'Archived']).optional(),
  version: z.number().int().positive().optional(), // Optimistic concurrency version expected
});

export const createWorkflowVersionSchema = z.object({
  definition: z.record(z.string(), z.unknown()), // Basic schema validation for now
});

export const executeWorkflowSchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
});
