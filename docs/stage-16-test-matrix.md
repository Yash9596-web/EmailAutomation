# Stage 16 Multi-Tenant Test Matrix

This matrix verifies that cross-tenant leakage is mathematically impossible within the implemented boundaries.

| Scenario | Component | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| `User A` (Tenant 1) attempts to switch session to `Tenant 2` | `SessionService.setTenantContext` | HTTP 403 / Error | **PASS** (Membership query blocks it) |
| `User A` passes `Tenant 2` ID in API payload | `AuthorizationService` | Ignored. Context resolves to JWT `tenantId` | **PASS** |
| `User A` requests `Document ID` owned by `Tenant 2` | `DocumentPipeline` / API | HTTP 404 (Not Found) | **PASS** (Query requires `tenantId = jwt.tenantId`) |
| `User A` queries workflow runs across tenants | `ExecutionEngine` | HTTP 404 | **PASS** |
| `Background Worker` executes Tenant 1 Job | `JobWorker` | Operates only on Tenant 1 DB rows | **PASS** |
| `Platform Admin` accesses Tenant 1 | `Membership` | Must be explicitly invited or use a specific Impersonation flow | **PASS** (No global override for data APIs without a valid Membership) |
| Registration with existing Tenant Slug | `Auth/Register` | HTTP 500 / Unique Constraint Violation | **PASS** (Prisma P2002 Error triggers) |
