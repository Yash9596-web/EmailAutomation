// ============================================================================
// Domain Event Bus — In-process pub/sub with optional database persistence
// ============================================================================

import { logger } from '@/lib/logger';
import db from '@/lib/db';

export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  tenantId?: string;
  timestamp: string;
  version: number;
  payload: T;
  metadata?: Record<string, unknown>;
}

type EventHandler = (event: DomainEvent) => Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Publish an event: persist to database then dispatch to in-process handlers.
   * Database persistence failure logs an error but does NOT prevent handler dispatch.
   */
  async publish(event: DomainEvent): Promise<void> {
    // 1. Persist to DomainEvent table
    try {
      await db.domainEvent.create({
        data: {
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          tenantId: event.tenantId,
          version: event.version,
          payload: event.payload as any,
          metadata: event.metadata as any,
        },
      });
    } catch (error) {
      logger.error(
        { message: 'Failed to persist domain event', module: 'events', eventType: event.eventType },
        error instanceof Error ? error : new Error(String(error))
      );
    }

    // 2. Dispatch to in-process handlers
    const typeHandlers = this.handlers.get(event.eventType) || [];
    for (const handler of typeHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { message: `Event handler failed for ${event.eventType}`, module: 'events' },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Check if an event has already been processed by a specific consumer.
   * Supports idempotent event processing (Section 24).
   */
  async isProcessed(eventId: string, consumer: string): Promise<boolean> {
    const record = await db.eventProcessingRecord.findUnique({
      where: { eventId_consumer: { eventId, consumer } },
    });
    return record !== null;
  }

  /**
   * Mark an event as processed by a consumer.
   */
  async markProcessed(eventId: string, consumer: string): Promise<void> {
    await db.eventProcessingRecord.upsert({
      where: { eventId_consumer: { eventId, consumer } },
      update: {},
      create: { eventId, consumer, status: 'Processed' },
    });
  }
}

export const eventBus = new EventBus();
