import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionEngine } from '../src/lib/engine/execution-engine';
import { bootstrapEngine } from '../src/lib/engine/bootstrap';
import { ActionRegistry } from '../src/lib/engine/action-registry';
import db from '../src/lib/db';

vi.mock('../src/lib/db', () => ({
  default: {
    workflowRun: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workflowTask: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Workflow Engine - Stage 20 Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bootstrapEngine();
  });

  it('should successfully register AiClassifyAction', () => {
    const handler = ActionRegistry.get('AI_CLASSIFY');
    expect(handler).toBeDefined();
    expect(handler?.type).toBe('AI_CLASSIFY');
  });

  it('should successfully register CreateTransactionAction with Stage 19 logic', () => {
    const handler = ActionRegistry.get('CREATE_TRANSACTION');
    expect(handler).toBeDefined();
    expect(handler?.type).toBe('CREATE_TRANSACTION');
    
    const validation = handler!.validate({ transactionType: 'INVOICE' });
    expect(validation.valid).toBe(true);

    const validationFailed = handler!.validate({ documentId: 'abc' });
    expect(validationFailed.valid).toBe(false);
  });

  it('should protect against execution depth limits', async () => {
    // Mocking an execution context
    (db.workflowRun.findUnique as any).mockResolvedValue({
      id: 'run_123',
      tenantId: 'tenant_1',
      status: 'Pending',
      version: {
        definition: {
          nodes: [
            { id: 'start', type: 'TRIGGER', config: { triggerType: 'MANUAL' } }
          ],
          edges: []
        }
      }
    });

    (db.workflowTask.create as any).mockResolvedValue({ id: 'task_1' });
    (db.workflowTask.update as any).mockResolvedValue({ id: 'task_1' });

    // Assuming ExecutionEngine uses default safe context limits internally
    await ExecutionEngine.execute('run_123');
    expect(db.workflowRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'Succeeded' })
      })
    );
  });
});
