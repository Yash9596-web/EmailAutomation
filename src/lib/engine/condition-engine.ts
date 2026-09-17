// ============================================================================
// Condition Engine — Safe predefined operators for workflow branching
// ============================================================================

export type ConditionOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than'
  | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'exists' | 'is_empty'
  | 'is_true' | 'is_false';

export interface Condition {
  field: string; // Variable path e.g. "trigger.input.amount"
  operator: ConditionOperator;
  value?: unknown;
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

const MAX_NESTING_DEPTH = 5;

export class ConditionEngine {
  /**
   * Evaluate a condition or condition group against a variables map.
   */
  static evaluate(
    condition: Condition | ConditionGroup,
    variables: Record<string, unknown>,
    depth: number = 0
  ): boolean {
    if (depth > MAX_NESTING_DEPTH) {
      throw new Error('Condition nesting depth exceeded');
    }

    if ('logic' in condition) {
      return this.evaluateGroup(condition, variables, depth);
    }
    return this.evaluateSingle(condition, variables);
  }

  private static evaluateGroup(
    group: ConditionGroup,
    variables: Record<string, unknown>,
    depth: number
  ): boolean {
    if (group.logic === 'AND') {
      return group.conditions.every(c => this.evaluate(c, variables, depth + 1));
    }
    return group.conditions.some(c => this.evaluate(c, variables, depth + 1));
  }

  private static evaluateSingle(condition: Condition, variables: Record<string, unknown>): boolean {
    const fieldValue = this.resolveField(condition.field, variables);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && typeof condition.value === 'string'
          ? fieldValue.includes(condition.value)
          : false;
      case 'starts_with':
        return typeof fieldValue === 'string' && typeof condition.value === 'string'
          ? fieldValue.startsWith(condition.value)
          : false;
      case 'ends_with':
        return typeof fieldValue === 'string' && typeof condition.value === 'string'
          ? fieldValue.endsWith(condition.value)
          : false;
      case 'greater_than':
        return typeof fieldValue === 'number' && typeof condition.value === 'number'
          ? fieldValue > condition.value
          : false;
      case 'less_than':
        return typeof fieldValue === 'number' && typeof condition.value === 'number'
          ? fieldValue < condition.value
          : false;
      case 'greater_than_or_equal':
        return typeof fieldValue === 'number' && typeof condition.value === 'number'
          ? fieldValue >= condition.value
          : false;
      case 'less_than_or_equal':
        return typeof fieldValue === 'number' && typeof condition.value === 'number'
          ? fieldValue <= condition.value
          : false;
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'is_empty':
        return fieldValue === undefined || fieldValue === null || fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'is_true':
        return fieldValue === true;
      case 'is_false':
        return fieldValue === false;
      default:
        return false;
    }
  }

  /**
   * Resolve a dot-notation field path against a variables object.
   */
  private static resolveField(path: string, variables: Record<string, unknown>): unknown {
    const parts = path.split('.');
    let current: unknown = variables;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}
