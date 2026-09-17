# Production Architecture

This document describes the physical production deployment architecture for the Vorynex Technologies Manufacturing Automation Platform.

## 1. High-Level Data Flow

```text
       [ Users / API Clients ]
                 │
           [ HTTPS / 443 ]
                 │
      ┌─────────────────────┐
      │  Load Balancer (LB) │ (e.g. AWS ALB, NGINX)
      └─────────────────────┘
                 │
   ┌─────────────┴─────────────┐
   │                           │
┌──▼────────────┐        ┌─────▼─────────┐
│ Next.js Node 1│        │ Next.js Node 2│ (Auto-scaling Group / ECS / K8s)
└──────┬────────┘        └─────┬─────────┘
       │                       │
       └──────────┬────────────┘
                  │
     ┌────────────▼──────────────┐
     │ Connection Pooler (PgBouncer)│
     └────────────┬──────────────┘
                  │
         ┌────────▼───────┐
         │ PostgreSQL DB  │ (Primary / Replica)
         └────────────────┘
```

## 2. Component Details

### A. Frontend & API Server (Next.js)
- **Deployment**: Deployed as a standalone Node.js container (`server.js`).
- **Statelessness**: The application is 100% stateless. JWT sessions and LRU caches are isolated per node, with truth always falling back to the PostgreSQL database.
- **Background Workers**: The application manages a lightweight `setInterval`-based worker loop on the nodes. *Note for Scale*: At high scale (>10,000 jobs/min), background jobs should be shifted to a dedicated worker container pool.

### B. Database (PostgreSQL)
- **Role**: Primary data store, source of truth for all structured entities, sessions, and background job queues.
- **Pooling**: A connection pooler is **required** because Next.js lambda/node functions will quickly exhaust native Postgres connections under load.
- **Tenant Isolation**: Achieved logically via `tenantId` indexed columns and verified dynamically in application code (RBAC layer).

### C. Authentication (JWT / Cookie)
- **Flow**: Stateless JWTs stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- **Revocation**: Backed by a high-speed DB lookup in the `Session` table (cached in LRU memory for 60 seconds).

### D. AI & External Integrations
- **AI Providers**: External outbound API calls to LLM providers (e.g., OpenAI, Anthropic) via the `AiRequestService`.
- **Integrations**: Webhooks ingress through `/api/v1/integrations/*`. Outbound ERP syncing relies on the background worker queues.
- **Storage**: Documents and attachments are streamed directly to Object Storage (e.g. AWS S3) via signed URLs/Node streams. They are NOT stored in Postgres.

## 3. Network Boundaries & Security
- **Ingress**: Only ports 80 (redirects to 443) and 443 are publicly accessible.
- **Egress**: Nodes require internet access to communicate with AI Providers, SMTP gateways, and ERP APIs.
- **VPC**: Database and Object Storage must be placed in private subnets, accessible only from the Node instances' security groups.
