# Disaster Recovery (DR) Plan

## 1. Objectives
- **RTO (Recovery Time Objective)**: 4 Hours
- **RPO (Recovery Point Objective)**: 15 Minutes (Maximum acceptable data loss)

## 2. Infrastructure Backup Strategy
| Component | Backup Method | Frequency | Retention |
|-----------|---------------|-----------|-----------|
| PostgreSQL Database | Continuous Archiving (WAL) + Snapshots | Daily Snapshot + 5 min WAL | 35 Days |
| Object Storage (Docs) | Cross-Region Replication | Continuous | Indefinite |
| Secrets/Config | Cloud Secrets Manager versioning | On Change | Indefinite |
| Codebase | GitHub Repository | Continuous | Indefinite |

## 3. Disaster Scenarios & Recovery

### Scenario A: Complete Database Loss / Corruption
1. Identity the exact timestamp of corruption.
2. Spin up a new PostgreSQL instance using Point-in-Time Recovery (PITR) to 1 minute prior to corruption.
3. Update `DATABASE_URL` in secrets manager.
4. Restart application containers to flush connection pools.
5. Re-run incomplete background jobs that were dropped during the lost window.

### Scenario B: Complete Region Outage (e.g., us-east-1 goes down)
1. Provision infrastructure in secondary region (e.g., us-west-2) using Infrastructure-as-Code (Terraform/CDK).
2. Restore latest DB snapshot to the new region.
3. Update DNS (Route53/Cloudflare) to point to the new Load Balancer.
4. Note: Object storage cross-region replication ensures documents remain available.

### Scenario C: Ransomware / Infrastructure Compromise
1. Revoke ALL developer and CI access.
2. Rotate all secrets (JWT, DB, OAuth).
3. Restore DB to isolated forensic VPC.
4. Rebuild infrastructure from scratch using clean Git SHAs.
