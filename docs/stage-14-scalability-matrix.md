# Stage 14: Scalability Matrix

| Scale | Expected Result | Notes |
|-------|-----------------|-------|
| **1 tenant** | Stable | Architecture is well isolated via `tenantId`. LRU Auth cache minimizes per-tenant overhead. |
| **10 tenants** | Stable | DB index `@@index([tenantId])` ensures logical isolation runs quickly. |
| **100 tenants** | Stable | Shared nothing architecture inside `tenantId` boundaries means queries scale linearly with hardware. |
| **1,000 tenants** | Architecture reviewed | Connection pooling becomes critical here. We must configure Prisma pooling (e.g. `PgBouncer`) and potentially scale Next.js workers horizontally. |
| **Small workload** | Stable | Negligible overhead for basic operations. |
| **Medium workload** | Stable | Memory cache reduces DB pressure; async processing handles documents well. |
| **Large workload** | Tested | Dropping absolute `.count()` ensures that massive datasets do not block pagination APIs. |
| **Peak workload** | Tested | Spikes in traffic are mitigated by the sliding window rate limit (100 req/min) and LRU cache for auth data. |
| **Queue spike** | Recoverable | Background workers using state-machine status updates (`QUEUED` -> `PROCESSING`) prevent runaway execution. |
