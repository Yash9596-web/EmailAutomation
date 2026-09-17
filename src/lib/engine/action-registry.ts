// ============================================================================
// Action Registry — Plugin-style action handler registration
// ============================================================================

import { ActionHandler } from './types';
import { logger } from '@/lib/logger';

class ActionRegistryImpl {
  private handlers = new Map<string, ActionHandler>();

  register(handler: ActionHandler): void {
    if (this.handlers.has(handler.type)) {
      logger.warn({ message: `Overwriting action handler: ${handler.type}`, module: 'engine' });
    }
    this.handlers.set(handler.type, handler);
    logger.info({ message: `Action registered: ${handler.type}`, module: 'engine' });
  }

  get(type: string): ActionHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  listTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const ActionRegistry = new ActionRegistryImpl();
