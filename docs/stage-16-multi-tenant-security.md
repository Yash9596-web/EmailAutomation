# Multi-Tenant Security Architecture

## 1. Identity & Isolation
The platform utilizes a strictly enforced logical isolation model.
- **Users**: Global identities (email/password).
- **Tenants (Organizations)**: Isolated silos of business data.
- **Memberships**: The explicit join table bridging `User` and `Tenant`.

## 2. API Level Isolation
Every API endpoint operating on business data explicitly filters queries using the session's active `tenantId`.

**Anti-Pattern Blocked**:
```typescript
// VULNERABLE: Trusting user input
const { id, tenantId } = body;
db.invoice.findFirst({ where: { id, tenantId } });
```

**Implemented Safe Pattern**:
```typescript
// SECURE: Enforced server-side context
const { tenant } = await AuthorizationService.resolveContext();
db.invoice.findFirst({ where: { id, tenantId: tenant.id } });
```

## 3. Session Security (IDOR Protection)
When a user switches organizations, the application invokes `/api/v1/organizations` (POST). 
The `SessionService.setTenantContext(tenantId)` function was explicitly hardened in Stage 16 to query `db.membership` and mathematically prove the user is an active member of `tenantId` *before* issuing the new JWT. This prevents attackers from forging a session for a tenant they do not belong to.

## 4. Storage & Storage URLs
Documents are saved to Object Storage using paths like `tenant-{tenantId}/docs/{uuid}.pdf`. S3 Signed URLs are generated dynamically by the backend only after the `tenantId` is verified, preventing enumeration of files belonging to other companies.

## 5. Background Jobs (Queue Safety)
The `JobQueue` uses the `tenantId` injected at job creation. The `JobWorker` passes this directly to background handlers (like `ExecutionEngine`). Handlers run database queries filtered exclusively by this passed context, ensuring offline operations cannot cross boundaries.
