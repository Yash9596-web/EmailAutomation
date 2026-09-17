// ============================================================================
// Variable Resolver — Safe dot-notation variable resolution for workflows
// ============================================================================

import { EXECUTION_LIMITS } from './types';

export class VariableResolver {
  /**
   * Resolve a template string containing {{variable.path}} references.
   * Only resolves from approved execution context data.
   */
  static resolveTemplate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
      const value = this.resolve(path.trim(), variables);
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * Resolve a single dot-notation path against the variables map.
   */
  static resolve(path: string, variables: Record<string, unknown>): unknown {
    if (!path || typeof path !== 'string') return undefined;

    const parts = path.split('.');
    let current: unknown = variables;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    // Size guard — prevent massive variable values from propagating
    if (typeof current === 'string' && current.length > EXECUTION_LIMITS.MAX_VARIABLE_SIZE_BYTES) {
      throw new Error(`Variable "${path}" exceeds maximum size limit`);
    }

    return current;
  }

  /**
   * Merge step output into the execution variables under the node's ID namespace.
   */
  static mergeStepOutput(
    variables: Record<string, unknown>,
    nodeId: string,
    output: Record<string, unknown> | undefined
  ): Record<string, unknown> {
    if (!output) return variables;

    return {
      ...variables,
      steps: {
        ...(variables.steps as Record<string, unknown> || {}),
        [nodeId]: output,
      },
    };
  }
}
