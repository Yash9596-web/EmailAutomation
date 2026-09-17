# Service Layer Architecture

> Stage 4 — Core API & Service Layer

## Overview

The service layer sits between API route handlers and the data-access repositories. It encapsulates all business logic, authorization enforcement, domain event publishing, and audit logging.

## Separation of Concerns

```
API Route Handler
  → Parse request body/params
  → Validate with Zod schemas
  → Call Service method
  → Return formatted response

Service Layer
  → Enforce authorization (AuthorizationService)
  → Resolve tenant context
  → Apply business rules (state transitions, validations)
  → Call Repository for data access
  → Publish domain events (EventBus)
  → Create audit entries (AuditService)
  → Return domain result

Repository Layer
  → Execute tenant-scoped database queries
  → Enforce pagination bounds
  → Enforce optimistic concurrency
  → Never bypass tenant isolation
```

## Services

| Service | Location | Responsibilities |
|---|---|---|
| `WorkflowService` | `src/lib/services/workflow-service.ts` | CRUD, versioning, execution requests, state transitions |
| `AuthorizationService` | `src/lib/auth/authorization.ts` | Context resolution, permission checking |
| `AuditService` | `src/lib/audit.ts` | Append-only audit event creation |
| `SessionService` | `src/lib/auth/session.ts` | Session lifecycle, cookie management |

## Rules

1. **No business logic in routes** — Routes only parse, validate, delegate, and format.
2. **No direct DB access from routes** — Always go through a Service → Repository chain.
3. **Authorization before business logic** — Every service method calls `AuthorizationService.authorize()` first.
4. **Events after successful state change** — Domain events are published only after the database write succeeds.
5. **Audit for security-sensitive operations** — Every create/update/delete/execute action logs an audit event.
