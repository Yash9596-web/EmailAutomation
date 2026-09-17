# Stage 14: Performance Baseline

## 1. Current Architecture Overview
- **Framework**: Next.js 16 (App Router), API-driven.
- **Runtime**: Node.js v20.
- **Database**: PostgreSQL with Prisma ORM.
- **Auth**: Stateless JWT inside HttpOnly cookies with DB-backed revocation records.
- **Workers**: Asynchronous processing via `BackgroundJob` table and engine triggers.
- **Integrations**: Webhooks, REST, AI Mock Providers, ERP Sync.

## 2. Identified Bottlenecks (Pre-Stage 14)
1. **N+3 Auth Query Problem**: Every authenticated API request was generating at least 3 database queries:
   - `SELECT * FROM Session WHERE id = ?`
   - `SELECT * FROM User WHERE id = ?`
   - `SELECT * FROM Membership INCLUDE Role INCLUDE Permissions WHERE userId = ? AND tenantId = ?`
   *Impact*: Heavy DB CPU usage under load, increased API latency.
2. **Absolute Counts in Pagination**: The API endpoints (`/documents`, `/workflows`, `/executions`) relied on `db.table.count()` to return `totalCount`.
   *Impact*: Performance degrades significantly when table sizes exceed 1 million rows due to Postgres sequential scans.
3. **Missing Multi-tenant Indexes**: Certain heavily queried models lacked composite indexes, such as `@@index([tenantId, createdAt])` for efficient sorting.
4. **Lack of Caching**: Configuration, reference data, and session data were strictly fetched from disk/DB on every invocation.

## 3. Current Measured Limits
- **Authentication Overhead**: ~10-15ms overhead per request locally.
- **List Endpoint Latency**: ~20-30ms locally, degrades non-linearly with data size due to `.count()`.
- **Database Connections**: Shared default pool size; under spike traffic, connection exhaustion is likely without PgBouncer or caching.

## 4. Heavy Operations
- **OCR / AI Inference**: CPU-intensive operations (simulated by timeout presently) block the event loop if not offloaded.
- **Workflow State Machine**: Parsing complex JSON conditions per node execution.

## 5. Storage and Network
- **Documents**: Processed sequentially rather than parallelized.
- **Payload Size**: Uncompressed large `extractData` JSON payloads.
