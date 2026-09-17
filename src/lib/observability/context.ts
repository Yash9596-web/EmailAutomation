import { AsyncLocalStorage } from 'async_hooks';

export interface ExecutionContextState {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  operation?: string;
}

export const executionContext = new AsyncLocalStorage<ExecutionContextState>();

export function getCorrelationId(): string | undefined {
  return executionContext.getStore()?.correlationId;
}

export function runWithContext<T>(state: ExecutionContextState, fn: () => T): T {
  return executionContext.run(state, fn);
}
