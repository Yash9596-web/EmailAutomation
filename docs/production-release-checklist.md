# Production Release Checklist

## 1. Pre-Deployment (Staging)
- [ ] Pull request reviewed and approved.
- [ ] CI pipeline (lint, typecheck, tests) is GREEN.
- [ ] Database migration script generated and reviewed by DB team/lead.
- [ ] Migration applied and smoke-tested against a staging database.
- [ ] Secrets (if any new ones are introduced) added to the production secrets manager.

## 2. Deployment (Production)
- [ ] Notify stakeholders in `#deployments` channel.
- [ ] Perform manual RDS/Database Snapshot if a heavy data migration is involved.
- [ ] Run Database Migration `npx prisma migrate deploy` in the migration task runner.
- [ ] Trigger Rolling Update of Docker containers (`vorynex-automation:<version>`).

## 3. Post-Deployment Validation
- [ ] Verify `/api/v1/health` and `/api/v1/ready` endpoints return 200 OK.
- [ ] Perform a manual login via the UI (or automated E2E smoke test).
- [ ] Verify no unexpected spikes in 5xx errors in Datadog/Monitoring.
- [ ] Monitor background job queues for 5 minutes to ensure worker processing resumed.

## 4. Rollback (If needed)
- [ ] If 5xx errors spike > 2% or critical paths fail, immediately revert the Docker container tag in the orchestrator.
- [ ] Refer to `/docs/production-rollback.md` for full DB recovery steps if required.
