# Multi-Tenant SaaS Organization Model

## 1. Core Model Concepts

The platform is designed around a strictly isolated SaaS architecture.

```text
Platform (Vorynex)
  └── Organization (Tenant)
       ├── Users (Linked via Memberships)
       ├── Roles & Permissions
       ├── Subscriptions / Entitlements
       ├── Settings (AI, Regional, etc.)
       ├── Business Data (Invoices, Documents)
       └── Operational Data (Workflows, Job Queues, Audit Logs)
```

## 2. Entities & Isolation

- **Tenant**: The authoritative boundary. Every resource *except* global configuration and User identities belongs to a specific `tenantId`.
- **User**: A global identity (authenticated via `email`/`password` and `Session`). A single user can belong to multiple Tenants.
- **Membership**: The intersection between a `User` and a `Tenant`. It contains the `roleId` and status (`Active` or `Suspended`), defining what the user can do inside that specific organization.
- **Role**: Tied to the platform or to the tenant. Currently, the system uses global system roles (e.g., `Admin`), but maps them to tenant-specific access via the `Membership` linkage. 

## 3. Organization Lifecycle

| Status | Definition | Access Rights |
|--------|------------|---------------|
| `Active` | Normal operational state. | All APIs and background workers process data normally. |
| `Suspended` | Temporary disablement (e.g. billing failure). | Read-only access to billing. Ingestion/AI workflows are blocked. Background queues pause. |
| `Archived` | Soft deletion. | Users cannot login to the tenant context. Data retained for compliance but inaccessible. |

*Note: True hard deletion is handled as an asynchronous background job to ensure massive cascading deletes do not lock database tables.*

## 4. Subscription & Entitlements

The `Tenant` model requires quota enforcement at the application and background-worker boundaries.
- **Limits**: Configured limits for Workflow Executions, Documents Parsed, and AI API calls.
- **Overage**: Exceeding the limits will queue the operations in a `PENDING_QUOTA` state or reject the API request with HTTP 429.

## 5. Global/System vs Tenant Resources

| Resource | Scope |
|----------|-------|
| User Profile | Global |
| OAuth Integrations | Tenant-scoped |
| Document Storage | Tenant-scoped (S3 Prefix: `/tenant-{id}/`) |
| Invoices | Tenant-scoped |
| API Keys | Tenant-scoped |
| Audit Logs | Tenant-scoped |
