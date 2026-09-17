import { WorkflowRepository } from '@/lib/data/workflow-repository';
import { AuthorizationService } from '@/lib/auth/authorization';
import { eventBus } from '@/lib/events/event-bus';
import { auditService } from '@/lib/audit';

export class WorkflowService {
  /**
   * Creates a new workflow in the specified tenant context.
   */
  static async createWorkflow(data: { name: string; description?: string }) {
    // 1. Authorize action
    await AuthorizationService.authorize('workflows', 'create');
    const { tenant, user } = await AuthorizationService.resolveContext();
    
    // 2. Perform business logic via Repository
    const repo = new WorkflowRepository(tenant!.id);
    const workflow = await repo.create(data);

    // 3. Publish Domain Event
    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'WorkflowCreated',
      aggregateType: 'Workflow',
      aggregateId: workflow.id,
      tenantId: tenant!.id,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { name: workflow.name, description: workflow.description },
      metadata: { actorId: user.id }
    });

    // 4. Log Audit Event
    await auditService.log({
      actorType: 'USER',
      actorId: user.id,
      action: 'workflow.created',
      resourceType: 'workflow',
      resourceId: workflow.id,
      tenantId: tenant!.id,
      metadata: { name: workflow.name }
    });

    return workflow;
  }

  /**
   * Update a workflow, enforcing state transitions and optimistic concurrency.
   */
  static async updateWorkflow(id: string, data: { name?: string; description?: string; status?: string }, expectedVersion?: number) {
    await AuthorizationService.authorize('workflows', 'update');
    const { tenant, user } = await AuthorizationService.resolveContext();

    const repo = new WorkflowRepository(tenant!.id);
    const updated = await repo.update(id, data, expectedVersion);

    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'WorkflowUpdated',
      aggregateType: 'Workflow',
      aggregateId: updated.id,
      tenantId: tenant!.id,
      version: updated.version,
      timestamp: new Date().toISOString(),
      payload: { changes: Object.keys(data) },
      metadata: { actorId: user.id }
    });

    await auditService.log({
      actorType: 'USER',
      actorId: user.id,
      action: 'workflow.updated',
      resourceType: 'workflow',
      resourceId: updated.id,
      tenantId: tenant!.id,
    });

    return updated;
  }

  /**
   * Lists workflows with cursor pagination.
   */
  static async listWorkflows(pagination?: { take?: number; skip?: number; cursor?: string }) {
    await AuthorizationService.authorize('workflows', 'read');
    const { tenant } = await AuthorizationService.resolveContext();
    const repo = new WorkflowRepository(tenant!.id);
    return repo.list(pagination);
  }

  /**
   * Get workflow by ID with its latest version.
   */
  static async getWorkflow(id: string) {
    await AuthorizationService.authorize('workflows', 'read');
    const { tenant } = await AuthorizationService.resolveContext();
    const repo = new WorkflowRepository(tenant!.id);
    return repo.findById(id);
  }

  /**
   * Request execution of a workflow version.
   */
  static async executeWorkflow(id: string, metadata?: Record<string, unknown>, idempotencyKey?: string) {
    await AuthorizationService.authorize('workflows', 'execute');
    const { tenant, user } = await AuthorizationService.resolveContext();
    const repo = new WorkflowRepository(tenant!.id);

    // Get the latest version to execute
    const workflow = await repo.findById(id);
    if (!workflow.versions || workflow.versions.length === 0) {
      throw new Error('Workflow has no published versions');
    }

    const latestVersion = workflow.versions[0];
    
    // We would enqueue a job here or publish an ExecutionRequested event.
    // For Stage 4, we create the Run record and publish the event.
    const run = await repo.createRun(latestVersion.id);

    await eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: 'WorkflowExecutionRequested',
      aggregateType: 'WorkflowRun',
      aggregateId: run.id,
      tenantId: tenant!.id,
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { workflowId: id, versionId: latestVersion.id, metadata, idempotencyKey },
      metadata: { actorId: user.id }
    });

    await auditService.log({
      actorType: 'USER',
      actorId: user.id,
      action: 'workflow.execution.requested',
      resourceType: 'workflow',
      resourceId: workflow.id,
      tenantId: tenant!.id,
      metadata: { runId: run.id }
    });

    return run;
  }
}
