// ============================================================================
// Execution Engine — Central workflow execution coordinator
// ============================================================================

import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';
import { ActionRegistry } from './action-registry';
import { TriggerRegistry } from './trigger-registry';
import { ConditionEngine } from './condition-engine';
import { VariableResolver } from './variable-resolver';
import {
  WorkflowDefinition, WorkflowNode, ExecutionContext,
  StepResult, EXECUTION_LIMITS, VALID_EXECUTION_TRANSITIONS,
  ExecutionStatus,
} from './types';

export class ExecutionEngine {
  /**
   * Execute a workflow run by ID. This is the main entry point called by the job worker.
   */
  static async execute(runId: string): Promise<void> {
    // 1. Load the run and its immutable version definition
    const run = await db.workflowRun.findUnique({
      where: { id: runId },
      include: {
        version: {
          include: { workflow: true },
        },
      },
    });

    if (!run) {
      logger.error({ message: `Run ${runId} not found`, module: 'engine' });
      return;
    }

    // 2. Guard: only execute if in valid starting state
    if (run.status !== 'Pending' && run.status !== 'Queued') {
      logger.warn({ message: `Run ${runId} in state ${run.status}, skipping`, module: 'engine' });
      return;
    }

    const definition = run.version.definition as unknown as WorkflowDefinition;
    if (!definition || !definition.nodes) {
      await this.failRun(runId, 'Invalid workflow definition');
      return;
    }

    // 3. Transition to Running
    await this.transitionRun(runId, 'Running');

    // 4. Publish execution started event
    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'WorkflowExecutionStarted',
      aggregateType: 'WorkflowRun',
      aggregateId: runId,
      tenantId: run.tenantId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { workflowId: run.version.workflowId },
    });

    // 5. Build execution context
    const context: ExecutionContext = {
      executionId: runId,
      tenantId: run.tenantId,
      workflowId: run.version.workflowId,
      versionId: run.workflowVersionId,
      actorType: 'SYSTEM',
      variables: {
        trigger: { input: (run.metadata as any) || {} },
      },
      input: (run.metadata as any) || {},
      depth: 0,
    };

    // 6. Find trigger node and start walking
    const triggerNode = definition.nodes.find(n => n.type === 'TRIGGER');
    if (!triggerNode) {
      await this.failRun(runId, 'No TRIGGER node in definition');
      return;
    }

    try {
      await this.executeNode(runId, triggerNode, definition, context, 0);
    } catch (error: any) {
      logger.error(
        { message: `Execution failed: ${error.message}`, module: 'engine', runId },
        error
      );
      await this.failRun(runId, error.message);
    }
  }

  /**
   * Execute a single node, persist the step, then walk to the next node(s).
   */
  private static async executeNode(
    runId: string,
    node: WorkflowNode,
    definition: WorkflowDefinition,
    context: ExecutionContext,
    stepCount: number
  ): Promise<void> {
    // Runaway protection
    if (stepCount >= EXECUTION_LIMITS.MAX_STEPS_PER_EXECUTION) {
      await this.failRun(runId, `Execution exceeded maximum step limit (${EXECUTION_LIMITS.MAX_STEPS_PER_EXECUTION})`);
      return;
    }

    // Check if run was cancelled
    const currentRun = await db.workflowRun.findUnique({ where: { id: runId }, select: { status: true } });
    if (currentRun?.status === 'Cancelled') return;

    // Persist step as Running
    const step = await db.workflowTask.create({
      data: {
        workflowRunId: runId,
        taskType: `${node.type}:${node.config?.actionType || node.type}`,
        status: 'Running',
        sequence: stepCount,
        startedAt: new Date(),
      },
    });

    let result: StepResult;

    try {
      result = await this.dispatchNode(node, context);
    } catch (error: any) {
      result = {
        status: 'failure',
        error: error.message,
        errorCategory: 'INTERNAL_ERROR',
      };
    }

    // Persist step result
    await db.workflowTask.update({
      where: { id: step.id },
      data: {
        status: result.status === 'success' ? 'Succeeded' : result.status === 'waiting' ? 'Pending' : 'Failed',
        outputRef: result.data ? JSON.stringify(result.data).slice(0, 4096) : undefined,
        error: result.error,
        completedAt: new Date(),
      },
    });

    // Merge output into variables
    if (result.data) {
      context.variables = VariableResolver.mergeStepOutput(context.variables, node.id, result.data);
    }

    // Handle result
    if (result.status === 'failure') {
      await this.failRun(runId, result.error || 'Step failed');
      return;
    }

    if (result.status === 'waiting') {
      await this.transitionRun(runId, 'Waiting');
      return;
    }

    // Find next node(s) via edges
    if (node.type === 'END') {
      await this.succeedRun(runId);
      return;
    }

    const nextNodeId = this.resolveNextNode(node, definition, result, context);
    if (!nextNodeId) {
      // No outgoing edge — implicit completion
      await this.succeedRun(runId);
      return;
    }

    const nextNode = definition.nodes.find(n => n.id === nextNodeId);
    if (!nextNode) {
      await this.failRun(runId, `Next node ${nextNodeId} not found in definition`);
      return;
    }

    // Recurse to next node
    await this.executeNode(runId, nextNode, definition, context, stepCount + 1);
  }

  /**
   * Dispatch execution to the appropriate handler based on node type.
   */
  private static async dispatchNode(node: WorkflowNode, context: ExecutionContext): Promise<StepResult> {
    switch (node.type) {
      case 'TRIGGER': {
        const triggerType = (node.config?.triggerType as string) || 'MANUAL';
        const handler = TriggerRegistry.get(triggerType);
        if (!handler) return { status: 'failure', error: `Unknown trigger type: ${triggerType}`, errorCategory: 'CONFIGURATION_ERROR' };
        return handler.evaluate(context, node.config);
      }

      case 'ACTION': {
        const actionType = (node.config?.actionType as string);
        if (!actionType) return { status: 'failure', error: 'ACTION node missing "actionType"', errorCategory: 'CONFIGURATION_ERROR' };
        const handler = ActionRegistry.get(actionType);
        if (!handler) return { status: 'failure', error: `Unknown action type: ${actionType}`, errorCategory: 'CONFIGURATION_ERROR' };

        // Validate config before executing
        const validation = handler.validate(node.config);
        if (!validation.valid) {
          return { status: 'failure', error: validation.errors?.join(', '), errorCategory: 'VALIDATION_ERROR' };
        }

        return handler.execute(context, node.config);
      }

      case 'CONDITION': {
        const condition = node.config?.condition as any;
        if (!condition) return { status: 'failure', error: 'CONDITION node missing "condition" config', errorCategory: 'CONFIGURATION_ERROR' };
        const result = ConditionEngine.evaluate(condition, context.variables);
        return { status: 'success', data: { result }, nextNodeId: result ? 'true' : 'false' };
      }

      case 'DELAY': {
        // For real delay, we would persist resume_at and return 'waiting'
        // For Stage 5 foundation, we log and proceed
        const delayMs = (node.config?.delayMs as number) || 0;
        if (delayMs > 0 && delayMs <= 5000) {
          await new Promise(r => setTimeout(r, delayMs));
        }
        return { status: 'success', data: { delayed: true, delayMs } };
      }

      case 'APPROVAL': {
        // Set execution to Waiting — external action required to resume
        return { status: 'waiting', data: { awaitingApproval: true } };
      }

      case 'END': {
        return { status: 'success', data: { ended: true } };
      }

      default:
        return { status: 'failure', error: `Unsupported node type: ${node.type}`, errorCategory: 'CONFIGURATION_ERROR' };
    }
  }

  /**
   * Resolve the next node ID based on outgoing edges and condition results.
   */
  private static resolveNextNode(
    currentNode: WorkflowNode,
    definition: WorkflowDefinition,
    result: StepResult,
    context: ExecutionContext
  ): string | null {
    const outgoingEdges = definition.edges.filter(e => e.source === currentNode.id);

    if (outgoingEdges.length === 0) return null;

    // For CONDITION nodes, use the branch label
    if (currentNode.type === 'CONDITION' && result.nextNodeId) {
      const matchingEdge = outgoingEdges.find(e => e.condition === result.nextNodeId);
      if (matchingEdge) return matchingEdge.target;

      // Fall back to 'default' edge
      const defaultEdge = outgoingEdges.find(e => e.condition === 'default' || !e.condition);
      return defaultEdge?.target || null;
    }

    // For other nodes, take the first (or only) outgoing edge
    return outgoingEdges[0].target;
  }

  // --- State transition helpers ---

  private static async transitionRun(runId: string, newStatus: ExecutionStatus) {
    await db.workflowRun.update({
      where: { id: runId },
      data: {
        status: newStatus,
        ...(newStatus === 'Running' ? { startedAt: new Date() } : {}),
      },
    });
  }

  private static async failRun(runId: string, error: string) {
    await db.workflowRun.update({
      where: { id: runId },
      data: { status: 'Failed', error, completedAt: new Date() },
    });

    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'WorkflowExecutionFailed',
      aggregateType: 'WorkflowRun',
      aggregateId: runId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { error },
    });
  }

  private static async succeedRun(runId: string) {
    await db.workflowRun.update({
      where: { id: runId },
      data: { status: 'Succeeded', completedAt: new Date() },
    });

    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'WorkflowExecutionCompleted',
      aggregateType: 'WorkflowRun',
      aggregateId: runId,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }
}
