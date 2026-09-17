// ============================================================================
// Graph Validator — Validates workflow definition structure before publishing
// ============================================================================

import { WorkflowDefinition, WorkflowNode, WorkflowEdge, EXECUTION_LIMITS } from './types';
import { ValidationError } from '@/lib/errors';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class GraphValidator {
  /**
   * Full validation of a workflow definition.
   * Must pass before a workflow version can be published.
   */
  static validate(definition: WorkflowDefinition): ValidationResult {
    const errors: string[] = [];

    // 1. Basic structure
    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      errors.push('Definition must contain a "nodes" array');
      return { valid: false, errors };
    }
    if (!definition.edges || !Array.isArray(definition.edges)) {
      errors.push('Definition must contain an "edges" array');
      return { valid: false, errors };
    }

    // 2. Node count limit
    if (definition.nodes.length > EXECUTION_LIMITS.MAX_NODES_PER_DEFINITION) {
      errors.push(`Too many nodes (max ${EXECUTION_LIMITS.MAX_NODES_PER_DEFINITION})`);
    }
    if (definition.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // 3. Node ID uniqueness
    const nodeIds = new Set<string>();
    for (const node of definition.nodes) {
      if (!node.id) {
        errors.push('Every node must have an "id"');
        continue;
      }
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      // 4. Valid node types
      const validTypes = ['TRIGGER', 'ACTION', 'CONDITION', 'DELAY', 'APPROVAL', 'END'];
      if (!validTypes.includes(node.type)) {
        errors.push(`Invalid node type "${node.type}" on node ${node.id}`);
      }
    }

    // 5. Edge references
    for (const edge of definition.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge references missing source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge references missing target node: ${edge.target}`);
      }
    }

    // 6. Trigger node existence
    const triggers = definition.nodes.filter(n => n.type === 'TRIGGER');
    if (triggers.length === 0) {
      errors.push('Workflow must have at least one TRIGGER node');
    }
    if (triggers.length > 1) {
      errors.push('Workflow must have exactly one TRIGGER node');
    }

    // 7. END node existence
    const endNodes = definition.nodes.filter(n => n.type === 'END');
    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one END node');
    }

    // 8. Cycle detection (DFS)
    if (errors.length === 0) {
      const cycleErrors = this.detectCycles(definition.nodes, definition.edges);
      errors.push(...cycleErrors);
    }

    // 9. Reachability — every node must be reachable from the trigger
    if (errors.length === 0 && triggers.length === 1) {
      const reachable = this.findReachable(triggers[0].id, definition.edges);
      for (const node of definition.nodes) {
        if (node.type !== 'TRIGGER' && !reachable.has(node.id)) {
          errors.push(`Node ${node.id} is not reachable from the trigger`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * DFS-based cycle detection.
   */
  private static detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const adjacency = new Map<string, string[]>();
    for (const node of nodes) adjacency.set(node.id, []);
    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge.target);
    }

    const errors: string[] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (inStack.has(nodeId)) {
        errors.push(`Cycle detected involving node: ${nodeId}`);
        return true;
      }
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      inStack.add(nodeId);

      for (const neighbor of adjacency.get(nodeId) || []) {
        if (dfs(neighbor)) return true;
      }

      inStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) dfs(node.id);
    }

    return errors;
  }

  /**
   * BFS to find all reachable nodes from a start node.
   */
  private static findReachable(startId: string, edges: WorkflowEdge[]): Set<string> {
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
      adjacency.get(edge.source)!.push(edge.target);
    }

    const visited = new Set<string>();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of adjacency.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return visited;
  }
}
