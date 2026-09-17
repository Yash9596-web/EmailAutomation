// ============================================================================
// Trigger Registry — Plugin-style trigger handler registration
// ============================================================================

import { TriggerHandler } from './types';
import { logger } from '@/lib/logger';

class TriggerRegistryImpl {
  private handlers = new Map<string, TriggerHandler>();

  register(handler: TriggerHandler): void {
    this.handlers.set(handler.type, handler);
    logger.info({ message: `Trigger registered: ${handler.type}`, module: 'engine' });
  }

  get(type: string): TriggerHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  listTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const TriggerRegistry = new TriggerRegistryImpl();
