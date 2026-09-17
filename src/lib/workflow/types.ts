// ============================================================================
// Workflow Types — Aligned with Prisma schema (Stage 2)
// ============================================================================

export type WorkflowStatus = 'Draft' | 'Published' | 'Paused' | 'Archived';
export type WorkflowVersionStatus = 'Draft' | 'Published' | 'Deprecated';
export type WorkflowRunStatus = 'Pending' | 'Running' | 'Waiting' | 'Succeeded' | 'Failed' | 'Cancelled';
export type WorkflowTaskStatus = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Skipped';

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  version: number; // Optimistic concurrency version
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  status: WorkflowVersionStatus;
  definition: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowRun {
  id: string;
  workflowVersionId: string;
  tenantId: string;
  status: WorkflowRunStatus;
  error?: string;
  metadata?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowTask {
  id: string;
  workflowRunId: string;
  taskType: string;
  status: WorkflowTaskStatus;
  sequence: number;
  inputRef?: string;
  outputRef?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}
