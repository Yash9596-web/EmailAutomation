import { CreateExceptionInput } from './exception-service';

export class PriorityEngine {
  /**
   * Deterministically calculates priority based on financial impact, category, and source.
   */
  static calculatePriority(input: CreateExceptionInput): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // 1. Critical Operational Failures
    if (input.category === 'SYSTEM' || input.category === 'INTEGRATION') {
      if (input.type === 'authentication_failure' || input.type === 'infrastructure_failure') {
        return 'CRITICAL';
      }
    }

    // 2. Financial Impact Checks (Assume metadata.amount exists from Stage 19 models)
    if (input.metadata && typeof input.metadata.amount === 'number') {
      const amount = input.metadata.amount;
      if (amount > 100000) return 'CRITICAL';
      if (amount > 10000) return 'HIGH';
    }

    // 3. Workflow Failures (Blocks automation)
    if (input.category === 'WORKFLOW' && input.type === 'workflow_failure') {
      return 'HIGH';
    }

    // 4. Default Triage
    if (input.category === 'DOCUMENT') return 'MEDIUM';
    
    return 'LOW';
  }
}


