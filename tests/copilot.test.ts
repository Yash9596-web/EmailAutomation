import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CopilotEngine } from '../src/lib/ai/copilot/engine';
import { OperationsAnalyticsService } from '../src/lib/analytics/operations';
import { CopilotToolsRegistry } from '../src/lib/ai/copilot/tools';
import db from '../src/lib/db';

vi.mock('../src/lib/db', () => ({
  default: {
    $transaction: vi.fn(async (cb) => cb(db)),
    conversation: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    exceptionCase: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findUnique: vi.fn()
    },
    workflowRun: {
      count: vi.fn()
    },
    invoice: {
      count: vi.fn()
    }
  },
}));

vi.mock('../src/lib/auth/authorization', () => ({
  AuthorizationService: {
    authorize: vi.fn().mockResolvedValue(true)
  }
}));

describe('Stage 22 - Manufacturing Copilot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Operations Analytics (Tools)', () => {
    it('should aggregate health summary securely via DB count', async () => {
      (db.exceptionCase.count as any).mockResolvedValueOnce(5); // Open
      (db.exceptionCase.count as any).mockResolvedValueOnce(1); // Critical
      (db.workflowRun.count as any).mockResolvedValueOnce(2); // Failed

      const result = await OperationsAnalyticsService.getHealthSummary('tenant_1');
      expect(result.openExceptions).toBe(5);
      expect(result.criticalExceptions).toBe(1);
      expect(result.failedWorkflows24h).toBe(2);
      expect(result.healthScore).toBe(88.5); // 100 - (1*5 + 2*2 + 5*0.5)
    });

    it('should not allow executing tools without tenant context', async () => {
      const tool = CopilotToolsRegistry['get_health_summary'];
      await expect(tool.execute(undefined as any, {})).rejects.toThrow();
    });
  });

  describe('Copilot Engine (Query Planning)', () => {
    it('should detect top exceptions intent and invoke the correct tool', async () => {
      (db.conversation.create as any).mockResolvedValue({ id: 'conv_1' });
      (db.message.create as any).mockResolvedValue({ id: 'msg_1', structuredData: { tool: 'get_top_exceptions' } });
      
      const spyTool = vi.spyOn(CopilotToolsRegistry['get_top_exceptions'], 'execute');
      spyTool.mockResolvedValueOnce([{ category: 'WORKFLOW', type: 'timeout', count: 10 }]);

      const result = await CopilotEngine.processMessage({
        tenantId: 'tenant_1',
        userId: 'user_1',
        content: 'Show me the top exceptions we have had recently'
      });

      expect(spyTool).toHaveBeenCalledWith('tenant_1', {});
      expect(db.conversation.create).toHaveBeenCalled();
      expect(db.message.create).toHaveBeenCalledTimes(2); // 1 user, 1 assistant
    });

    it('should correctly parse exception lookup intent and provide citations', async () => {
      (db.conversation.create as any).mockResolvedValue({ id: 'conv_1' });
      
      const mockResult = {
        exceptionNumber: 'EXC-1024',
        title: 'Workflow Failed',
        status: 'OPEN',
        priority: 'CRITICAL',
        category: 'WORKFLOW',
        dueAt: new Date(),
        history: []
      };

      const spyTool = vi.spyOn(CopilotToolsRegistry['get_exception_details'], 'execute');
      spyTool.mockResolvedValueOnce(mockResult);
      
      (db.message.create as any).mockImplementation(async ({ data }: any) => {
        return { id: 'msg', ...data };
      });

      const result = await CopilotEngine.processMessage({
        tenantId: 'tenant_1',
        userId: 'user_1',
        content: 'What is the status of EXC-1024?'
      });

      expect(spyTool).toHaveBeenCalledWith('tenant_1', { exceptionNumber: 'EXC-1024' });
      expect(result.message.role).toBe('ASSISTANT');
      expect((result.message.citations as any[])?.length).toBeGreaterThan(0);
      expect((result.message.structuredData as any)?.tool).toBe('get_exception_details');
    });
  });
});
