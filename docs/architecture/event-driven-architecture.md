# Event-Driven Architecture

> Stage 4 — Domain Events & Consumers

## Overview

Domain events represent meaningful state changes in the system. They are persisted to the `DomainEvent` table and dispatched to in-process consumers via the `EventBus`.

## Event Flow

```
Service performs state change
  → Database write succeeds
  → EventBus.publish(event)
    → Persist to DomainEvent table
    → Dispatch to registered consumers
      → Consumer checks idempotency (EventProcessingRecord)
      → Consumer performs side-effect (e.g., enqueue job)
      → Consumer marks event as processed
```

## Event Structure

Every event includes:
- `eventId` — UUID, globally unique
- `eventType` — e.g., `WorkflowCreated`
- `aggregateType` — e.g., `Workflow`
- `aggregateId` — ID of the affected entity
- `tenantId` — Tenant scope
- `version` — Schema version of this event type
- `timestamp` — ISO 8601
- `payload` — Domain-specific data (no secrets)
- `metadata` — Actor ID, request ID, etc.

## Naming Convention

`EntityActionPastTense`:
- `WorkflowCreated`
- `WorkflowUpdated`
- `WorkflowExecutionRequested`

## Idempotency

The `EventProcessingRecord` table tracks which consumers have processed which events:
- `@@unique([eventId, consumer])` prevents double-processing
- Consumers call `eventBus.isProcessed()` before acting
- Consumers call `eventBus.markProcessed()` after success

## Consumers

Consumers are registered in `src/lib/services/event-consumer.ts` and bootstrapped via `src/instrumentation.ts` on server start.

| Consumer | Listens To | Action |
|---|---|---|
| `WorkflowExecutionJobScheduler` | `WorkflowExecutionRequested` | Enqueues a background job |

## Future Consumers (not yet implemented)

- Notification dispatcher
- Webhook delivery
- Analytics aggregation
- Search index updates
