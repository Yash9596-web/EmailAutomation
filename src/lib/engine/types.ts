// ============================================================================
// Automation Engine — Core Types
// ============================================================================

// --- Workflow Definition Types ---

export type NodeType = 'TRIGGER' | 'ACTION' | 'CONDITION' | 'DELAY' | 'APPROVAL' | 'END';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  condition?: string; // 'true' | 'false' | 'default' | undefined
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, unknown>;
}

// --- Execution Types ---

export type ExecutionStatus = 'Pending' | 'Queued' | 'Running' | 'Waiting' | 'Succeeded' | 'Failed' | 'Cancelled';
export type StepStatus = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Skipped' | 'Waiting';

export const VALID_EXECUTION_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
  Pending: ['Queued', 'Cancelled'],
  Queued: ['Running', 'Cancelled'],
  Running: ['Waiting', 'Succeeded', 'Failed', 'Cancelled'],
  Waiting: ['Running', 'Cancelled'],
  Succeeded: [],
  Failed: [],
  Cancelled: [],
};

export interface ExecutionContext {
  executionId: string;
  tenantId: string;
  workflowId: string;
  versionId: string;
  actorId?: string;
  actorType: 'USER' | 'SYSTEM' | 'AGENT';
  variables: Record<string, unknown>;
  input: Record<string, unknown>;
  depth: number; // For nested execution protection
}

export interface StepResult {
  status: 'success' | 'failure' | 'waiting';
  data?: Record<string, unknown>;
  error?: string;
  errorCategory?: ErrorCategory;
  nextNodeId?: string; // For condition branching
}

export type ErrorCategory =
  | 'VALIDATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR'
  | 'CANCELLED';

// --- Action/Trigger Contracts ---

export interface ActionHandler {
  type: string;
  capabilities?: string[];
  validate(config: Record<string, unknown>): { valid: boolean; errors?: string[] };
  execute(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult>;
}

export interface TriggerHandler {
  type: string;
  validate(config: Record<string, unknown>): { valid: boolean; errors?: string[] };
  evaluate(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult>;
}

// --- Execution Limits ---

export const EXECUTION_LIMITS = {
  MAX_NODES_PER_DEFINITION: 100,
  MAX_STEPS_PER_EXECUTION: 500,
  MAX_EXECUTION_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_PER_STEP: 3,
  MAX_VARIABLE_SIZE_BYTES: 64 * 1024, // 64KB per variable
  MAX_EXECUTION_DEPTH: 5, // Nested workflow depth
};
