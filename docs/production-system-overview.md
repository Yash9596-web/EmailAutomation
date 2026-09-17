# Production System Overview

## Architecture
- **Frontend / API Layer**: Next.js 16 (App Router), Vercel Edge.
- **Database**: PostgreSQL (Prisma ORM).
- **State & Queue**: Redis + BullMQ.

## Core Modules
- **Business Operations**: Inventory, Finance, Logistics.
- **Workflows**: Event-driven orchestration with autonomous Copilot recommendations.
- **SaaS**: Configurable billing limits mapped via TenantResourceQuota.
