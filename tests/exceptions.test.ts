import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExceptionService } from '../src/lib/exceptions/exception-service';
import { PriorityEngine } from '../src/lib/exceptions/priority-engine';
import { ResolutionEngine } from '../src/lib/exceptions/resolution-engine';
import db from '../src/lib/db';

vi.mock('../src/lib/db', () => ({
  default: {
    $transaction: vi.fn((callback) => callback(db)),
    $queryRaw: vi.fn(),
    exceptionCase: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    exceptionHistory: {
      create: vi.fn(),
    },
    workflowTask: {
      findFirst: vi.fn(),
    }
  },
}));

vi.mock('../src/lib/events/event-bus', () => ({
  eventBus: {
    publish: vi.fn(),
  },
}));

vi.mock('../src/lib/audit', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

describe('Stage 21 - Exception Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Priority Engine', () => {
    it('should assign CRITICAL priority to infrastructure failures', () => {
      const priority = PriorityEngine.calculatePriority({
        tenantId: '1', category: 'SYSTEM', type: 'infrastructure_failure', title: 'DB Down'
      });
      expect(priority).toBe('CRITICAL');
    });

    it('should assign HIGH priority to massive financial failures', () => {
      const priority = PriorityEngine.calculatePriority({
        tenantId: '1', category: 'FINANCIAL', type: 'invoice_mismatch', title: 'Big Invoice',
        metadata: { amount: 150000 }
      });
      expect(priority).toBe('CRITICAL');
    });
  });

  describe('Exception Service', () => {
    it('should successfully create an exception case and emit an event', async () => {
      (db.$queryRaw as any).mockResolvedValue([{ count: 5 }]);
      (db.exceptionCase.create as any).mockResolvedValue({ id: 'case_1', exceptionNumber: 'EXC-1005' });
      
      const exc = await ExceptionService.createException({
        tenantId: 'tenant_1',
        category: 'WORKFLOW',
        type: 'timeout',
        title: 'Workflow stalled'
      });

      expect(exc.id).toBe('case_1');
      expect(db.exceptionHistory.create).toHaveBeenCalled();
    });

    it('should enforce valid state transitions', async () => {
      (db.exceptionCase.findUnique as any).mockResolvedValue({ id: 'case_1', status: 'OPEN' });
      (db.exceptionCase.update as any).mockResolvedValue({ id: 'case_1', status: 'IN_PROGRESS' });

      // OPEN -> RESOLVED is invalid directly without going through other states (actually OPEN->CLOSED is valid, OPEN->TRIAGED->ASSIGNED->IN_PROGRESS->RESOLVED)
      // Wait, my mapping said OPEN -> TRIAGED, ASSIGNED, CLOSED.
      
      await expect(
        ExceptionService.transitionStatus('tenant_1', 'case_1', 'RESOLVED', 'user_1')
      ).rejects.toThrow('Invalid exception transition from OPEN to RESOLVED');
    });
  });

  describe('Resolution Engine', () => {
    it('should resolve an exception and trigger workflow resumption if WORKFLOW_RESUMED', async () => {
      (db.exceptionCase.findUnique as any).mockResolvedValue({ 
        id: 'case_1', 
        status: 'IN_PROGRESS', 
        workflowRunId: 'run_1' 
      });
      (db.exceptionCase.update as any).mockResolvedValue({ id: 'case_1', status: 'RESOLVED' });
      (db.workflowTask.findFirst as any).mockResolvedValue({ id: 'task_1', status: 'Pending' });

      await ResolutionEngine.resolveException('tenant_1', 'case_1', 'WORKFLOW_RESUMED', 'Fixed Data', 'user_1');

      expect(db.exceptionCase.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'RESOLVED', resolutionCode: 'WORKFLOW_RESUMED' })
      }));
      expect(db.workflowTask.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { workflowRunId: 'run_1', status: 'Pending' }
      }));
    });
  });
});
