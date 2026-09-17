# Production Rollback Procedure

## 1. Trigger Criteria
A rollback must be initiated immediately if:
- API Error Rate exceeds 5% within a 5-minute window.
- Database Migration induces a lock causing P99 latency > 2000ms.
- Authentication/SSO integrations fail for > 10% of tenants.
- Severe Data Leakage or Cross-Tenant boundary violations are suspected.

## 2. Infrastructure Rollback (Frontend/API)
1. In the Vercel/Cloudflare dashboard, identify the last known stable deployment hash (e.g. Stage 39 build).
2. Click **Promote to Production** on the previous stable build to instantly revert Edge routing.

## 3. Database State Reversion
1. If Prisma schema changes were purely additive, do NOT revert the database. Simply leave the new columns unpopulated.
2. If Prisma schema changes were destructive/mutative, execute a Point-in-Time-Recovery (PITR) on the PostgreSQL RDS instance to exactly 1 minute prior to the deployment timestamp.

## 4. Background Workers & Sync Queues
1. Stop the BullMQ/Redis worker instances.
2. Flush the IntegrationSyncQueue to prevent poisoned sync states from the external ERP.
3. Restart the workers using the downgraded container image.
