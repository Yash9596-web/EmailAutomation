# Disaster Recovery Runbook

## RPO & RTO
- **RPO (Recovery Point Objective)**: 5 Minutes (driven by RDS PITR limits).
- **RTO (Recovery Time Objective)**: 15 Minutes.

## Procedures
### Database Failure
1. Initiate RDS failover to the Multi-AZ standby node.
2. Update DNS pointer if required.

### Cache / Redis Outage
1. BullMQ queues will pause gracefully. Flush Redis and restart the instance.
2. Background jobs will automatically resume via idempotencyKey lock-checks.
