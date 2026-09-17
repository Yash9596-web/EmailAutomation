# Incident Response Plan

## 1. Severity Classification
- **SEV-1 (Critical)**: Platform is fully down, severe data loss, or active security breach. (SLA: 15 mins)
- **SEV-2 (Major)**: Critical business workflow (e.g., Email Ingestion, Approvals) is entirely broken for all/many tenants. (SLA: 30 mins)
- **SEV-3 (Minor)**: Degradation in performance, delayed background jobs, or single tenant issue. (SLA: 4 hours)
- **SEV-4 (Trivial)**: Cosmetic bug, minimal impact. (SLA: Next sprint)

## 2. Response Lifecycle

### 1. Detection & Triage
- Automated alerts (Datadog/NewRelic/CloudWatch) page the **On-Call Engineer**.
- Engineer validates the alert, determines Severity.
- For SEV-1/SEV-2, engineer opens a dedicated incident channel (e.g., `#inc-date-description`) and page the **Incident Commander (IC)**.

### 2. Containment & Mitigation
- Goal: Stop the bleeding. 
- Actions: Rollback deployment, scale up infrastructure, block malicious IPs, or activate maintenance mode. 
- **DO NOT** attempt a root-cause fix if a rollback provides immediate mitigation.

### 3. Investigation
- Once mitigated, collect logs (using `correlationId` from `ExecutionContext`), metrics, and database snapshots.

### 4. Recovery
- Implement the permanent fix via a Hotfix branch, run CI, deploy via standard pipeline.

### 5. Post-Incident Review (PIR)
- Within 48 hours of a SEV-1/SEV-2.
- Document Root Cause, Timeline, and Action Items.
- **Blameless**: Focus on system failures, not human errors.

## 3. Runbook: Database Outage
1. **Symptom**: `DatabaseError` (HTTP 500) spiking; `/api/v1/ready` failing.
2. **Action**: Check RDS/DB metrics. Verify connection pooler (PgBouncer) isn't exhausted.
3. **Recovery**: If primary DB failed, force failover to read-replica.

## 4. Runbook: Worker Failure (Queue Backlog)
1. **Symptom**: Alerts indicate Queue depth > 10,000 or Queue Latency > 5 mins.
2. **Action**: Check worker CPU/Memory. Check for "poison pill" jobs crashing the event loop.
3. **Recovery**: Scale horizontally. If poison pill found, manually mark the job as `FAILED` in the database to unblock the queue.
