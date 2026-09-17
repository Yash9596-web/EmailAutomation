import { describe, it, expect } from 'vitest';
import { runWithContext, getCorrelationId, executionContext } from '@/lib/observability/context';

describe('Execution Context (Correlation IDs)', () => {
  it('propagates correlationId through async context', () => {
    const testId = 'corr-' + Date.now();
    runWithContext({ correlationId: testId }, () => {
      expect(getCorrelationId()).toBe(testId);
    });
  });

  it('returns undefined outside of context', () => {
    expect(getCorrelationId()).toBeUndefined();
  });

  it('isolates contexts between runs', () => {
    runWithContext({ correlationId: 'ctx-a' }, () => {
      expect(getCorrelationId()).toBe('ctx-a');
    });
    runWithContext({ correlationId: 'ctx-b' }, () => {
      expect(getCorrelationId()).toBe('ctx-b');
    });
  });

  it('carries tenantId in context', () => {
    runWithContext({ correlationId: 'test', tenantId: 'tenant-123' }, () => {
      const store = executionContext.getStore();
      expect(store?.tenantId).toBe('tenant-123');
    });
  });
});
