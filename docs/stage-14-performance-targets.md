# Stage 14: Performance Targets

These targets define the success criteria for the optimization effort. Measurements simulate a production-grade infrastructure (e.g., standard Node.js clusters and managed PostgreSQL).

## 1. API Targets
- **Average Latency**: < 50ms (for read operations)
- **P95 Latency**: < 100ms
- **P99 Latency**: < 200ms
- **Auth Overhead**: < 2ms (via LRU Cache)
- **Error Rate**: < 0.1% under load

## 2. Database Targets
- **Connection Utilization**: < 80% under standard load
- **Read Query Latency**: < 5ms for standard lookups
- **Transactions**: Short-lived only (< 50ms)
- **Pagination**: Constant time (using keyset/cursors or eliminating absolute `.count()`)

## 3. Worker & Queue Targets
- **Throughput**: Support processing of 1000+ jobs/minute horizontally.
- **Queue Latency (Time in Queue)**: < 5s during normal load.
- **Concurrency**: Prevent single heavy tenants from blocking the global queue (fairness).

## 4. AI & Integration Targets
- **Time to First Response (AI)**: Dependent on provider; caching deterministic prompt/response pairs to < 10ms.
- **Email Ingestion**: Process inbound webhooks in < 200ms; defer heavy extraction to background jobs.
- **Failover**: AI endpoints should gracefully fail over within 30s timeout.

## 5. Capacity Estimates (Single Node / Basic Cluster)
- **Concurrent Requests**: 500 req/sec
- **Tenants Supported**: 1000+ (multi-tenant shared tables with appropriate tenantId indexes)
- **Data Limits**: Billions of rows supported given appropriate composite indexing on `(tenantId, createdAt)`.
