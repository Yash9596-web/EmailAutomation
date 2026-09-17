# Background Jobs Architecture

> Stage 4 — Job Queue & Worker

## Overview

Background jobs handle async work that should not block HTTP requests. The system uses a database-backed job queue (`JobRecord` table) with a polling worker.

## Job Lifecycle

```
Queued → Running → Succeeded
                 → Failed
                 → Retrying → Running → ...
Queued → Cancelled
```

## Components

| Component | Location | Purpose |
|---|---|---|
| `DatabaseJobQueue` | `src/lib/jobs/job-queue.ts` | Enqueue, cancel, status check |
| `JobWorker` | `src/lib/jobs/job-worker.ts` | Poll, lock, execute, retry/fail |

## Enqueue

```typescript
await jobQueue.enqueue('workflow-execution', payload, {
  tenantId: '...',
  maxRetries: 3,
  priority: 0,
  idempotencyKey: 'unique-key',
});
```

## Idempotency

If an `idempotencyKey` is provided, the queue checks for an existing job with the same key and returns its ID instead of creating a duplicate.

## Retry Strategy

- **Transient failures** (errors with `isTransient = true`): Retried up to `maxRetries`
- **Permanent failures** (validation errors, business rule violations): Immediately marked `Failed`
- **Backoff**: Currently immediate retry; exponential backoff is a future enhancement

## Tenant Security

Every job record stores `tenantId`. Job handlers receive tenant context and must use it when accessing tenant-scoped resources.

## Worker Registration

Handlers are registered in `src/instrumentation.ts`:

```typescript
jobWorker.registerHandler('workflow-execution', async (payload, context) => {
  // context.tenantId is available
  // context.jobId for correlation
  // context.attempt for retry tracking
});
```
