# Database Architecture

> Stage 2 — Database & Data Layer

## Database Technology

- **Database**: PostgreSQL
- **ORM**: Prisma ORM (`prisma-client-js` generator)
- **Driver**: `@prisma/client` v5.x
- **Schema Location**: `prisma/schema.prisma`

## Connection Architecture

- **Singleton Pattern**: `src/lib/db.ts` provides a single `PrismaClient` instance
- **Hot-reload Protection**: Uses `globalThis` caching to prevent connection exhaustion during Next.js dev server HMR
- **Logging**: Development mode logs `query`, `error`, `warn`. Production logs `error` only.
- **Connection String**: Loaded from `DATABASE_URL` environment variable. Never hardcoded.

## Entity Strategy

Models are grouped by domain:

| Domain | Models |
|---|---|
| Tenancy & Identity | `Tenant`, `User`, `Membership` |
| Authorization | `Role`, `Permission` |
| Audit | `AuditLog` (append-only, immutable) |
| Events | `DomainEvent`, `EventProcessingRecord` |
| Jobs | `JobRecord` |
| Idempotency | `IdempotencyRecord` |
| Workflows | `Workflow`, `WorkflowVersion`, `WorkflowRun`, `WorkflowTask` |
| AI Registry | `AIProviderModel`, `AIUsageRecord` |
| Agents | `Agent`, `AgentVersion`, `AgentCapability`, `AgentPolicy` |
| Tools | `Tool` |
| Integrations | `Integration`, `IntegrationCredential`, `ExternalIdentifier` |
| Configuration | `SystemSetting`, `TenantSetting`, `UserPreference` |
| Documents | `Document`, `DocumentVersion` |

## ID Strategy

- **Type**: UUID v4 for all primary keys (`@default(uuid())`)
- **Rationale**: Non-sequential, safe for external exposure, no information leakage
- **No sequential IDs** are exposed to API consumers

## Tenant Strategy

- **Isolation Model**: Row-level tenant isolation via `tenantId` foreign key
- **Enforcement**: Application-layer via `BaseRepository` (constructor requires `tenantId`, all queries filter by it)
- **Top-level entities**: `Tenant` and `User` are not tenant-scoped (they exist above the tenant boundary)
- **Cross-tenant prevention**: Repository pattern ensures every tenant-scoped query includes `WHERE tenantId = ?`

## Transaction Strategy

- **Tool**: Prisma interactive transactions (`db.$transaction([...])`)
- **Rules**:
  - Use transactions for atomic multi-table writes
  - Keep transactions short — no external service calls inside transactions
  - Read-only operations do not need transactions
- **Optimistic Concurrency**: `Workflow` model has a `version` field; updates increment it and reject stale writes

## Migration Strategy

- **Tool**: Prisma Migrate (`prisma migrate dev` / `prisma migrate deploy`)
- **Rules**:
  - All schema changes via migration files
  - Never modify production schema manually
  - Test migrations against clean database before deploying
  - Prefer additive changes (add column, add table) over destructive ones

## Indexing Strategy

Indexes are created for actual query patterns:

| Table | Index | Reason |
|---|---|---|
| `AuditLog` | `[tenantId, timestamp]` | Tenant audit timeline queries |
| `AuditLog` | `[resourceType, resourceId]` | Resource history lookup |
| `DomainEvent` | `[aggregateType, aggregateId]` | Aggregate event stream |
| `DomainEvent` | `[tenantId, occurredAt]` | Tenant event timeline |
| `JobRecord` | `[queue, state]` | Job polling by workers |
| `JobRecord` | `[state, priority]` | Priority-based job selection |
| `WorkflowRun` | `[tenantId, status]` | Tenant workflow monitoring |
| `WorkflowTask` | `[workflowRunId, sequence]` | Task execution ordering |

## Soft Deletion Strategy

Not universally applied. Classification:

| Category | Entities | Mechanism |
|---|---|---|
| **Immutable** | `AuditLog`, `DomainEvent` | No delete or update operations |
| **Soft delete** | `User` (`isActive`), `Tenant` (`status`) | Status/flag field |
| **Lifecycle** | `JobRecord`, `WorkflowRun` | State machine (terminal states) |
| **Hard delete** | None currently | Reserved for future data retention |

## Audit Strategy

- **Table**: `AuditLog` — append-only
- **Fields**: `actorType`, `actorId`, `action`, `resourceType`, `resourceId`, `metadata` (JSON), `requestId`
- **Write pattern**: Insert only. No update or delete methods exposed.
- **Query pattern**: Indexed for `[tenantId, timestamp]` and `[resourceType, resourceId]`

## Event Persistence Strategy

- **Table**: `DomainEvent` — stores all published domain events
- **Fields**: `eventType`, `aggregateType`, `aggregateId`, `version`, `payload` (JSON)
- **Idempotency**: `EventProcessingRecord` tracks which consumers have processed which events
- **Future**: Supports event sourcing and replay patterns

## Data Retention Strategy

| Category | Retention | Notes |
|---|---|---|
| Operational | Indefinite | Core business data |
| Audit | Indefinite (compliance) | Never auto-delete |
| Events | Indefinite (Stage 2) | Future: partitioning/archival |
| Jobs | Configurable | Completed jobs can be cleaned after retention period |
| AI Usage | 90 days recommended | Future implementation |
| Temporary | 24 hours | Idempotency records with `expiresAt` |

## Backup Considerations

- **Recommendation**: Use managed PostgreSQL (AWS RDS, Azure Database, Supabase) with automated backups
- **Point-in-time recovery**: Enable WAL archiving for production
- **Not implemented in Stage 2**: Backup automation depends on deployment infrastructure (Stage 13)

## Security

- **No plaintext secrets**: `IntegrationCredential.encryptedToken` is encrypted at rest
- **No credentials in source**: `DATABASE_URL` via environment variable only
- **Parameterized queries**: Prisma ORM prevents SQL injection by design
- **Mass assignment protection**: Repositories explicitly specify allowed fields
- **Error sanitization**: Database errors are caught and replaced with safe `AppError` responses
