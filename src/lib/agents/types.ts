// ============================================================================
// Agent Types — Aligned with Prisma schema (Stage 2)
// ============================================================================

export interface AgentCapability {
  id: string;
  agentId: string;
  name: string;
  description: string;
}

export interface AgentPolicy {
  id: string;
  agentId: string;
  maxBudget?: number;
  allowedTools: string[];
  requiresHumanApproval: boolean;
}

export interface AgentVersion {
  id: string;
  agentId: string;
  version: number;
  config: Record<string, unknown>;
  status: 'Draft' | 'Active' | 'Deprecated';
  createdAt: string;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  capabilities: AgentCapability[];
  policy?: AgentPolicy;
  versions?: AgentVersion[];
  status: 'Active' | 'Inactive';
}
