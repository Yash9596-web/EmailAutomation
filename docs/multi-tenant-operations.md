# Multi-Tenant Operations & Offboarding Runbook

## 1. Platform Operations: Suspending a Tenant

**Trigger**: Billing failure, Terms of Service violation, or Customer Request.

**Steps**:
1. Platform Admin sets `Tenant.status = 'Suspended'`.
2. **Immediate Effect**:
   - Webhook ingress returns `402 Payment Required` or `403 Forbidden` for that tenant.
   - Any currently processing JobQueue items for that tenant run to completion, but *new* scheduled items are rejected or indefinitely queued.
   - Users attempting to hit the API receive a `ForbiddenError('Tenant account is suspended')`.
3. **Reactivation**: Restore status to `Active`. The JobQueue gracefully resumes processing any backlog.

## 2. Tenant Offboarding & Archival

**Trigger**: Customer cancellation.

**Steps**:
1. **Disable Ingress**: Revoke all active Webhook URLs and API keys immediately.
2. **Revoke Integrations**: Delete `IntegrationCredential` tokens to sever access to external email/ERPs.
3. **Data Export**: Generate a secure, time-limited ZIP download of invoices and documents if mandated by customer contract.
4. **Soft Deletion**: Set `Tenant.status = 'Archived'`.
5. **Hard Deletion (After Retention Policy)**:
   - A background script deletes AWS S3 prefixes `s3://bucket/tenant-{id}/`.
   - The script deletes PostgreSQL records in chunks to avoid locking massive tables (e.g., deleting batches of 10,000 `Document` rows).

## 3. Subscription & Quota Adjustments

**Trigger**: Customer upgrades from Starter to Enterprise.

**Steps**:
1. Support updates the subscription metadata in `TenantSetting`.
2. Cache is immediately invalidated for that `tenantId`.
3. The new API/AI usage limits are enforced on the very next background job execution.
